import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/groups'; // Địa chỉ API

const GroupService = {
    post: async (url, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    getGroupsByIds: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/getGroupsByUserId`, { params: { userId } });
            return response.data;
        } catch (error) {
            console.error("Error fetching groups by IDs:", error.response || error);
            throw error; // Nếu muốn xử lý lỗi cụ thể sau
        }
    }

};

export default GroupService;
