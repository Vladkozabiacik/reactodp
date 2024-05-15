import React, { useState, useEffect } from 'react';
import ChatCard from './ChatCard.js';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [newChatId, setNewChatId] = useState('');
    const [password, setPassword] = useState('');
    const [userId, setUserId] = useState(null);
    const [isNameInput, setIsNameInput] = useState(false); // State to track whether chat name or chat ID input is active

    const getCookie = (name) => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [key, value] = cookie.split('=');
            if (key.trim() === name) {
                return value;
            }
        }
        return null;
    };

    useEffect(() => {
        const id = getCookie('user_id');
        if (!id) {
            console.error('User ID not available');
            return;
        }
        setUserId(id);

        fetch(`http://10.1.3.183:3001/chats?userId=${id}`)
            .then(response => response.json())
            .then(data => setChats(data))
            .catch(error => console.error('Error fetching chats:', error));
    }, []);

    const handleAddChat = () => {
        if (!userId) {
            console.error('User ID not available');
            return;
        }

        const requestBody = isNameInput ? { chatName: newChatId, password: password } : { chatId: newChatId, password: password };

        fetch(`http://10.1.3.183:3001/users/${userId}/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
            .then(response => {
                if (response.ok) {
                    console.log('Chat added successfully');
                } else {
                    console.error('Failed to add chat');
                }
            })
            .catch(error => {
                console.error('Error adding chat:', error);
            });
    };

    return (
        <div>
            <h2>Your chats</h2>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '20rem' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={isNameInput}
                        onChange={() => setIsNameInput(!isNameInput)}
                    />
                    Join by Chat ID
                </label>
                <br />
                {isNameInput ? (
                    <div>
                        <label>
                            Chat ID:
                            <input
                                type="text"
                                value={newChatId}
                                onChange={e => setNewChatId(e.target.value)}
                                placeholder="Enter Chat ID"
                            />
                        </label>
                    </div>
                ) : (
                    <div>
                        <label>
                            Chat Name:
                            <input
                                type="text"
                                value={newChatId}
                                onChange={e => setNewChatId(e.target.value)}
                                placeholder="Enter Chat name"
                            />
                        </label>
                    </div>
                )}
                <div>
                    <label>
                        Password:
                        <input
                            className="create-chat-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </label>
                </div>
            </div>
            <button onClick={handleAddChat}>Add Chat</button>
            <div className="card-list">
                {chats.map(chat => (
                    <ChatCard key={chat.chat_id} chat={chat} />
                ))}
            </div>
        </div>
    );
};

export default ChatList;
