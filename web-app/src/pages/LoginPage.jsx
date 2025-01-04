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

