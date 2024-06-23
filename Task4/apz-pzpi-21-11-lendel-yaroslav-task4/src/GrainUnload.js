import React, { useEffect, useState } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const GrainUnload = () => {
    const [elevators, setElevators] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [selectedElevator, setSelectedElevator] = useState('');
    const [selectedTank, setSelectedTank] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        fetch('/api/elevators/')
            .then(response => response.json())
            .then(data => setElevators(data))
            .catch(error => console.error('Error fetching elevators:', error));
    }, []);

    useEffect(() => {
        if (selectedElevator) {
            fetch(`/api/load_bunkers/?elevator=${selectedElevator}`)
                .then(response => response.json())
                .then(data => setTanks(data))
                .catch(error => console.error('Error fetching tanks:', error));
        }
    }, [selectedElevator]);

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get('/csrf-token/');
                setCsrfToken(response.data.csrfToken);
            } catch (error) {
                console.error('Failed to fetch CSRF token:', error);
            }
        };
        fetchCsrfToken();
    }, []);

    const handleUnload = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post(
                `/api/tankgrains/${selectedTank}/unload_grain/`,
                { amount },
                {
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                }
            );

            if (response.data.error) {
                setMessage(`Error: ${response.data.error}`);
            } else {
                setMessage(`Success: ${response.data.message}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div>
            <h1>Відвантаження зерна</h1>
            <form onSubmit={handleUnload}>
                <label htmlFor="elevator">Елеватор:</label>
                <select
                    id="elevator"
                    value={selectedElevator}
                    onChange={e => setSelectedElevator(e.target.value)}
                    required
                >
                    <option value="">Оберіть елеватор</option>
                    {elevators.map(elevator => (
                        <option key={elevator.id} value={elevator.id}>
                            {elevator.el_name}
                        </option>
                    ))}
                </select>
                <br />

                <label htmlFor="tank">Бункер:</label>
                <select
                    id="tank"
                    value={selectedTank}
                    onChange={e => setSelectedTank(e.target.value)}
                    required
                >
                    <option value="">Оберіть бункер</option>
                    {tanks.map(tank => (
                        <option key={tank.id} value={tank.id}>
                            {tank.number} - {tank.capacity}
                        </option>
                    ))}
                </select>
                <br />

                <label htmlFor="amount">Кількість зерна:</label>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="1"
                    required
                />
                <br />

                <button type="submit">Відвантажити</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default GrainUnload;
