import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './EditBunker.css';

axios.defaults.withCredentials = true;

function EditBunker() {
    const { bunkerId } = useParams();
    const navigate = useNavigate();
    const [csrfToken, setCsrfToken] = useState('');
    const [formData, setFormData] = useState({
        number: '',
        capacity: '',
        temperature: '',
        humidity: '',
        max_capacity: '', // Add max_capacity field
    });

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

        const fetchBunker = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/bunkers/${bunkerId}/`);
                setFormData({
                    number: response.data.number || '',
                    capacity: response.data.capacity || '',
                    temperature: response.data.temperature || '',
                    humidity: response.data.humidity || '',
                    max_capacity: response.data.max_capacity || '', // Set max_capacity from response
                });
            } catch (error) {
                console.error('Failed to fetch bunker data:', error);
            }
        };
        fetchBunker();
    }, [bunkerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    const handleAutoFill = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/bunkers/${bunkerId}/autofill/`);
            setFormData((prevFormData) => ({
                ...prevFormData,
                ...response.data,
            }));
        } catch (error) {
            console.error('Failed to autofill data:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8000/api/bunkers/${bunkerId}/update/`, formData, {
                headers: {
                    'X-CSRFToken': csrfToken,
                },
            });
            Swal.fire('Success', 'Bunker updated successfully', 'success').then(() => {
                navigate(`/`);
            });
        } catch (error) {
            console.error('Failed to update bunker:', error);
            Swal.fire('Error', 'Failed to update bunker', 'error');
        }
    };

    return (
        <div className="edit-bunker">
            <h1>Edit Bunker</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Number:
                    <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Temperature:
                    <input
                        type="number"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    Humidity:
                    <input
                        type="number"
                        name="humidity"
                        value={formData.humidity}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    Capacity:
                    <input
                        type="number"
                        name="max_capacity"
                        value={formData.max_capacity}
                        onChange={handleChange}
                    />
                </label>
                <button type="button" onClick={handleAutoFill}>Auto-Fill</button>
                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
}

export default EditBunker;
