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
    formData.append('file', file);

    try {
      const response = await axios.post(`${IPV4}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.url) {
        return response.data.url; // Trả về URL ảnh từ server
      } else {
        throw new Error('Không nhận được URL từ server');
      }
    } catch (error) {
      console.error('Lỗi upload:', error);
      throw error.response ? error.response.data : error;
    }
  },

  uploadImage: async (file) => {
    const formData = new FormData();

    formData.append('file', {
      uri: file.uri,
      name: file.fileName,
      type: file.type,
    });

    try {
      const response = await axios.post(`${IPV4}/s3/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  uploadFile: async (file) => {
    const timestamp = Date.now();
  
    // Lấy tên gốc hoặc tạo tên mặc định
    let originalName = file.fileName || `file_${timestamp}`;
    // let fileExtension = 'doc'; // fallback mặc định
  
    // // Nếu tên gốc không có đuôi, thêm luôn đuôi mặc định
    // if (!originalName.includes('.')) {
    //   originalName += '.doc';
    // }
  
    // Tách đuôi file
    fileExtension = originalName.split('.').pop().toLowerCase();
  
    // Làm sạch tên file (bỏ phần đuôi và thay ký tự đặc biệt)
    const sanitizedBaseName = originalName
      .replace(/\.[^/.]+$/, '') // bỏ phần đuôi
      .replace(/[^a-zA-Z0-9-_]/g, '_'); // thay ký tự đặc biệt bằng "_"
  
    // Tên file cuối cùng
    const finalFileName = `${timestamp}.${file.name}`;
  
    // Map mime types
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mimeType = file.type || mimeTypes[fileExtension] || 'application/octet-stream';
  
    // FormData
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      name: finalFileName,
      type: mimeType,
    });
  
    console.log('Uploading file:', {
      originalName,
      finalFileName,
      mimeType,
      uri: file.uri
    });
  
    try {
      const response = await axios.post(`${IPV4}/s3/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        transformRequest: (data) => data,
      });
      console.log('Upload success:', response.data);
      return response.data.url;
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error.response ? error.response.data : error;
    }
  }
  
  
};

export default S3Service;
