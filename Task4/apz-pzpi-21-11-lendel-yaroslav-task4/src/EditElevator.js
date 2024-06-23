import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import './AddElevator.css';

function EditElevator() {
    const [formData, setFormData] = useState({ el_name: '' });
    const [csrfToken, setCsrfToken] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams(); // отримуємо ID з URL

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get('/csrf-token/');
                setCsrfToken(response.data.csrfToken);
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
                Swal.fire('Помилка!', 'Не вдалося отримати CSRF токен.', 'error');
            }
        };
        fetchCsrfToken();
    }, []);

    useEffect(() => {
        const fetchElevatorData = async () => {
            try {
                const response = await axios.get(`/api/elevators/${id}/edit/`);
                setFormData({ el_name: response.data.el_name });
            } catch (error) {
                console.error('Error fetching elevator data:', error);
                Swal.fire('Помилка!', 'Не вдалося завантажити дані елеватора.', 'error');
            }
        };
        fetchElevatorData();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!csrfToken) {
            Swal.fire('Помилка!', 'CSRF токен не знайдено.', 'error');
            return;
        }

        try {
            const response = await axios.put(`/api/elevators/${id}/edit/`, formData, {
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include'
            });
            Swal.fire('Успіх!', 'Елеватор змінено.', 'success');
            setFormData({ el_name: '' });
            navigate('/');
        } catch (error) {
            Swal.fire('Помилка!', 'Не вдалося змінити елеватор.', 'error');
        }
    };

    return (
        <div className="container">
            <h2>Змінити елеватор</h2>
            <form id="elevatorForm" onSubmit={handleSubmit}>
                <label htmlFor="id_el_name">Назва елеватора:</label>
                <input
                    type="text"
                    id="id_el_name"
                    name="el_name"
                    value={formData.el_name}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Змінити</button>
            </form>
        </div>
    );
}

export default EditElevator;
