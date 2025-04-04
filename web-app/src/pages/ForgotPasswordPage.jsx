import React, { useState } from 'react';
import ApiService from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import { te } from 'date-fns/locale';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState(''); // Ô nhập lại mật khẩu mới
    const [errorMessage, setErrorMessage] = useState('');
    const [step, setStep] = useState(1);  // Bước 1: Nhập số điện thoại, Bước 2: Nhập OTP, Bước 3: Đặt mật khẩu mới
    const [isProcessing, setIsProcessing] = useState(false);

    // Gửi mã OTP
    const handleSendOtp = async () => {
        setIsProcessing(true);
        try {
            const response = await ApiService.post('/forgot-password/send-otp', { phoneNumber });
            setStep(2);  // Chuyển sang bước xác minh OTP
            setIsProcessing(false);
        } catch (error) {
            setErrorMessage('Lỗi gửi mã OTP, vui lòng thử lại!');
            setIsProcessing(false);
        }
    };

    // Xác minh OTP và chuyển sang nhập mật khẩu mới
    const handleVerifyOtp = async () => {
        setIsProcessing(true);
        try {
            const response = await ApiService.post('/forgot-password/verify-otp', { phoneNumber, otp });
            setStep(3);  // Chuyển sang bước nhập mật khẩu mới
            setIsProcessing(false);
        } catch (error) {
            setErrorMessage('Mã OTP không đúng hoặc hết hạn!!');
            setIsProcessing(false);
        }
    };

    const validatePassword = (pass) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };

    // Đặt mật khẩu mới
    const handleResetPassword = async () => {
        setIsProcessing(true);

        // Kiểm tra xem mật khẩu mới và mật khẩu nhập lại có trùng không
        if (newPassword !== confirmNewPassword) {
            setErrorMessage('Mật khẩu mới và mật khẩu nhập lại không khớp!');
            setIsProcessing(false);
            return;
        }

        // Kiểm tra định dạng mật khẩu mới
        if (!validatePassword(newPassword)) {
            setErrorMessage('Mật khẩu mới phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!');
            setIsProcessing(false);
            return;
        }

        try {
            const response = await ApiService.post('/forgot-password/reset-password', { phoneNumber, newPassword });
            setIsProcessing(false);
            navigate('/login');  // Điều hướng người dùng đến trang đăng nhập
        } catch (error) {
            setErrorMessage('Có lỗi khi thay đổi mật khẩu!');
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 m-4" style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg p-2" style={{ width: '400px', borderRadius: '10px' }}>
                <h2 className="text-2xl font-semibold text-center mb-6">Quên Mật Khẩu</h2>

                {step === 1 && (
                    <div>
                        <div className="mb-4">
                            {errorMessage && <div className="text-red-500 text-sm mb-2">{errorMessage}</div>}
                            <input
                                type="text"
                                placeholder="📱 Nhập số điện thoại"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            onClick={handleSendOtp}
                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 mb-4"
                            style={{ width: '150px', padding: '10px', cursor: 'pointer' }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Gửi Mã OTP'}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div className="mb-4">
                            {errorMessage && <div className="text-red-500 text-sm mb-2">{errorMessage}</div>}
                            <input
                                type="text"
                                placeholder="📱 Nhập mã OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            onClick={handleVerifyOtp}
                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                            style={{ width: '150px', padding: '10px', cursor: 'pointer' }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Xác Minh OTP'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="mb-4">
                            {errorMessage && <div className="text-red-500 text-sm mb-2">{errorMessage}</div>}
                            <input
                                type="password"
                                placeholder="🔒 Nhập mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="password"
                                placeholder="🔒 Nhập lại mật khẩu mới"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            onClick={handleResetPassword}
                            className="w-auto bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                            style={{ width: '150px', padding: '10px', cursor: 'pointer' }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Xác Nhận Mật Khẩu Mới'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
