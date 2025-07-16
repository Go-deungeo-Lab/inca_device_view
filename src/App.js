import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import UserApp from './pages/UserApp';
import AccessDenied from './components/AccessDenied';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route path="/" element={<UserApp />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;