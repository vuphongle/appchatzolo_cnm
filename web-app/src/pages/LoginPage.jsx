import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const LoginPage = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleCreateUser = async () => {
        try {
            await ApiService.post('/auth/create-user', {
                phoneNumber,
                password,
            });
            alert('User created successfully');
        } catch (error) {
            setErrorMessage(error.response?.data || 'Error creating user');
        }
    };

    const handleLogin = async () => {
        try {
            const response = await ApiService.post('/auth/login', {
                username: phoneNumber,
                password,
            });
            alert('Login successful!');
            navigate('/chat'); // Chuyển hướng sang ChatPage
        } catch (error) {
            console.error("Error logging in:", error.response || error);
            setErrorMessage(
                error.response?.data?.error || 'Error logging in'
            );
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <div>
                <label>
                    Phone Number:
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <button onClick={handleCreateUser}>Create User</button>
                <button onClick={handleLogin}>Login</button>
            </div>

            {/* ---- */}
            <div>
                <label style={{color:'red'}}>Note: Demo chưa tách page sign in và page login mà đang để chung</label>
            </div>
            <div>
                <label style={{color:'green'}}>Note: Khi tạo User phải tuân thủ Policy của AWS cognito: username: +84....., Password: phải có chữ hoa, số và kí tự đặc biệt: @,/,...</label>
            </div>
            {/* ---- */}


            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
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




