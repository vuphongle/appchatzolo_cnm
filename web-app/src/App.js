import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/chat" element={<ChatPage />} />
        </Routes>
    );
}

export default App;
