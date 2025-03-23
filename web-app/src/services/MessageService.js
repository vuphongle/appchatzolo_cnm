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
            console.error("Error fetching data from API:", error.response || error);
            throw error; // Nếu muốn xử lý lỗi cụ thể sau
        }
    },

    // Phương thức xóa lời mời
    deleteInvitation: (senderID, receiverID) => {
        return axios.delete(`${API_BASE_URL}/invitations/${senderID}/${receiverID}`);
    },

    //Dếm số lượng lời mời
    countInvitations: async (senderID, receiverID) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/invitations/count/${senderID}/${receiverID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching invitations count:", error);
            return [];
        }
    },

    //lấy trạng thái đã đọc chưa đọc
    getUnreadMessages: async (receiverID, senderID) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/messages/unread/${receiverID}/${senderID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching unread messages:", error);
            return [];
        }
    },
    getUnreadMessagesCountForAllFriends: async (receiverID) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/messages/unread-count/${receiverID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching unread messages count:", error);
            return [];
        }
    },
    //lưu trạng thái đánh dấu tin nhắn là "Đã đọc"
    savereadMessages: async (receiverID, senderID) => {
        try {
            await axios.put(`${API_BASE_URL}/messages/read/${receiverID}/${senderID}`);
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái tin nhắn đã đọc:", error);
        }
    }

};

export default MessageService;
