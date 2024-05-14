import React, { useEffect } from 'react';
import ChatList from './ChatList';

const Dashboard = ({ onLogout }) => {
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            onLogout();
        }
    }, [onLogout]);

    const handleLogout = () => {
        onLogout();
    };

    return (
        <div>
            <div className="chat-dashboard">
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div>
                <ChatList />
            </div>
        </div>
    );
};

export default Dashboard;
