import React from 'react';
import { Link } from 'react-router-dom';
import './ChatCard.css'; 
const ChatCard = ({ chat }) => {
    return (
        <div className="card">
            <h3 className='header-chat-name'>{chat.name}</h3>
            <Link to={`/chat/${chat.chat_id}`}>
                <button className='go-to-chat-button'>Go to Chat</button>
            </Link>
        </div>
    );
};

export default ChatCard;
