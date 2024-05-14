import React from 'react';
import { Link } from 'react-router-dom';

const ChatCard = ({ chat }) => {
    return (
        <div className="card">
            <h3>{chat.name}</h3>
            <Link to={`/chat/${chat.chat_id}`}>
                <button>Go to Chat</button>
            </Link>
        </div>
    );
};

export default ChatCard;
