import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

const VerifyOTPPage = () => {
    const [otp, setOtp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy phoneNumber từ trang trước
    const phoneNumber = location.state?.phoneNumber;

    if (!phoneNumber) {
        return <div>Error: Phone number not provided. Please start the registration process again.</div>;
    }

    const handleVerifyOtp = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!otp) {
            setErrorMessage("OTP is required.");
            return;
        }

        try {
            await AuthService.post("/verify-otp-and-create-user", { phoneNumber, otp });
            setSuccessMessage("User created successfully. You can now log in.");
            setTimeout(() => {
                navigate("/"); // Chuyển đến trang login
            }, 2000);
        } catch (error) {
            setErrorMessage(error.response?.data || "Error verifying OTP.");
        }
    };

    return (
        <div className="verify-otp-container">
            <h1>Verify OTP</h1>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div>
                <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />
                <button onClick={handleVerifyOtp}>Verify OTP</button>
            </div>
        </div>
    );
};

export default VerifyOTPPage;
