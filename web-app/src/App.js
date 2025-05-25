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
import { useWebSocket } from './context/WebSocket';
import { onMessageListener } from "../src/services/firebase_messaging"; // Import messaging từ firebase_messaging.js

function App() {
    const navigate = useNavigate();
    const { MyUser } = useAuth();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const { sendMessage, onMessage } = useWebSocket();

    const [hasIncomingCall, setHasIncomingCall] = useState(false);
    const params = new URLSearchParams(location.search);
    const callerId = params.get("callerId") || null;

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const idToken = localStorage.getItem('idToken');

        console.log('MyUser:', MyUser);
        console.log('idToken:', idToken);

        if (!MyUser && !idToken && location.pathname !== '/create-user' && location.pathname !== '/forgot-password') {
            setTimeout(() => {
                navigate('/'); // Chuyển về login nếu chưa đăng nhập
            }, 3000);
        } else if (MyUser && idToken) {
            if (callerId === null) {
                navigate('/main'); // Chỉ chuyển đến main nếu không có cuộc gọi
            }
        }

        setIsLoading(false);
    }, [MyUser, navigate, location.pathname, hasIncomingCall]);


    // Lắng nghe thông báo khi nhận được trong foreground (ứng dụng đang mở)
    useEffect(() => {
        console.log("✅ Setting up foreground message listener...");

        const unsubscribe = onMessageListener((payload) => {
            console.log("📩 Message received in foreground:", payload);

            if (payload?.data?.type === "video_call_request") {
                // navigate(`/video-call?callerId=${payload.data.fromUserId}`);
                navigate('/main'); // Chuyển hướng đến trang chat
            }
        });

        return () => {
            // Không có cách chính thức để huỷ `onMessage`, nên bỏ trống
        };
    }, [navigate]);

    return (
        // !isLoading && (
        <>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/create-user" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/video-call" element={<ChatPage />} />

            </Routes>

            {/* Thêm ToastContainer để hiển thị thông báo toast */}
            <ToastContainer />
        </>
        // )
    );
}

export default App;
