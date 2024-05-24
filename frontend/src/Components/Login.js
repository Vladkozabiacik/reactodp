import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = isRegistering ? `http://${process.env.REACT_APP_HOST}:3001/register` : `http://${process.env.REACT_APP_HOST}:3001/login`;
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
                document.cookie = `username=${data.user.username};`;
                document.cookie = `user_id=${data.user.userId};`;
                setSuccess(isRegistering ? 'Registration successful!' : 'Login successful!');
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className={`register ${isDarkMode ? 'dark' : ''}`}>
            {isRegistering ? (
                <div>
                    <h2>Register</h2>
                    <form onSubmit={handleFormSubmit} className='formular'>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit">Register</button>
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                    </form>
                    <div className='swap'>
                        <p>
                            Already have an account?
                        </p>
                        <button onClick={() => setIsRegistering(false)}>
                            Login
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Login</h2>
                    <form onSubmit={handleFormSubmit} className='formular'>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit">Login</button>
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                    </form>
                    <div className='swap'>
                        <p>
                            Don't have an account?
                        </p>
                        <button onClick={() => setIsRegistering(true)}>
                            Register
                        </button>
                    </div>
                </div>
            )}
            <button
                className="dark-mode-toggle"
                onClick={() => setIsDarkMode(!isDarkMode)}
            >
                {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
        </div>
    );
};

export default Login;
