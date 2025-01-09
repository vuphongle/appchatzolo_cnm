import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import MainPage from "./pages/MainPage";
import RegisterPage from './pages/RegisterPage';


function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/create-user" element={<RegisterPage />} />
          
        </Routes>
    );
}

export default App;
