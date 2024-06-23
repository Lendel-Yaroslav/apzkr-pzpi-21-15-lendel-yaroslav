import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Home.css';

axios.defaults.withCredentials = true;

function Home() {
    const [elevators, setElevators] = useState([]);
    const [bunkers, setBunkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

        const fetchData = async () => {
            try {
                const [elevatorResponse, bunkerResponse] = await Promise.all([
                    axios.get('http://localhost:8000/api/elevators/'),
                    axios.get('http://localhost:8000/api/bunkers/')
                ]);
                setElevators(elevatorResponse.data);
                setBunkers(bunkerResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Не вдалося завантажити дані. Спробуйте ще раз пізніше.');
                setLoading(false);
            }
        };

        fetchData();
        compere(); // Call compere after fetching data

    }, []);
    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8000/logout/', {}, {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
            });
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
            Swal.fire('Помилка!', 'Не вдалося вийти з системи.', 'error');
        }
    };

    const handleDelete = async (id) => {
        const confirmDeletion = await showConfirmationDialog('Ви впевнені?', 'Це дію не можна буде скасувати!');
        if (confirmDeletion) {
            try {
                await axios.delete(`http://localhost:8000/api/elevators/${id}/`, {
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json',
                    },
                });
                setElevators(elevators.filter(elev => elev.id !== id));
                Swal.fire('Успіх!', 'Елеватор видалено.', 'success');
            } catch (error) {
                console.error('Error deleting elevator:', error);
                Swal.fire('Помилка!', 'Не вдалося видалити елеватор.', 'error');
            }
        }
    };

    const handleDeleteBunker = async (bunkerId, elevatorId) => {
        const confirmDeletion = await showConfirmationDialog('Ви впевнені?', 'Це дію не можна буде скасувати!');
        if (confirmDeletion) {
            try {
                await axios.delete(`http://localhost:8000/api/bunkers/${bunkerId}/delete/`, {
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json',
                    },
                });
                setBunkers(prevBunkers => prevBunkers.filter(bunker => bunker.id !== bunkerId));
                setElevators(prevElevators => prevElevators.map(elev => {
                    if (elev.id === elevatorId) {
                        return {
                            ...elev,
                            tankgrain_set: elev.tankgrain_set ? elev.tankgrain_set.filter(tank => tank.id !== bunkerId) : []
                        };
                    }
                    return elev;
                }));
                Swal.fire('Успіх!', 'Бункер видалено.', 'success');
            } catch (error) {
                console.error('Error deleting bunker:', error);
                Swal.fire('Помилка!', 'Не вдалося видалити бункер.', 'error');
            }
        }
    };
    const compere = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/compare-data/', {}, {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
            });

            console.log(response.data); // Логируем ответ для отладки

            // Проверяем наличие сообщения об ошибке в ответе
            if (response.data.results) {
                let errorMessages = [];  // Массив для хранения сообщений об ошибках

                response.data.results.forEach(result => {
                    if (!result.temperature_ok || !result.humidity_ok) {
                        let errorMessage = `Елеватор: ${result.elevator_name}, Бункер №${result.bunker_number}: ${result.message}`;
                        errorMessages.push(errorMessage);
                    }
                });

                if (errorMessages.length > 0) {
                    if (errorMessages.length > 3) {
                        // Если ошибок больше трех, выводим общее сообщение с кнопками
                        Swal.fire({
                            icon: 'error',
                            title: 'Помилка!',
                            html: `Знайдено більше 3 помилок. <br> <button id="goToCompare" class="swal2-confirm swal2-styled">Перейти до порівняння</button> <button id="skip" class="swal2-cancel swal2-styled">Пропустити</button>`,
                            showCancelButton: false,
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        });

                        // Обработчик кнопки для перехода на страницу compare_data
                        document.getElementById('goToCompare').addEventListener('click', function () {
                            window.location.href = '/compare_data';
                        });

                        // Обработчик кнопки для пропуска
                        document.getElementById('skip').addEventListener('click', function () {
                            Swal.close();
                        });

                    } else {
                        // Иначе выводим все ошибки в одном сообщении
                        let errorText = errorMessages.join('<br>');
                        Swal.fire({
                            icon: 'error',
                            title: 'Помилки!',
                            html: errorText,
                        });
                    }
                }
            } else {
                console.error('Unexpected response structure:', response.data);
                Swal.fire({
                    icon: 'error',
                    title: 'Помилка!',
                    text: 'Неочікувана структура відповіді сервера. Спробуйте ще раз пізніше.',
                });
            }
        } catch (error) {
            console.error('Помилка у функції compere:', error);
            Swal.fire({
                icon: 'error',
                title: 'Помилка!',
                text: 'Не вдалося виконати порівняння даних. Спробуйте ще раз пізніше.',
            });
        }
    };


    const showConfirmationDialog = async (title, text) => {
        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Так, видалити!',
            cancelButtonText: 'Скасувати'
        });
        return result.isConfirmed;
    };

    const toggleDetails = (id) => {
        setElevators(elevators.map(elev => elev.id === id ? {...elev, showDetails: !elev.showDetails} : elev));
    };

    if (loading) {
        return <div>Завантаження...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const elevatorsWithBunkers = elevators.map(elevator => {
        const elevatorBunkers = bunkers.filter(bunker => bunker.elevator.id === elevator.id);
        return {...elevator, tankgrain_set: elevatorBunkers};
    });

    return (
        <div className="container">
            <h1>Елеватори користувача</h1>
            <div className="buttons">
                <button onClick={handleLogout} className="button logout-button">Вийти</button>
                <a href="/add_elevator" className="button add-elevator-button">Додати елеватор</a>
                <a href="/add_grain" className="button add-grain-button">Додати зерно</a>
                <a href="/grain_unload" className="button grain-unload">Відвантажити зерно</a>
                <a href="/compare_data" className="button compare_data">Перегляд умов зберігання</a>
            </div>
            {elevatorsWithBunkers.length ? (
                <ul className="elevator-list">
                    {elevatorsWithBunkers.map(elevator => (
                        <li key={elevator.id} className="elevator">
                            <div className="elevator-header">
                                <button onClick={() => toggleDetails(elevator.id)} className="toggle-button">
                                    {elevator.showDetails ? 'v' : '>'}
                                </button>
                                <h2 className="elevator-name">{elevator.el_name}</h2>
                                <div className="buttons">
                                    <button onClick={() => handleDelete(elevator.id)}
                                            className="button delete-button">Видалити
                                    </button>
                                    <a href={`/edit_elevator/${elevator.id}`}
                                       className="button edit-button">Редагувати</a>
                                    <a href={`/add_bunker/${elevator.id}`} className="button add-button">Додати
                                        бункер</a>
                                </div>
                            </div>
                            <div className={`elevator-details ${elevator.showDetails ? 'open' : ''}`}>
                                {elevator.tankgrain_set && elevator.tankgrain_set.length ? (
                                    <ul>
                                        {elevator.tankgrain_set.map(tank => (
                                            <li key={tank.id}>
                                                <strong>Номер бункера:</strong> {tank.number}<br/>
                                                <strong>Максимальна вмісткість:</strong> {tank.max_capacity} тонн<br/>
                                                <strong>Заповнено:</strong> {tank.fulled_capacity} тонн<br/>
                                                {tank.grain ? (
                                                    <>
                                                        <strong>Тип зерна:</strong> {tank.grain.type}<br/>
                                                        <strong>Сорт зерна:</strong> {tank.grain.sort}<br/>
                                                    </>
                                                ) : (
                                                    <p><strong>Тип зерна:</strong> Немає даних<br/></p>
                                                )}
                                                <strong>Температура:</strong> {tank.temperature}<br/>
                                                <strong>Вологість:</strong> {tank.humidity}
                                                <div className="buttons">
                                                    <button onClick={() => handleDeleteBunker(tank.id, elevator.id)}
                                                            className="button delete-button">Видалити
                                                    </button>
                                                    <a href={`/edit_bunker/${tank.id}`}
                                                       className="button edit-button">Редагувати</a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Бункери відсутні</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Елеватори відсутні</p>
            )}

        </div>
    );
}

export default Home;
