import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

function AddBunker() {
    const [capacity, setCapacity] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const navigate = useNavigate();
    const { elevatorId } = useParams();

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:8000/api/elevators/${elevatorId}/add_bunker/`, { max_capacity: capacity }, {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
            });
            navigate('/');
        } catch (error) {
            console.error('Error adding bunker:', error);
            Swal.fire('Помилка!', 'Не вдалося додати бункер.', 'error');
        }
    };

    return (
        <div className="container">
            <h1>Додати Бункер</h1>
            <form onSubmit={handleSubmit} className="add-bunker-form">
                <div className="form-group">
                    <label htmlFor="capacity">Вместимость</label>
                    <input
                        type="number"
                        id="capacity"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="button add-button">Додати</button>
            </form>
        </div>
    );
}

export default AddBunker;
