const formatDate = (timestamp) => {
  try {
    console.log('Timestamp in formatDate:', timestamp); // Log the timestamp for debugging
    if (typeof timestamp === 'string') {
      if (
        timestamp.includes('phút trước') ||
        timestamp.includes('giờ trước') ||
        timestamp.includes('Vừa gửi xong') ||
        /^\d{1,2}:\d{2}$/.test(timestamp)
      ) {
        // Kiểm tra định dạng HH:MM

        return timestamp;
      }
    }

    if (!timestamp) {
      console.log('Timestamp is empty');
      return 'vừa xong';
    }

    let date = new Date(timestamp);
    date.setHours(date.getHours() + 7);

    if (isNaN(date.getTime())) {
      return 'vừa xong';
    }

    let now = new Date();
    let diffInSeconds = Math.floor((now - date) / 1000);
    let diffInMinutes = Math.floor(diffInSeconds / 60);
    let diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (error) {
    console.error('Error in formatDate:', error, 'for timestamp:', timestamp);
    return 'vừa xong';
  }
};

export { formatDate };
