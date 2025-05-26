import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import { formatPhoneNumber } from "../utils/formatPhoneNumber"; // Import hàm formatPhoneNumber
import '../css/RegisterPage.css';
import showToast from "../utils/AppUtils";

const RegistePage = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const navigate = useNavigate();

    const validatePassword = (pass) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };

    // Kiểm tra người dùng có đủ 12 tuổi
    const validateAge = (dobString) => {
        const dobDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        if (
            today.getMonth() < dobDate.getMonth() ||
            (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
        ) {
            age--;
        }
        return age;
    };

    const handleSendOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!phoneNumber || !password || !confirmPassword || !name || !dob) {
            setErrorMessage("Số điện thoại, mật khẩu, tên và ngày sinh là bắt buộc.");
            return;
        }

        if (validateAge(dob) < 14) {
            setErrorMessage("Bạn phải ít nhất 12 tuổi để đăng ký.");
            return;
        }

        // Định dạng số điện thoại trước khi kiểm tra
        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            setErrorMessage("Số điện thoại không đúng định dạng.");
            return;
        }
        // Cập nhật lại state với số điện thoại đã được định dạng
        setPhoneNumber(formattedPhone);

        if (!validatePassword(password)) {
            setErrorMessage("Mật khẩu phải có ý nhất 8 ký tự, chữ hoa, chữ thường, số và kí tự đặc biệt.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            await AuthService.post("/send-otp", { phoneNumber: formattedPhone, password });
            setSuccessMessage("OTP đã được gửi thành công. Vui lòng kiểm tra điện thoại của bạn.");
            setIsOtpSent(true);
        } catch (error) {
            setErrorMessage(error.response?.data || "Lỗi khi gửi OTP.");
        }
    };

    const handleVerifyOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!verificationCode) {
            setErrorMessage("OTP là bắt buộc.");
            return;
        }

        const user = {
            id: new Date().getTime().toString(),
            dob: dob,
            name: name,
            phoneNumber: phoneNumber,
        };

        try {
            const requestData = {
                phoneNumber: phoneNumber,
                verificationCode: verificationCode,
                user: user,
            };

            await AuthService.post("/verify-phone-and-create-user", requestData);
            setSuccessMessage("Tạo người dùng thành công. Bạn có thể đăng nhập ngay.");
            showToast("Tạo người dùng thành công. Bạn có thể đăng nhập ngay.", "success");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            if (error.response?.data) {
                setErrorMessage(error.response?.data);
            } else {
                setErrorMessage("Mã OTP không đúng hoặc hết hạn.");
            }
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center flex-column vh-100">
            <div className="text-center mb-4">
                <h1 className="text-primary fw-bold">Zolo</h1>
                <p>
                    Đăng ký tài khoản Zolo <br /> để kết nối với ứng dụng Zolo Web
                </p>
            </div>
            <div className="card p-4" style={{ width: "500px", borderRadius: "20px" }}>
                <h1>{isOtpSent ? "Xác minh OTP" : "Đăng ký Tài khoản"}</h1>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                {!isOtpSent ? (
                    <div>
                        <div className="input-group-info">
                            <input
                                id="name"
                                type="text"
                                placeholder="📝 Họ và tên"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="name"
                            />
                            <input
                                id="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="dob"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                id="phone"
                                type="text"
                                placeholder="📱 Số điện thoại"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                id="password"
                                type="password"
                                placeholder="🔒 Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="🔑 Xác nhận mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary w-100 mb-3" onClick={handleSendOtp}>
                            Đăng ký
                        </button>
                    </div>
                ) : (
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
                <hr />
                <div className="text-center">
                    <span>Đã có tài khoản? </span>
                    <a href="/" className="text-primary text-decoration-none fw-bold">
                        Đăng nhập
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RegistePage;