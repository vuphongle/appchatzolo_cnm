import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import MainPage from "./pages/MainPage";
import RegisterPage from './pages/RegisterPage';
import VerifyOTPPage from './pages/VerifyOTPPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/create-user" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
        </Routes>
    );
}

export default App;
