import axios from 'axios';

import { IPV4 } from '@env';    

const S3Service = {
    /**
   * Upload avatar lên S3
   * @param {File} file - File ảnh cần upload
   * @returns {Promise<string>} - URL của avatar sau khi upload
   */
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`${IPV4}/avatar`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.url) {
                return response.data.url; // Trả về URL ảnh từ server
            } else {
                throw new Error("Không nhận được URL từ server");
            }
        } catch (error) {
            console.error("Lỗi upload:", error);
            throw error.response ? error.response.data : error;
        }
    },

    uploadImage: async (file) => {
        const formData = new FormData();
       
        formData.append("file", {
            uri: file.uri, 
            name: file.fileName, 
            type: file.type,
          });
        

        try {
            const response = await axios.post(`${IPV4}/s3/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.url; 
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append("file", {
            uri: file.uri, 
            name: file.fileName, 
            type: file.type,
          });

        try {
            const response = await axios.post(`${IPV4}/s3/file`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.url; // Trả về URL ảnh mới
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default S3Service;



