import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

const RegisterPage = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false); // Cờ để kiểm tra OTP đã được gửi chưa
    const [phoneError, setPhoneError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const navigate = useNavigate();

    // Kiểm tra số điện thoại hợp lệ
    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone);
    };

    // Kiểm tra mật khẩu hợp lệ
    const validatePassword = (pass) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };

    // Xử lý gửi OTP
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
            setPhoneError("Số điện thoại không đúng định dạng.");
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
            setIsOtpSent(true); // Đánh dấu là OTP đã được gửi
        } catch (error) {
            setErrorMessage(error.response?.data || "Lỗi khi gửi OTP.");
        }
    };

    // Xử lý xác minh OTP và tạo người dùng
    const handleVerifyOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setPhoneError("");
        setPasswordError("");
        setConfirmPasswordError("");

        if (!otp) {
            setErrorMessage("OTP là bắt buộc.");
            return;
        }

        try {
            await AuthService.post("/verify-otp-and-create-user", { phoneNumber, otp });
            setSuccessMessage("Tạo người dùng thành công. Bạn có thể đăng nhập ngay.");
            setTimeout(() => {
                navigate("/"); // Chuyển hướng đến trang đăng nhập sau khi thành công
            }, 2000);
        } catch (error) {
            setErrorMessage(error.response?.data || "Lỗi khi xác minh OTP.");
        }
    };

    return (
        <div className="register-verify-container">
            <h1>{isOtpSent ? "Xác minh OTP" : "Đăng ký"}</h1>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {/* Phần đăng ký */}
            {!isOtpSent && (
                <div>
                    <div className="input-group form-group">
                        <input
                            type="text"
                            placeholder="Số điện thoại"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        {phoneError && <div className="phone-number-error">{phoneError}</div>}
                    </div>

                    <div className="input-group form-group">
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {passwordError && <div className="password-error">{passwordError}</div>}
                    </div>

                    <div className="input-group form-group">
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPasswordError && <div className="confirm-password-error">{confirmPasswordError}</div>}
                    </div>

                    <button onClick={handleSendOtp}>Gửi OTP</button>
                </div>
            )}

            {/* Phần xác minh OTP */}
            {isOtpSent && (
                <div>
                    <input
                        type="text"
                        placeholder="Nhập OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={handleVerifyOtp}>Xác minh OTP</button>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;
