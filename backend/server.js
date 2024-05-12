const WebSocket = require('ws');
const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');

const pool = new Pool({
    user: 'postgres',
    host: '',
    database: 'postgres',
    password: '',
    port: 5432, // Default PostgreSQL port
});

const app = express();
const port = 3001;

// Session middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Middleware to check if user is logged in
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdAt = new Date();
        await pool.query(
            'INSERT INTO Users (username, email, password, created_at) VALUES ($1, $2, $3, $4)',
            [username, email, hashedPassword, createdAt]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});



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
            req.session.user = { email, username: user.username };

            return res.status(200).json({ message: 'Login successful', authToken, user: req.session.user });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        return res.status(500).json({ message: 'Error authenticating user' });
    }
});
app.get('/messages', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM Messages ORDER BY timestamp DESC LIMIT 10');
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
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM Messages JOIN Users ON Messages.user_id = Users.user_id ORDER BY Messages.timestamp DESC LIMIT 10;');
        client.release();
        // Assuming `result.rows` contains the messages
        result.rows.forEach(message => {
            ws.send(JSON.stringify(message)); // Send each message individually
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        // Sending an error message to the client
        ws.send(JSON.stringify({ error: 'Error fetching messages' }));
    }
    // Rest of your WebSocket logic
    ws.on('message', async function incoming(data) {
        try {
            // Access session data from the WebSocket handshake request
            const sessionData = req.session;
            const message = JSON.parse(data);
            // Check for null fields before inserting into the database
            if (message.conversation_id && message.user_id && message.message) {
                console.log(message);
                // Insert the received message into the Messages table
                const client = await pool.connect();
                await client.query(
                    'INSERT INTO Messages (conversation_id, user_id, content, timestamp) VALUES ($1, $2, $3, $4)',
                    [message.conversation_id, message.user_id, message.message, new Date()]
                );
                client.release();
            } else {
                console.error('One or more fields are null. Message not inserted.');
            }
        } catch (error) {
            console.error('Error inserting message:', error);
        }
    
        // Broadcast the received message to all connected clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
    
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});