import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isRegistering ? 'http://10.1.3.183:3001/register' : 'http://10.1.3.183:3001/login'; // Update the URL here
            const body = isRegistering ? { username, email, password } : { email, password }; // Assuming 'username' is required only for registration
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (response.ok) {
                onLogin(data.authToken);
                document.cookie = `username=${data.user.username};`;
                document.cookie = `user_id=${data.user.userId};`;
            } else {
                console.error('Error:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <h2>{isRegistering ? 'Register' : 'Login'}</h2>
            <form onSubmit={handleFormSubmit}>
                {isRegistering && (
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                )}
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
            </form>
            <p onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
            </p>
        </div>
    );
};

export default Login;
