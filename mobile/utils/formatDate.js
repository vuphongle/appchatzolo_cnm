const formatDate = (timestampArray) => {
    // Chuyển đổi thành đối tượng Date
    let date = new Date(timestampArray);

    // Cộng 7 giờ vào thời gian nhận từ DynamoDB để chuyển về múi giờ của bạn
    date.setHours(date.getHours() + 7);

    // Trả về định dạng ngày giờ theo múi giờ của bạn
    return date.toLocaleString('vi-VN', {
        // day: '2-digit',
        // month: '2-digit',
        // year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit',
    });
};
export { formatDate };