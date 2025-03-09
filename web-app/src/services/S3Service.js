import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/s3';

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
            const response = await axios.post(`${API_BASE_URL}/avatar`, formData, {
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
    }
};

export default S3Service;



