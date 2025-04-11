import axios from 'axios';
import showToast from '../utils/AppUtils';

const API_BASE_URL = 'http://localhost:8080/s3';

const S3Service = {
    /**
     * Upload avatar lên S3
     * @param {File} file - File ảnh cần upload
     * @returns {Promise<string>} - URL của avatar sau khi upload
     */
    uploadAvatar: async (file, userId) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

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

            // Kiểm tra lỗi 400 (vượt quá kích thước)
            if (error.response && error.response.status === 400) {
                showToast("Kích thước file vượt quá 20MB.", "error")
            } else {
                // Thông báo lỗi chung nếu không phải lỗi 400
                showToast("Kích thước file vượt quá 20MB.", "error")
            }

            throw error.response ? error.response.data : error;
        }
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`${API_BASE_URL}/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.url; // Trả về URL ảnh mới
        } catch (error) {
            // Kiểm tra lỗi 400 (vượt quá kích thước)
            if (error.response && error.response.status === 400) {
                showToast("Kích thước file vượt quá 20MB.", "error")
            } else {
                // Thông báo lỗi chung nếu không phải lỗi 400
                showToast("Kích thước file vượt quá 20MB.", "error")
            }
            throw error.response ? error.response.data : error;
        }
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`${API_BASE_URL}/file`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.url; // Trả về URL file mới
        } catch (error) {
            // Kiểm tra lỗi 400 (vượt quá kích thước)
            if (error.response && error.response.status === 400) {
                showToast("Kích thước file vượt quá 20MB.", "error")
            } else {
                // Thông báo lỗi chung nếu không phải lỗi 400
                showToast("Kích thước file vượt quá 20MB.", "error")
            }
            throw error.response ? error.response.data : error;
        }
    },
};

export default S3Service;
