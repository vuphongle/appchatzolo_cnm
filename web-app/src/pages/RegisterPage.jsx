import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import './RegisterPage.css'; // Import CSS

const RegistePage = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const navigate = useNavigate();

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\+84\d{9,10}$/;
        return phoneRegex.test(phone);
    };

    const validatePassword = (pass) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };

    const handleSendOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setPhoneError("");
        setPasswordError("");
        setConfirmPasswordError("");

        if (!phoneNumber || !password || !confirmPassword) {
            setErrorMessage("Số điện thoại và mật khẩu là bắt buộc.");
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setPhoneError("Số điện thoại không đúng định dạng +84...");
            return;
        }

        if (!validatePassword(password)) {
            setPasswordError("Mật khẩu phải có chữ hoa, chữ thường, số và kí tự đặc biệt.");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            await AuthService.post("/send-otp", { phoneNumber, password });
            setSuccessMessage("OTP đã được gửi thành công. Vui lòng kiểm tra điện thoại của bạn.");
            setIsOtpSent(true);
        } catch (error) {
            setErrorMessage(error.response?.data || "Lỗi khi gửi OTP.");
        }
    };

    const handleVerifyOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setPhoneError("");
        setPasswordError("");
        setConfirmPasswordError("");

        if (!verificationCode) {
            setErrorMessage("OTP là bắt buộc.");
            return;
        }

        try {
            await AuthService.post("/verify-phone-and-create-user", { phoneNumber, verificationCode });
            setSuccessMessage("Tạo người dùng thành công. Bạn có thể đăng nhập ngay.");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            // Kiểm tra lỗi và đưa ra thông báo lỗi chi tiết nếu có
        if (error.response?.data) {
            setErrorMessage(error.response?.data); // Thông báo lỗi từ server
        } else {
            setErrorMessage("Mã OTP không đúng hoặc hết hạn."); // Thông báo mặc định khi mã OTP không đúng
        }
        }
    };

    return (
        <div className="register-verify-container">
            <h1>{isOtpSent ? "Xác minh OTP" : "Đăng ký Tài khoản"}</h1>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {!isOtpSent && (
                <div>
                    <div className="input-group">
                        <label htmlFor="phone">📱 Số điện thoại</label>
                        <input
                            id="phone"
                            type="text"
                            placeholder="Số điện thoại"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        {phoneError && <div className="error">{phoneError}</div>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">🔒 Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {passwordError && <div className="error">{passwordError}</div>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm-password">🔑 Xác nhận mật khẩu</label>
                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPasswordError && <div className="error">{confirmPasswordError}</div>}
                    </div>

                    <button onClick={handleSendOtp}>Đăng ký</button>
                </div>
            )}

            {isOtpSent && (
                <div>
                    <label htmlFor="verificationCode">🔢 Nhập OTP</label>
                    <input
                        id="verificationCode"
                        type="text"
                        placeholder="Nhập OTP"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button onClick={handleVerifyOtp}>Xác minh OTP</button>
                </div>
            )}
        </div>
    );
};

export default RegistePage;
