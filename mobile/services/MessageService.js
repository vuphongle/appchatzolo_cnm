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
  getLatestMessage: async (senderID, receiverID) => {
    try {
      const response = await axios.get(`${IPV4}/messages/latest-message`, {
        params: { senderID, receiverID },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Phương thức xóa lời mời
  deleteInvitation: (senderID, receiverID) => {
    return axios.delete(`${IPV4}/messages/invitations/${senderID}/${receiverID}`);
  },
  getUnreadMessages: async (receiverID, senderID) => {
    try {
      const response = await axios.get(
        `${IPV4}/messages/unread/${receiverID}/${senderID}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      return [];
    }
  },
  getUnreadMessagesCountForAllFriends: async (receiverID) => {
    try {
      const response = await axios.get(
        `${IPV4}/messages/messages/unread-count/${receiverID}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      return [];
    }
  },
  //lưu trạng thái đánh dấu tin nhắn là "Đã đọc"
  savereadMessages: async (receiverID, senderID) => {
    try {
      await axios.put(`${IPV4}/messages/messages/read/${receiverID}/${senderID}`);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái tin nhắn đã đọc:', error);
    }
  },
  //lấy trạng thái đã đọc chưa đọc
  getUnreadMessages: async (receiverID, senderID) => {
    try {
      const response = await axios.get(
        `${IPV4}/messages/unread/${receiverID}/${senderID}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      return [];
    }
  },
    // Thu hồi tin nhắn
    recallMessage: async (messageId, userId, receiverId) => {
      try {
          const response = await axios.delete(`${IPV4}/messages/recall/${messageId}/${userId}/${receiverId}`);
          return response.data;
      } catch (error) {
          console.error("Lỗi khi thu hồi tin nhắn:", error.response || error);
          throw error.response ? error.response.data : error;
      }
  },
  // Chia sẻ tin nhắn
  forwardMessage: async (originalMessageId, senderID, receiverIDs) => {
      try {
          const response = await axios.post(`${IPV4}/messages/forward`, {
              originalMessageId,
              senderID,
              receiverIDs
          });
          return response.data;
      } catch (error) {
          console.error("Lỗi khi chia sẻ tin nhắn:", error.response || error);
          throw error.response ? error.response.data : error;
      }
  },
  deleteSingleMessageForUser: async (messageId, userId) => {
    try {
        const response = await axios.delete(`${IPV4}/messages/delete-single/${messageId}/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa tin nhắn:", error.response || error);
        throw error.response ? error.response.data : error;
    }
},
fetchGroupMessages: async (groupId) => {
  try {
      const response = await axios.get(`${IPV4}/messages/group-messages`, {
          params: {
              groupId: groupId
          }
      });
      return response.data; // Trả về danh sách tin nhắn nhóm
  } catch (error) {
      

  }
},
  PinMessageByUserId: async (messageId, userId) => {
    try {
      const response = await axios.put(`${IPV4}/messages/${messageId}/pin/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error pinning message:', error);
      throw error.response ? error.response.data : error;
    }
  },
  UnpinMessageByUserId: async (messageId, userId) => {
  if (!messageId || !userId) {
    throw new Error("messageId hoặc userId không hợp lệ");
  }

  try {
    const url = `${IPV4}/messages/${messageId}/unpin/${userId}`;
    console.log("DELETE", url);
    
    const response = await axios.delete(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error unpinning message:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
  }

};

export default MessageService;
