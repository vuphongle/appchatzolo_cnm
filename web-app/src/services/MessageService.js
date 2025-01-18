import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/messages'; // Địa chỉ API

const MessageService = {
    post: async (url, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    get: async (url, params) => {
        try {
            const response = await axios.get(`${API_BASE_URL}${url}`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Phương thức xóa lời mời
    deleteInvitation: (senderID, receiverID) => {
        return axios.delete(`${API_BASE_URL}/invitations/${senderID}/${receiverID}`);
    }
};

export default MessageService;
