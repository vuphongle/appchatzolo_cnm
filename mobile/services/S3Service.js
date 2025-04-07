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
  // Tạo tên file an toàn - chỉ sử dụng ký tự Latin cơ bản, số và dấu gạch dưới
  const timestamp = Date.now();
  const safeFileName = `file_${timestamp}`;
  
  // Lấy phần mở rộng từ tên file gốc (nếu có)
  const fileExtension = file.fileName 
    ? file.fileName.split('.').pop().toLowerCase() 
    : file.uri.split('.').pop().toLowerCase();
  
  // Tạo tên file hoàn chỉnh và an toàn
  const finalFileName = `${safeFileName}.${fileExtension}`;
  
  // Xác định đúng mimeType dựa trên phần mở rộng
  let mimeType = file.type;
  if (!mimeType) {
    // Xác định mimeType dựa trên phần mở rộng phổ biến
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    mimeType = mimeTypes[fileExtension] || `image/${fileExtension}`;
  }

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
    name: finalFileName,  // Sử dụng tên file an toàn
    type: mimeType,
  });

  console.log('Uploading file:', {
    uri: file.uri,
    safeName: finalFileName,
    type: mimeType
  });

  try {
    const response = await axios.post(`${IPV4}/s3/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    });
    console.log('Upload success:', response.data);
    return response.data.url; // Trả về URL ảnh mới
  } catch (error) {
    console.error('Upload failed:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error.response ? error.response.data : error;
  }
},
};

export default S3Service;
