import React, { useEffect, useState } from 'react';

const ComparisonResults = () => {
    const [results, setResults] = useState([]);

    useEffect(() => {
        fetch('/api/comparison_results/')
            .then(response => response.json())
            .then(data => setResults(data.results));
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f4f4' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Результати перевірки умов зберігання</h1>
            <ul style={{ listStyleType: 'none', padding: '0' }}>
                {results.map(result => (
                    <li key={result.tank_id}>
                        <div className="result">
                            <strong>Елеватор:</strong> {result.elevator_name}<br />
                            <strong>Номер бункера:</strong> {result.tank_number}<br />
                            <strong>Тип зерна:</strong> {result.grain_type}<br />
                            <strong>Температура:</strong> {result.temperature}<br />
                            <strong>Вологість:</strong> {result.humidity}<br />
                            <form action={`/observation_history/${result.tank_id}`} method="get">
                                <button type="submit">История наблюдений</button>
                            </form>
                            {result.message ? (
                                <>
                                    <strong>Повідомлення:</strong> {result.message}<br />
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ComparisonResults;
