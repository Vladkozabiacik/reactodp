import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isRegistering ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
            const body = isRegistering ? { username, email, password } : { email, password };
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
