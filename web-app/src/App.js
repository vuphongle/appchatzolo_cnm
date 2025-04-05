import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import MainPage from './pages/MainPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer và toast
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const navigate = useNavigate();
    const { MyUser } = useAuth();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const idToken = localStorage.getItem('idToken');

        console.log('MyUser:', MyUser);
        console.log('idToken:', idToken);
        if (!MyUser && !idToken && location.pathname !== '/create-user' && location.pathname !== '/forgot-password') {
            setTimeout(() => {
                navigate('/'); // Chuyển về trang login nếu chưa đăng nhập
            }, 3000);
        } else if (MyUser && idToken) {
            navigate('/main'); // Nếu đã đăng nhập, vào MainPage
        }

        setIsLoading(false);
    }, [MyUser, navigate, location.pathname]);

    return (
        !isLoading && (
            <>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/create-user" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                </Routes>

                {/* Thêm ToastContainer để hiển thị thông báo toast */}
                <ToastContainer />
            </>
        )
    );
}

export default App;
