import React, { useState, useEffect } from 'react';
import ChatCard from './ChatCard.js';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [newChatId, setNewChatId] = useState('');
    const [userId, setUserId] = useState(null);

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

        fetch(`http://10.1.3.183:3001/users/${userId}/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatId: newChatId }),
        })
            .then(response => {
                if (response.ok) {
                    console.log('Chat ID added successfully');
                } else {
                    console.error('Failed to add chat ID');
                }
            })
            .catch(error => {
                console.error('Error adding chat ID:', error);
            });
    };

    return (
        <div>
            <h2>Chat List</h2>
            <div>
                <button onClick={handleAddChat}>Add Chat</button>
                <input
                    type="text"
                    value={newChatId}
                    onChange={e => setNewChatId(e.target.value)}
                    placeholder="Enter Chat ID"
                />
            </div>
            <div className="card-list">
                {chats.map(chat => (
                    <ChatCard key={chat.chat_id} chat={chat} />
                ))}
            </div>
        </div>
    );
};

export default ChatList;
