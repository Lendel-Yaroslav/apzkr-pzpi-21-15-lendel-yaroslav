import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './AddElevator.css';

function AddElevator() {
    const [formData, setFormData] = useState({
        el_name: '',
        num_bunkers: '',
        bunker_capacity: ''
    });
    const [csrfToken, setCsrfToken] = useState('');
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            el_name: formData.el_name,
            num_bunkers: parseInt(formData.num_bunkers, 10),
            bunker_capacity: parseInt(formData.bunker_capacity, 10),
        };

        console.log('Form Data:', data);

        try {
            const response = await axios.post('/add_elevator/', data, {
                headers: {
                    'X-CSRFToken': csrfToken,
                }
            });

            Swal.fire('Успіх!', 'Елеватор додано.', 'success');
            setFormData({
                el_name: '',
                num_bunkers: '',
                bunker_capacity: ''
            });
            navigate('/');
        } catch (error) {
            console.error('Error adding elevator:', error.response ? error.response.data : error.message);
            Swal.fire('Помилка!', 'Не вдалося додати елеватор.', 'error');
        }
    };

    return (
        <div className="container">
            <h2>Додати елеватор</h2>
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

                <label htmlFor="id_num_bunkers">Кількість бункерів:</label>
                <input
                    type="number"
                    id="id_num_bunkers"
                    name="num_bunkers"
                    value={formData.num_bunkers}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="id_bunker_capacity">Ємність бункера:</label>
                <input
                    type="number"
                    id="id_bunker_capacity"
                    name="bunker_capacity"
                    value={formData.bunker_capacity}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Додати</button>
            </form>
        </div>
    );
}

export default AddElevator;
