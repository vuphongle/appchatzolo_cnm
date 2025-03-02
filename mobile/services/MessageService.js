import axios from 'axios';

import { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, IPV4 } from '@env';

const MessageService = {
    post: async (url, data) => {
        try {
            const response = await axios.post(`${IPV4}${url}`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    get: async (url, params) => {
        try {
            const response = await axios.get(`${IPV4}${url}`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Phương thức lấy tin nhắn mới nhất giữa hai người dùng
    getLatestMessage: async (senderID,receiverID) => {
        try {
            const response = await axios.get(`${IPV4}/messages/latest-message`, {
                params: { senderID, receiverID }
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Phương thức xóa lời mời
    deleteInvitation: (senderID, receiverID) => {
        return axios.delete(`${IPV4}/invitations/${senderID}/${receiverID}`);
    }
};

export default MessageService;
