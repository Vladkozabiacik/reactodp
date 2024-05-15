import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
const ChatProfile = () => {
    const { chat_id } = useParams();
    const [chatInfo, setChatInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChatInfo = async () => {
            try {
                const response = await fetch(`http://10.1.3.183:3001/chat/profile/${chat_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chat information');
                }
                const data = await response.json();
                setChatInfo(data);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchChatInfo();

        return () => {
        };
    }, [chat_id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!chatInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Link to={`/chat/${chatInfo.chat_id}`}>
                <button>Go back to Chat</button>
            </Link>
            <h2>Chat Profile</h2>
            <p>Chat ID: {chatInfo.chat_id}</p>
            <p>Chat Name: {chatInfo.name}</p>
        </div>
    );
};

export default ChatProfile;
