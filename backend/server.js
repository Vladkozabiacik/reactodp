const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const pool = require('./config/dbConfig.js');

const app = express();
const port = 3001;

app.use(cors(), bodyParser.json(), session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
// login and register
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
            const authToken = jwt.sign({ userId: user.user_id }, 'your_secret_key', { expiresIn: '1h' });
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

// chats and messages
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
    const { chatId } = req.body;
    try {
        const client = await pool.connect();

        const chatExistsQuery = 'SELECT COUNT(*) FROM chats WHERE chat_id = $1';
        const chatExistsResult = await client.query(chatExistsQuery, [chatId]);
        const chatExists = chatExistsResult.rows[0].count > 0;

        if (!chatExists) {
            client.release();
            return res.status(404).json({ message: 'Chat not found' });
        }

        await client.query(
            'UPDATE Users SET user_chats = user_chats || $1 WHERE user_id = $2',
            [[chatId], userId]
        );

        client.release();
        res.status(200).json({ message: 'Chat ID added to user chats successfully' });
    } catch (error) {
        console.error('Error adding chat ID to user chats:', error);
        res.status(500).json({ message: 'Error adding chat ID to user chats' });
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


// WebSocket server
const wss = new WebSocket.Server({ port: 3030 });

wss.on('connection', async function connection(ws, req) {
    try {
        const queryParams = new URL(req.url, 'http://localhost').searchParams;
        const conversationId = queryParams.get('conversation_id');
        if (!conversationId) {
            throw new Error('Conversation ID is missing.');
        }

        // Fetch messages related to the conversation_id
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM Messages JOIN Users ON Messages.user_id = Users.user_id WHERE Messages.conversation_id = $1 ORDER BY Messages.timestamp DESC LIMIT 10;', [conversationId]);
        client.release();
        result.rows.forEach(message => {
            ws.send(JSON.stringify(message));
        });

        // Handle incoming messages from the client
        ws.on('message', async function incoming(data) {
            try {
                const message = JSON.parse(data);
                console.log(message);
                if (message.user_id && message.content) {
                    // Insert the received message into the database
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

            // Broadcast the message to all clients
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


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});