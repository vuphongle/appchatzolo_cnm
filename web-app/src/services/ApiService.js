import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const ApiService = {
    post: async (url, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default ApiService;


// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080/api';

// const ApiService = {
//     post: async (url, data) => {
//         console.log("Request URL:", `${API_BASE_URL}${url}`);
//         console.log("Request Data:", data);
//         try {
//             const response = await axios.post(`${API_BASE_URL}${url}`, data);
//             return response.data;
//         } catch (error) {
//             console.error("API Error:", error.response || error);
//             throw error.response ? error.response.data : error;
//         }
//     },

//     sendOtp: async (phoneNumber) => {
//         return ApiService.post('/auth/send-otp', { phoneNumber });
//     },

//     createUser: async (userData) => {
//         return ApiService.post('/auth/create-user', userData);
//     },
// };

// export default ApiService;


