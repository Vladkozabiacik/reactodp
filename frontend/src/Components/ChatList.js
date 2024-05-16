import React, { useState, useEffect, useRef } from 'react';
import ChatCard from './ChatCard.js';
import './ChatList.css';
import SearchBar from './SearchBar.js';

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [newChatId, setNewChatId] = useState('');
    const [password, setPassword] = useState('');
    const [userId, setUserId] = useState(null);
    const [isNameInput, setIsNameInput] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const chatListRef = useRef(null);

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

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const filteredChats = chats.filter(chat => {
        return chat.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        const id = getCookie('user_id');
        if (!id) {
            console.error('User ID not available');
            return;
        }
        setUserId(id);

        fetch(`http://${process.env.REACT_APP_HOST}:3001/chats?userId=${id}`)
            .then(response => response.json())
            .then(data => setChats(data))
            .catch(error => console.error('Error fetching chats:', error));
    }, []);

    const handleAddChat = () => {
        if (!userId) {
            console.error('User ID not available');
            return;
        }

        const requestBody = isNameInput
            ? { chatId: newChatId, password: password }
            : { chatName: newChatId, password: password };

        fetch(`http://${process.env.REACT_APP_HOST}:3001/users/${userId}/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
            .then(response => {
                if (response.ok) {
                    setSuccess(true);
                    setError(null);
                    console.log('Chat added successfully');
                    setTimeout(() => {
                        setSuccess(false);
                    }, 3000);
                    return fetch(`http://${process.env.REACT_APP_HOST}:3001/chats?userId=${userId}`);
                } else {
                    setError('Failed to add chat');
                    setSuccess(false);
                    console.error('Failed to add chat');
                }
            })
            .then(response => response.json())
            .then(data => {
                setChats(data);
                setTimeout(() => {
                    scrollToBottom();
                }, 1000);
            })
            .catch(error => {
                setError('Error adding chat');
                setSuccess(false);
                console.error('Error adding chat:', error);
                setTimeout(() => {
                    setError(null);
                }, 3000);
            });
    };

    const scrollToBottom = () => {
        if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
        }
    };

    return (
        <div>
            <h2>Your Chats</h2>
            <div className='chat-list-wrapper'>
                <label>
                    <input
                        type="checkbox"
                        checked={isNameInput}
                        onChange={() => setIsNameInput(!isNameInput)}
                        autoComplete="off"
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
                                autoComplete="off"
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
                                placeholder="Enter Chat Name"
                                autoComplete="off"
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
                            autoComplete="new-password"
                        />
                    </label>
                </div>
                <button onClick={handleAddChat} className='add-chat-button'>Add Chat</button>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Chat added successfully!</p>}
            </div>
            <div ref={chatListRef} className="card-list">
                <SearchBar onSearch={handleSearch} />
                {filteredChats.map(chat => (
                    <ChatCard key={chat.chat_id} chat={chat} />
                ))}
            </div>
        </div>
    );
};

export default ChatList;
