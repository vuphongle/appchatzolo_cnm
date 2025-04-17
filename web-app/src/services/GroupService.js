import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/groups'; // Địa chỉ API của backend nhóm

const GroupService = {
  // Tạo nhóm
  createGroup: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/create`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Thêm thành viên vào nhóm
  addMember: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/addMember`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật thông tin nhóm
  updateGroup: async (data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/update`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Thăng cấp thành viên lên Phó nhóm
  promoteToCoLeader: async (data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/promoteToCoLeader`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Hạ cấp thành viên xuống thành viên thường
  demoteToMember: async (data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/demoteToMember`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa nhóm
  deleteGroup: async (userId, groupId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete/${userId}/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Gửi tin nhắn đến tất cả thành viên trong nhóm
  sendMessageToGroup: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send-message`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách thành viên trong nhóm
  getGroupMembers: async (groupId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getGroupMembers`, { params: { groupId } });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa thành viên khỏi nhóm
  removeMember: async (groupId, targetUserId, actorUserId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/removeMember/${groupId}/${targetUserId}/${actorUserId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default GroupService;
