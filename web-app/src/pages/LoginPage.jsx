import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import './LoginPage.css'; // Import CSS cho giao diện Zalo-style

const LoginPage = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            const response = await AuthService.post('/login', {
                username: phoneNumber,
                password,
            });
            alert('Login successful!');
            navigate('/main');
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
                    <a href="/create-user">Đăng ký tài khoản</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;





// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ApiService from '../services/ApiService';

// const SignInPage = () => {
//     const navigate = useNavigate();
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [password, setPassword] = useState('');
//     const [otp, setOtp] = useState('');
//     const [step, setStep] = useState(1); // Step 1: Register, Step 2: Verify OTP, Step 3: Login
//     const [errorMessage, setErrorMessage] = useState('');
//     const [loading, setLoading] = useState(false);

//     const handleRegister = async () => {
//         setErrorMessage(''); // Reset lỗi trước khi thực hiện
//         setLoading(true); // Hiển thị trạng thái loading
    
//         try {
//             // Gọi API để đăng ký người dùng
//             await ApiService.post('/auth/register', {
//                 phoneNumber,
//                 password,
//             });
    
//             alert('User created successfully');
//             setStep(2); // Chuyển sang bước tiếp theo (nếu cần)
//         } catch (error) {
//             // Hiển thị lỗi nếu API trả về lỗi
//             setErrorMessage(error.response?.data || 'Error creating user');
//         } finally {
//             setLoading(false); // Kết thúc trạng thái loading
//         }
//     };
    

//     // Xác thực OTP
//     const handleVerifyOtp = async () => {
//         setErrorMessage('');
//         setLoading(true);

//         try {
//             const response = await ApiService.post('/auth/verify-otp', {
//                 phoneNumber,
//                 otp,
//             });
//             alert(response);
//             setStep(3); // Chuyển sang bước đăng nhập
//         } catch (error) {
//             setErrorMessage(error.response?.data || 'Error during OTP verification');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Đăng nhập
//     const handleLogin = async () => {
//         setErrorMessage('');
//         setLoading(true);

//         try {
//             const response = await ApiService.post('/auth/login', {
//                 username: phoneNumber,
//                 password,
//             });
//             alert('Login successful!');
//             navigate('/dashboard'); // Điều hướng đến dashboard sau khi đăng nhập thành công
//         } catch (error) {
//             setErrorMessage(error.response?.data || 'Error during login');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             {step === 1 && (
//                 <div>
//                     <h2>Register</h2>
//                     <input
//                         type="text"
//                         placeholder="Phone Number"
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                     />
//                     <input
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />
//                     <button onClick={handleRegister} disabled={loading}>
//                         {loading ? 'Registering...' : 'Register'}
//                     </button>
//                 </div>
//             )}

//             {step === 2 && (
//                 <div>
//                     <h2>Verify OTP</h2>
//                     <input
//                         type="text"
//                         placeholder="Enter OTP"
//                         value={otp}
//                         onChange={(e) => setOtp(e.target.value)}
//                     />
//                     <button onClick={handleVerifyOtp} disabled={loading}>
//                         {loading ? 'Verifying...' : 'Verify OTP'}
//                     </button>
//                 </div>
//             )}

//             {step === 3 && (
//                 <div>
//                     <h2>Login</h2>
//                     <input
//                         type="text"
//                         placeholder="Phone Number"
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                     />
//                     <input
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />
//                     <button onClick={handleLogin} disabled={loading}>
//                         {loading ? 'Logging in...' : 'Login'}
//                     </button>
//                 </div>
//             )}

//             {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
//         </div>
//     );
// };

// export default SignInPage;




