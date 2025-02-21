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

    const SESSION_TIMEOUT = 3 * 60 * 1000; // 30 phút (thời gian hết hạn phiên đăng nhập)

    // Kiểm tra nếu người dùng đã đăng nhập khi trang tải
    useEffect(() => {
        // Lấy thông tin phiên từ localStorage
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        const idToken = localStorage.getItem('idToken');

        if (lastLoginTime && idToken) {
            // Tính toán thời gian hết hạn
            const timeElapsed = Date.now() - parseInt(lastLoginTime);

            if (timeElapsed > SESSION_TIMEOUT) {
                // Nếu thời gian hết hạn, xóa thông tin người dùng và yêu cầu đăng nhập lại
                localStorage.removeItem('idToken');
                localStorage.removeItem('lastLoginTime');
                setIsLoading(false);
                navigate('/'); // Chuyển hướng về trang login
            } else {
                setIsLoading(false); // Nếu chưa hết hạn, không cần tải lại
            }
        } else {
            setIsLoading(false); // Nếu không có token, không có phiên đăng nhập
        }
    }, [navigate]);

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
