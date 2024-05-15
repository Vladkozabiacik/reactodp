import React, { useState } from 'react';
import './CreateChat.css';

const CreateChat = () => {
    const [chatName, setChatName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [chatId, setChatId] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`http://${process.env.REACT_APP_HOST}:3001/createChat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: chatName, password: password }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to create chat');
            }

            setSuccess(true);
            setChatId(responseData.chatId);
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error) {
            setError(error.message);
            setTimeout(() => {
                setError(null);
            }, 3000);
        }
    };

    return (
        <div className="create-chat-container">
            <h2 className="create-chat-title">Create a New Chat</h2>
            <form className="create-chat-form" onSubmit={handleSubmit}>
                <div>
                    <label className="create-chat-label">
                        Chat Name:
                        <input
                            className="create-chat-input"
                            type="text"
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label className="create-chat-label">
                        Password:
                        <input
                            className="create-chat-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <button className="create-chat-button" type="submit">Create Chat</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">Chat "{chatName}" with ID: {chatId} created successfully!</p>}
        </div>
    );
};

export default CreateChat;
