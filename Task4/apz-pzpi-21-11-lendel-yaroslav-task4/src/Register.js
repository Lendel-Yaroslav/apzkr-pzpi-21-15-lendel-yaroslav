import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password1: '',
        password2: ''
    });

    const [errorMessages, setErrorMessages] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');

        try {
            const response = await axios.post('http://localhost:8000/register/', formData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.success) {
                setSuccessMessage('Реєстрація успішна! Перенаправляємо на сторінку входу...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setErrorMessages(response.data.errors || {});
            }
        } catch (error) {
            console.error('Сталася помилка!', error);
            if (error.response && error.response.data) {
                const serverErrors = error.response.data;
                setErrorMessages(serverErrors.errors || { form: serverErrors.detail || 'Сталася непередбачувана помилка. Спробуйте ще раз пізніше.' });
            } else {
                setErrorMessages({ form: 'Сталася непередбачувана помилка. Спробуйте ще раз пізніше.' });
            }
        }
    };

    return (
        <div className="container">
            <h2 className="form-title">Реєстрація</h2>
            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Ім'я користувача"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.username && <div className="error-message">{errorMessages.username}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Електронна пошта"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.email && <div className="error-message">{errorMessages.email}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        placeholder="Ім'я"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.first_name && <div className="error-message">{errorMessages.first_name}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        placeholder="Прізвище"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.last_name && <div className="error-message">{errorMessages.last_name}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        id="password1"
                        name="password1"
                        placeholder="Пароль"
                        value={formData.password1}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.password1 && <div className="error-message">{errorMessages.password1}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        id="password2"
                        name="password2"
                        placeholder="Підтвердження пароля"
                        value={formData.password2}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    {errorMessages.password2 && <div className="error-message">{errorMessages.password2}</div>}
                </div>

                <div className="form-group">
                    <input
                        type="submit"
                        id="register-button"
                        name="register-button"
                        value="Зареєструватися"
                        className="form-button"
                    />
                </div>
                {successMessage && <div className="success-message">{successMessage}</div>}
                {errorMessages.form && <div className="error-message">{errorMessages.form}</div>}
                <div className="no-account">
                    <span className="already-have-account">Вже є обліковий запис?</span>
                    <a className="login-button" href="/login">Увійти</a>
                </div>
            </form>
        </div>
    );
}

export default Register;
