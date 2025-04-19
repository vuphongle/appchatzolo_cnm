import axios from "axios";
import { IPV4 } from "@env";

const GroupService = {
    /**
     * Lấy danh sách nhóm từ server
     * @returns {Promise<Array>} - Danh sách nhóm
     */
    getGroupMembers: async (groupID) => {
        try {
        const response = await axios.get(`${IPV4}/groups/getGroupMembers`,
            {params: { groupId:groupID}} // Thay thế groupId bằng ID nhóm bạn muốn lấy
        );
        return response.data;
        } catch (error) {
        // console.error("Lỗi khi lấy danh sách thành viên nhóm:", error);
        throw error.response ? error.response.data : error;
        }
    },
    // getGroupByID: async (groupID) => {
    //     try {
    //     const response = await axios.get(`${IPV4}/groups/getGroupById`,{
    //         params: { groupId: groupID } // Thay thế groupId bằng ID nhóm bạn muốn lấy
    //     });
    //     return response;
    //     } catch (error) {
    //     console.error("Lỗi khi lấy thông tin nhóm:", error);
    //     throw error.response ? error.response.data : error;
    //     }
    // },
    
   
    addMember: async (data) => {
        try {
          const response = await axios.post(`${IPV4}/groups/addMember`, data);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Cập nhật thông tin nhóm
      updateGroup: async (data) => {
        try {
          const response = await axios.put(`${IPV4}/groups/update`, data);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Thăng cấp thành viên lên Phó nhóm
      promoteToCoLeader: async (data) => {
        try {
          const response = await axios.put(`${IPV4}/groups/promoteToCoLeader`, data);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Hạ cấp thành viên xuống thành viên thường
      demoteToMember: async (data) => {
        try {
          const response = await axios.put(`${IPV4}/groups/demoteToMember`, data);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Xóa nhóm
      deleteGroup: async (userId, groupId) => {
        try {
          const response = await axios.delete(`${IPV4}/groups/delete/${userId}/${groupId}`);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Gửi tin nhắn đến tất cả thành viên trong nhóm
      sendMessageToGroup: async (data) => {
        try {
          const response = await axios.post(`${IPV4}/groups/send-message`, data);
          return response.data;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
    
      // Xóa thành viên khỏi nhóm
      removeMember: async (groupId, targetUserId, actorUserId) => {
        try {
          const response = await axios.delete(`${IPV4}/groups/removeMember/${groupId}/${targetUserId}/${actorUserId}`);
          return response;
        } catch (error) {
          throw error.response ? error.response.data : error;
        }
      },
      
    getGroupsByIds: async (userId) => {
      try {
          const response = await axios.get(`${IPV4}/groups/getGroupsByUserId`, { params: { userId } });
          return response.data;
      } catch (error) {
          console.error("Error fetching groups by IDs:", error.response || error);
          throw error; // Nếu muốn xử lý lỗi cụ thể sau
      }
  },
    };
export default GroupService;