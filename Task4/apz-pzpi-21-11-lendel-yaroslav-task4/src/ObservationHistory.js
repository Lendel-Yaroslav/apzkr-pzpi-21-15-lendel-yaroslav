import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const ObservationHistory = () => {
    const { tankId } = useParams();
    const [viewMode, setViewMode] = useState('table');
    const [tank, setTank] = useState(null);
    const [observations, setObservations] = useState([]);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`/observation_history/${tankId}/`);
                setTank(response.data.tank);
                setObservations(response.data.observations);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [tankId]);

    useEffect(() => {
        if (viewMode === 'chart' && chartRef.current) {
            const timestamps = observations.map(observation => observation.timestamp);
            const temperatures = observations.map(observation => observation.temperature);
            const humidities = observations.map(observation => observation.humidity);

            const chartData = {
                labels: timestamps,
                datasets: [
                    {
                        label: 'Температура (°C)',
                        data: temperatures,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Вологість (%)',
                        data: humidities,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            };

            new Chart(chartRef.current, {
                type: 'line',
                data: chartData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            min: Math.min(...temperatures, ...humidities) - 5,
                            max: Math.max(...temperatures, ...humidities) + 5
                        }
                    }
                }
            });
        }
    }, [viewMode, observations]);

    const toggleView = () => {
        setViewMode(viewMode === 'table' ? 'chart' : 'table');
    };

    if (!observations || observations.length === 0) {
        return (
            <div>
                <h1>Історія спостережень для бункера {tank?.number} на елеваторі {tank?.elevator.el_name}</h1>
                <p>Немає даних для відображення.</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Історія спостережень для бункера {tank?.number} на елеваторі {tank?.elevator.el_name}</h1>
            <button onClick={toggleView}>
                {viewMode === 'table' ? 'Переглянути графік' : 'Переглянути таблицю'}
            </button>
            {viewMode === 'table' ? (
                <table>
                    <thead>
                        <tr>
                            <th>Дата і час</th>
                            <th>Температура (°C)</th>
                            <th>Вологість (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {observations.map(observation => (
                            <tr key={observation.id}>
                                <td>{observation.timestamp}</td>
                                <td>{observation.temperature}</td>
                                <td>{observation.humidity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <canvas ref={chartRef} id="chart-view" style={{ display: 'block' }}></canvas>
            )}
        </div>
    );
};

export default ObservationHistory;
