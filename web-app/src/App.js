import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import MainPage from './pages/MainPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';

function App() {
    const navigate = useNavigate();
    const { MyUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const idToken = localStorage.getItem('idToken');

        console.log('MyUser:', MyUser);
        console.log('idToken:', idToken);
        if (!MyUser && !idToken) {
            setTimeout(() => {
                navigate('/'); // Chuyển về trang login nếu chưa đăng nhập
            }, 3000);
        } else if (MyUser && idToken) {
            navigate('/main'); // Nếu đã đăng nhập, vào MainPage
        }

        setIsLoading(false);
    }, [MyUser, navigate]);

    return (
        !isLoading && (
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/create-user" element={<RegisterPage />} />
            </Routes>
        )
    );
}

export default App;
