import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';
import './LoginPage.css'; // Import CSS cho giao diện Zalo-style

const LoginPage = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            const response = await ApiService.post('/auth/login', {
                username: phoneNumber,
                password,
            });
            alert('Login successful!');
            navigate('/chat');
        } catch (error) {
            console.error("Error logging in:", error.response || error);
            setErrorMessage(
                error.response?.data?.error || 'Error logging in'
            );
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Zolo</h2>
                <p>Đăng nhập tài khoản Zolo để kết nối với ứng dụng Zalo Web</p>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="input-group">
                        <label htmlFor="phone">📱 Số điện thoại</label>
                        <input
                            id="phone"
                            type="text"
                            placeholder="+84..."
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
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
                            required
                        />
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button className="btn-login" onClick={handleLogin}>Đăng nhập với mật khẩu</button>
                </form>
                <div className="extra-options">
                    <a href="#forgot-password">Quên mật khẩu</a>
                    <a href="#qr-login">Đăng nhập qua mã QR</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;





// import React, { useState } from 'react';
// import AuthService from '../services/ApiService';

// const LoginPage = () => {
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [otp, setOtp] = useState('');
//     const [isOtpSent, setIsOtpSent] = useState(false);
//     const [errorMessage, setErrorMessage] = useState('');

//     const handleSendOtp = async () => {
//         try {
//             await AuthService.sendOtp(phoneNumber);
//             setIsOtpSent(true);
//             setErrorMessage('');
//         } catch (error) {
//             setErrorMessage(error.message || 'Failed to send OTP');
//         }
//     };

//     const handleVerifyOtp = async () => {
//         // Logic to verify OTP can be implemented if needed
//         alert('OTP verified (mock logic)');
//     };

//     return (
//         <div>
//             <h1>Login</h1>
//             <div>
//                 <label>
//                     Phone Number:
//                     <input
//                         type="text"
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                         disabled={isOtpSent}
//                     />
//                 </label>
//             </div>
//             {isOtpSent && (
//                 <div>
//                     <label>
//                         OTP:
//                         <input
//                             type="text"
//                             value={otp}
//                             onChange={(e) => setOtp(e.target.value)}
//                         />
//                     </label>
//                 </div>
//             )}
//             <div>
//                 {!isOtpSent ? (
//                     <button onClick={handleSendOtp}>Send OTP</button>
//                 ) : (
//                     <button onClick={handleVerifyOtp}>Verify OTP</button>
//                 )}
//             </div>
//             {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
//         </div>
//     );
// };

// export default LoginPage;

