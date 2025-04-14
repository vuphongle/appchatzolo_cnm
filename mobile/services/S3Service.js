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

  uploadAudio: async (file)=> {
    // Ensure proper URI format
    const fixedUri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;
    const timestamp = Date.now();
    
    // Define allowed audio types
    const allowedTypes = {
      'mpeg': 'audio/mpeg',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'audio/mp4',
      'm4a': 'audio/m4a',
    };
    
    // Extract file extension
    const originalName = file.fileName || file.name || `file_${timestamp}`;
    const fileExtension = originalName.split('.').pop().toLowerCase();
    
    // Validate file type (uncommented for better error handling)
    if (!allowedTypes[fileExtension]) {
      console.log(`Định dạng âm thanh không hợp lệ: ${fileExtension}. Chỉ hỗ trợ mp3, wav, mp4 và m4a.`);
      throw new Error('Unsupported audio format');
    }
    
    const finalFileName = `${timestamp}.${fileExtension}`;
    const mimeType = file.type || allowedTypes[fileExtension] || 'application/octet-stream';
    
    console.log('Đang chuẩn bị gửi tệp âm thanh:', {
      name: finalFileName,
      type: mimeType,
      uri: fixedUri.substring(0, 50) + '...' // Log only part of the URI for readability
    });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri: fixedUri,
      name: finalFileName,
      type: mimeType,
    });
    
    // Add timeout and retry logic
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Make sure IPV4 is defined in your scope
        if (!IPV4) {
          throw new Error('Server address (IPV4) is not defined');
        }
        
        // Add timeout to prevent hanging requests
        const response = await axios.post(`${IPV4}/s3/file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
          transformRequest: (data) => data,
        });
        
        console.log('Upload success:', response.data);
        return response.data.url;
      } catch (error) {
        retryCount++;
        
        // Log detailed error information
        console.log(`Lỗi upload âm thanh (lần thử ${retryCount}/${maxRetries}):`, error.message);
        
        if (error.response) {
          // Server responded with an error
          console.log('Server response:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request was made but no response received
          console.log('Không nhận được phản hồi từ server. Kiểm tra kết nối mạng hoặc địa chỉ server.');
        }
        
        if (retryCount >= maxRetries) {
          console.log('Đã hết số lần thử lại. Upload thất bại.');
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        console.log(`Đang thử lại lần ${retryCount + 1}...`);
      }
    }
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    const timestamp = Date.now();

    // Lấy tên gốc hoặc tạo tên mặc định
    let originalName = file.fileName || `file_${timestamp}`;
   const sanitizedBaseName = originalName
      .replace(/\.[^/.]+$/, '') // bỏ phần đuôi
      .replace(/[^a-zA-Z0-9-_]/g, '_'); // thay ký tự đặc biệt bằng "_"
      const finalFileName = `${timestamp}.${sanitizedBaseName}`;
    formData.append('file', {
      uri: file.uri,
      name: finalFileName,
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
  let  fileExtension = originalName.split('.').pop().toLowerCase();

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
      'mpeg':'audio/mpeg',
      'wav': 'audio/wav',
      
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
