import axios from "axios";

import { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, IPV4 } from '@env';

const UserService = {
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

  /**
   * Lấy danh sách bạn bè của một user dựa trên userId
   * @param {string} userId - ID của user
   * @returns {Promise} - Danh sách bạn bè
   */
  getFriends: async (userId) => {
    try {
      const response = await axios.get(`${IPV4}/${userId}/friends`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  searchUserByName: async (name) => {
     try {
         const response = await axios.get(`${IPV4}/searchUserByName`, {
             params: { name },
         });
         return response.data;
     } catch (error) {
         throw error.response ? error.response.data : error;
     }
  }
};


export default UserService;
