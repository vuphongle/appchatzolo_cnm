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

  searchUserByName: async (name, userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/searchUserByName`, {
        params: { name, userId }, // Gửi userId để lọc danh sách bạn bè
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  //lấy trạng thái online offline

  getUserById: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/findById/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },


  /** 
   * API cập nhật thông tin người dùng 
   * @param {string} userId - ID người dùng
   * @param {Object} data - Thông tin cập nhật (name, dob)
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  updateUserInfo: async (userId, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/update/${userId}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  delete: async (url) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}${url}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  findByPhoneNumber: async (phone) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/findByPhoneNumber`, {
        phoneNumber: phone
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};


export default UserService;
