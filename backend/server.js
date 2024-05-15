const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const pool = require('./config/dbConfig.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const websocketPort = process.env.WEBSOCKET_PORT || 3030;
const host = process.env.HOST || '0.0.0.0';
const secretKey = process.env.SECRET_KEY || 'default_secret_key';

app.use(cors(), bodyParser.json(), session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));

// login and register endpoints
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT user_id, username, password FROM Users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const authToken = jwt.sign({ userId: user.user_id }, secretKey, { expiresIn: '1h' });
            req.session.isLoggedIn = true;
            req.session.user = { email, username: user.username, userId: user.user_id };

            return res.status(200).json({ message: 'Login successful', authToken, user: req.session.user });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(500).json({ message: 'Error authenticating user' });
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO Users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// chats and messages endpoints
app.get('/chats', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ message: 'User ID not provided' });
    }
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT c.name, c.chat_id FROM users u, chats c WHERE u.user_id = $1 AND c.chat_id = ANY(u.user_chats)',
            [userId]
        );

        client.release();
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ message: 'Error fetching user chats' });
    }
});

app.post('/users/:userId/chats', async (req, res) => {
    const userId = req.params.userId;
    const { chatId, chatName, password } = req.body;
    let client;

    try {
        client = await pool.connect();

        let chatExistsQuery, chatIdParam;
        if (chatId) {
            chatExistsQuery = 'SELECT COUNT(*) FROM chats WHERE chat_id = $1';
            chatIdParam = chatId;
        } else if (chatName) {
            chatExistsQuery = 'SELECT COUNT(*) FROM chats WHERE name = $1';
            chatIdParam = chatName;
        } else {
            client.release();
            return res.status(400).json({ message: 'Chat ID or name is required' });
        }

        const chatExistsResult = await client.query(chatExistsQuery, [chatIdParam]);
        const chatExists = chatExistsResult.rows[0].count > 0;

        if (!chatExists) {
            client.release();
            return res.status(404).json({ message: 'Chat not found' });
        }

        let getPasswordQuery;
        if (chatId) {
            getPasswordQuery = 'SELECT password_hash FROM chats WHERE chat_id = $1';
        } else if (chatName) {
            getPasswordQuery = 'SELECT password_hash FROM chats WHERE name = $1';
        }

        const passwordResult = await client.query(getPasswordQuery, [chatIdParam]);
        const dbPassword = passwordResult.rows[0].password_hash;

        if (password && !bcrypt.compareSync(password, dbPassword)) {
            client.release();
            return res.status(401).json({ message: 'Incorrect password' });
        }

        let chatIdQueryResult;
        if (!chatId) {
            chatIdQueryResult = await client.query('SELECT chat_id FROM chats WHERE name = $1', [chatIdParam]);
            chatIdParam = chatIdQueryResult.rows[0].chat_id;
        }

        const updateQuery = `
            UPDATE Users 
            SET user_chats = user_chats || $1::bigint
            WHERE user_id = $2
            AND array_position(user_chats, $1::bigint) IS NULL
            RETURNING user_chats;
        `;

        const result = await client.query(updateQuery, [chatIdParam, userId]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Chat ID already exists in user chats' });
        }

        res.status(200).json({ message: 'Chat ID added to user chats successfully', user_chats: result.rows[0].user_chats });
    } catch (error) {
        console.error('Error adding chat ID to user chats:', error);
        res.status(500).json({ message: 'Error adding chat ID to user chats' });
    } finally {
        if (client) {
            client.release();
        }
    }
});



app.get('/chat/profile/:chat_id', async (req, res) => {
    const chatId = parseInt(req.params.chat_id);

    try {
        const query = 'SELECT chat_id, name FROM chats WHERE chat_id = $1';
        const { rows } = await pool.query(query, [chatId]);

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Chat not found' });
        }
    } catch (error) {
        console.error('Error retrieving chat information:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/messages/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM Messages WHERE chat_id = $1 ORDER BY timestamp DESC LIMIT 10', [chatId]);

        client.release();
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

app.post('/createChat', async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).send({ message: 'Chat name and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const queryText = 'INSERT INTO chats (name, password_hash) VALUES ($1, $2) RETURNING chat_id, name';
        const { rows } = await pool.query(queryText, [name, hashedPassword]);

        res.status(201).send({ message: 'Chat created successfully!', chatId: rows[0].chat_id, chatName: rows[0].name });
    } catch (error) {
        console.error('Failed to create chat:', error);
        res.status(500).send({ message: 'Failed to create chat' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://${host}:${port}`);
});

// WebSocket server
const wss = new WebSocket.Server({ port: websocketPort, host });

wss.on('connection', async function connection(ws, req) {
    try {
        const queryParams = new URL(req.url, 'http://localhost').searchParams;
        const conversationId = queryParams.get('conversation_id');
        if (!conversationId) {
            throw new Error('Conversation ID is missing.');
        }

        const client = await pool.connect();
        const result = await client.query('SELECT * FROM Messages JOIN Users ON Messages.user_id = Users.user_id WHERE Messages.conversation_id = $1 ORDER BY Messages.timestamp DESC LIMIT 10;', [conversationId]);
        client.release();
        result.rows.forEach(message => {
            ws.send(JSON.stringify(message));
        });

        ws.on('message', async function incoming(data) {
            try {
                const message = JSON.parse(data);
                if (message.user_id && message.content) {
                    const client = await pool.connect();
                    await client.query(
                        'INSERT INTO Messages (conversation_id, user_id, content) VALUES ($1, $2, $3)',
                        [conversationId, message.user_id, message.content]
                    );
                    client.release();
                } else {
                    console.error('One or more fields are null. Message not inserted.');
                }
            } catch (error) {
                console.error('Error inserting message:', error);
            }

            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        });
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        ws.send(JSON.stringify({ error: 'Error handling WebSocket connection' }));
    }
});
