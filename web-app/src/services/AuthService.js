// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080/api/auth'; // Adjust as needed

// const AuthService = {
//     sendOtp: async (phoneNumber) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/send-otp`, { phoneNumber });
//             return response.data;
//         } catch (error) {
//             throw error.response ? error.response.data : error;
//         }
//     },

//     createUser: async (userData) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/create-user`, userData);
//             return response.data;
//         } catch (error) {
//             throw error.response ? error.response.data : error;
//         }
//     }
// };

// export default AuthService;