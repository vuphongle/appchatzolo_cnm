import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import "./RegisterPage.css";

const RegisterPage = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\+84\d{9,10}$/;
        return phoneRegex.test(phone);
    };

    const validatePassword = (pass) => {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };

    const handleSendOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!validatePhoneNumber(phoneNumber)) {
            setErrorMessage("Số điện thoại không đúng định dạng +84...");
            return;
        }

        if (!validatePassword(password)) {
            setErrorMessage(
                "Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
            );
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Mật khẩu xác nhận không khớp.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await AuthService.post("/send-otp", { phoneNumber, password });
            setSuccessMessage(response.data.message || "OTP đã được gửi thành công. Vui lòng kiểm tra điện thoại.");
            setIsOtpSent(true);
        } catch (error) {
            setErrorMessage(
                error.response?.data || "Lỗi xảy ra khi gửi OTP. Vui lòng thử lại sau."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!verificationCode) {
            setErrorMessage("Vui lòng nhập mã OTP.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await AuthService.post("/verify-phone-and-create-user", {
                phoneNumber,
                verificationCode,
            });
            setSuccessMessage(response.data.message || "Tài khoản đã được tạo thành công! Đang chuyển hướng...");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.error ||
                    error.response?.data?.details ||
                    "Mã OTP không đúng hoặc đã hết hạn."
            );
        } finally {
            setIsLoading(false);
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
                            placeholder="Nhập số điện thoại (ví dụ: +84901234567)"
                            value={phoneNumber}
                            onChange={(e) =>
                                setPhoneNumber(
                                    e.target.value.startsWith("+84")
                                        ? e.target.value
                                        : "+84" + e.target.value.replace(/^0/, "")
                                )
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">🔒 Mật khẩu</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
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
                    </div>

                    <button onClick={handleSendOtp} disabled={isLoading}>
                        {isLoading ? "Đang gửi..." : "Đăng ký"}
                    </button>
                </div>
            )}

            {isOtpSent && (
                <div>
                    <label htmlFor="otp">🔢 Nhập OTP</label>
                    <input
                        id="otp"
                        type="text"
                        placeholder="Nhập mã OTP từ SMS"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button onClick={handleVerifyOtp} disabled={isLoading}>
                        {isLoading ? "Đang xác minh..." : "Xác minh OTP"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;
