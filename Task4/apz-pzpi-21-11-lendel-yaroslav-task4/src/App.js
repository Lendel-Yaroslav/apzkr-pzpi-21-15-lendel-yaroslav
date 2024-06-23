import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from "./Home";
import AddElevator from "./AddElevator";
import EditElevator from "./EditElevator";
import AddGrain from "./AddGrain";
import AddBunker from "./AddBunker";
import EditBunker from "./EditBunker";
import GrainUnload from "./GrainUnload";
import ComparisonResults from "./ComparisonResults";
import ObservationHistory from "./ObservationHistory";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/" element={<Home/>}/>
                <Route path="/add_elevator" element={<AddElevator/>}/>
                <Route path="/edit_elevator/:id" element={<EditElevator/>}/>
                <Route path="/add_grain" element={<AddGrain/>}/>
                <Route path="/add_bunker/:elevatorId" element={<AddBunker/>}/>
                <Route path="/edit_bunker/:bunkerId" element={<EditBunker/>}/>
                <Route path="/grain_unload" element={<GrainUnload/>}/>
                <Route path="/compare_data" element={<ComparisonResults/>}/>
                <Route path="/observation_history/:tankId" element={<ObservationHistory/>}/>
            </Routes>
        </Router>
    );
}

export default App;
