import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import MainPage from "./pages/MainPage";
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
    const navigate = useNavigate();
    const { MyUser } = useAuth(); // Lấy thông tin user từ context
    const [isLoading, setIsLoading] = useState(true); // Trạng thái đang tải thông tin user

    // Kiểm tra nếu người dùng đã đăng nhập khi trang tải
    useEffect(() => {
        if (MyUser) {
            setIsLoading(false); // Đã có thông tin người dùng, không còn loading
        }
    }, [MyUser]);

    // Kiểm tra sau khi loading xong, điều hướng đến trang phù hợp
    useEffect(() => {
        if (!isLoading) {
            if (MyUser) {
                navigate('/main'); // Điều hướng đến trang chính nếu đã đăng nhập
            } else {
                navigate('/'); // Nếu không có user, điều hướng đến trang login
            }
        }
    }, [isLoading, MyUser, navigate]);

    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/create-user" element={<RegisterPage />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
