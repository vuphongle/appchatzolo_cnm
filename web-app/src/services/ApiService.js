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
