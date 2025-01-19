import axios from "axios";

const API_BASE_URL = "http://localhost:8080/user"; // Địa chỉ API

const UserService = {
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

  /**
   * Lấy danh sách bạn bè của một user dựa trên userId
   * @param {string} userId - ID của user
   * @returns {Promise} - Danh sách bạn bè
   */
  getFriends: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${userId}/friends`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default UserService;
