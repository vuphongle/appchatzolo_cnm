import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import "../css/LoginPage.css";
import { formatPhoneNumber } from '../utils/formatPhoneNumber';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('phone');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoggingIn(true);

        // Kiểm tra thông tin nhập vào
        if (!phoneNumber.trim() || !password) {
            setErrorMessage('Bạn vui lòng nhập đầy đủ thông tin');
            setIsLoggingIn(false);
            return;
        }

        // Định dạng số điện thoại và kiểm tra tính hợp lệ
        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            setErrorMessage('Số điện thoại không hợp lệ');
            setIsLoggingIn(false);
            return;
        }

        try {
            const response = await ApiService.post('/login', {
                username: formattedPhone,
                password,
            });

            if (response && response.idToken) {
                const { idToken, userAttributes, my_user } = response;
                login({
                    username: formattedPhone,
                    idToken,
                    userAttributes,
                    my_user,
                    lastLoginTime: Date.now(),
                }, () => {
                    navigate('/main');
                });
            } else {
                setErrorMessage('Tài khoản không tồn tại');
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error.response || error);
            setErrorMessage('Số điện thoại hoặc mật khẩu không đúng !!!');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setErrorMessage(''); // Reset thông báo lỗi khi chuyển tab
    };

    return (
        <div className="d-flex justify-content-center align-items-center flex-column vh-100">
            <div className="text-center mb-4">
                <h1 className="text-primary fw-bold">Zolo</h1>
                <p>
                    Đăng nhập tài khoản Zolo <br /> để kết nối với ứng dụng Zolo Web
                </p>
            </div>

            <div className="card p-4" style={{ width: "500px", borderRadius: "20px" }}>
                <ul className="nav nav-pills nav-fill justify-content-center mb-3 d-flex">
                    <li className="nav-item w-50">
                        <button
                            type="button"
                            className={`nav-link ${activeTab === 'phone' ? 'active' : ''}`}
                            onClick={() => handleTabChange('phone')}
                        >
                            Số Điện Thoại
                        </button>
                    </li>
                    <li className="nav-item w-50">
                        <button
                            type="button"
                            className={`nav-link ${activeTab === 'qr' ? 'active' : ''}`}
                            onClick={() => handleTabChange('qr')}
                        >
                            Quét Mã QR
                        </button>
                    </li>
                </ul>

                <form onSubmit={handleLogin}>
                    {activeTab === 'phone' && (
                        <>
                            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                            <div className="input-group mt-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="📱 Số điện thoại"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group mb-3">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="🔒 Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100 mb-3"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng Nhập Với Mật Khẩu'}
                            </button>
                        </>
                    )}

                    {activeTab === 'qr' && (
                        <div className="mb-3 text-center">
                            <p>Quét mã QR để đăng nhập</p>
                            <img src="../image/qr.png" alt="QR Code" style={{ width: '200px' }} />
                        </div>
                    )}
                </form>

                <div className="text-center">
                    <a href="/forgot-password" className="text-decoration-none">Quên mật khẩu?</a>
                </div>

                <hr />

                <div className="text-center">
                    <span>Chưa có tài khoản? </span>
                    <a href="/create-user" className="text-primary text-decoration-none fw-bold">Đăng Ký</a>
                </div>
            </div>

            {isLoggingIn && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p className="loading-text">Đang đăng nhập...</p>
                </div>
            )}
        </div>
    );
};

export default LoginPage;