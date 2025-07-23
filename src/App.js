import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { SystemStatusProvider } from './contexts/SystemStatusContext';
import UserApp from './pages/UserApp';
import AccessDenied from './components/AccessDenied';

function App() {
    return (
        <DarkModeProvider>
            <SystemStatusProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            <Route path="/access-denied" element={<AccessDenied />} />
                            <Route path="/" element={<UserApp />} />
                        </Routes>
                    </div>
                </Router>
            </SystemStatusProvider>
        </DarkModeProvider>
    );
}

export default App;