import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get('http://localhost:8000/csrf-token/');
                setCsrfToken(response.data.csrfToken);
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            }
        };
        fetchCsrfToken();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');

        if (/^\d+$/.test(username)) {
            setErrorMessage('Username cannot be a number');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/login/',
                { username, password },
                { headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken } }
            );
            console.log(response.data);
            if (response.data.message) {
                navigate('/');  // Перенаправляем на домашнюю страницу
            } else {
                setErrorMessage(response.data.error || 'Invalid username or password');
            }
        } catch (error) {
            console.error('There was an error!', error);
            setErrorMessage('Invalid username or password');
        }
    };

    return (

        <div className="container">
            <input type="hidden" name="csrfmiddlewaretoken" value="{{ csrf_token }}"/>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="submit"
                        id="login-button"
                        name="login-button"
                        value="Login"
                    />
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <div>
                    <span>Don't have an account?</span>
                    <Link className="register-button" to="/register">Register</Link>
                </div>
            </form>
        </div>
    );
}

export default Login;
