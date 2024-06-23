import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddGrain() {
    const [grainForm, setGrainForm] = useState({
        sort: '',
        type: '',
        num_grains: '',
        elevator: '',
        bunker: ''
    });
    const [userElevators, setUserElevators] = useState([]);
    const [userBunkers, setUserBunkers] = useState([]);
    const navigate = useNavigate();

    const grainTypes = [
        { type: 1, display_name: 'Пшениця' },
        { type: 2, display_name: 'Пшено' },
        { type: 3, display_name: 'Рапс' },
        { type: 4, display_name: 'Подсонечник' },
        { type: 5, display_name: 'Кукурудза' },
        { type: 6, display_name: 'Овес' },
        { type: 7, display_name: 'Сорго' },
    ];

    const sortChoices = [
        { value: 1, label: '1 сорт' },
        { value: 2, label: '2 сорт' },
        { value: 3, label: '3 сорт' },
        { value: 4, label: '4 сорт' },
        { value: 5, label: '5 сорт (кормове зерно)' },
    ];

    useEffect(() => {
        const fetchUserElevatorsAndBunkers = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/elevators/');
                const elevators = response.data;
                setUserElevators(elevators);

                const elevatorIds = elevators.map(elevator => elevator.id);
                const bunkerResponses = await Promise.all(
                    elevatorIds.map(elevatorId => axios.get(`http://localhost:8000/api/elevators/${elevatorId}/bunkers/`))
                );
                const bunkers = bunkerResponses.flatMap(response => response.data.map(bunker => ({
                    ...bunker,
                    elevator: response.config.url.split('/')[5]  // Extract elevator ID from URL
                })));
                const bunkersWithElevatorNames = bunkers.map(bunker => {
                    const elevator = elevators.find(e => e.id === parseInt(bunker.elevator, 10));
                    return {
                        ...bunker,
                        elevatorName: elevator ? elevator.el_name : 'Unknown Elevator'
                    };
                });
                setUserBunkers(bunkersWithElevatorNames);
            } catch (error) {
                console.error('Failed to fetch user elevators and bunkers:', error);
            }
        };

        fetchUserElevatorsAndBunkers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGrainForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new URLSearchParams();
        data.append('elevator', grainForm.elevator);
        data.append('bunker', grainForm.bunker);
        data.append('num_grains', grainForm.num_grains);
        data.append('sort', grainForm.sort);
        data.append('type', grainForm.type);

        try {
            console.log('Form data:', data);
            const response = await axios.post('http://localhost:8000/add_grain/', data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.log('Form response:', response);
            console.log('Success:', response.data);
            navigate('/');
        } catch (error) {
            console.error('Error adding grain:', error.response ? error.response.data : error.message);
        }
    };

    return (
        <div className="container">
            <h2>Add Grain</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="sort">Sort:</label>
                    <select id="sort" name="sort" value={grainForm.sort} onChange={handleChange} required>
                        <option value="">Select a sort</option>
                        {sortChoices.map((sort) => (
                            <option key={sort.value} value={sort.value}>{sort.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="type">Type:</label>
                    <select id="type" name="type" value={grainForm.type} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        {grainTypes.map((type) => (
                            <option key={type.type} value={type.type}>{type.display_name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="elevator">Elevator:</label>
                    <select id="elevator" name="elevator" value={grainForm.elevator} onChange={handleChange} required>
                        <option value="">Select an elevator</option>
                        {userElevators.map((elevator) => (
                            <option key={elevator.id} value={elevator.id}>{elevator.el_name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="bunker">Bunker:</label>
                    <select id="bunker" name="bunker" value={grainForm.bunker} onChange={handleChange} required>
                        <option value="">Select a bunker</option>
                        {userBunkers.map((bunker) => (
                            <option key={bunker.id} value={bunker.id}>
                                {bunker.elevatorName} -- {bunker.number}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="num_grains">Number of Grains:</label>
                    <input
                        type="number"
                        id="num_grains"
                        name="num_grains"
                        value={grainForm.num_grains}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default AddGrain;
