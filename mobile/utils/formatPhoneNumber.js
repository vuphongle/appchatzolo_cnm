export const formatPhoneNumber = (phone) => {
    // Loại bỏ khoảng trắng
    const cleaned = phone.replace(/\s+/g, '');

    // Kiểm tra nếu có ký tự không phải số và không phải dấu + ở đầu
    if (!/^(\+?\d+)$/.test(cleaned)) {
        return null; // Nếu có ký tự không hợp lệ, trả về null
    }

    // Nếu đã có +84 thì giữ nguyên
    if (cleaned.startsWith('+84')) {
        // Kiểm tra độ dài số điện thoại, phải có 12 chữ số (bao gồm dấu +84)
        if (cleaned.length === 12) {
            return cleaned;
        } else {
            return null; // Nếu số điện thoại không đủ 12 chữ số, trả về null
        }
    }

    // Nếu bắt đầu bằng 0 thì chuyển thành +84
    if (cleaned.startsWith('0')) {
        const formattedPhone = '+84' + cleaned.substring(1);
        // Kiểm tra độ dài số điện thoại, phải có 12 chữ số (bao gồm dấu +84)
        if (formattedPhone.length === 12) {
            return formattedPhone;
        } else {
            return null; // Nếu số điện thoại không đủ 12 chữ số, trả về null
        }
    }

    // Trường hợp khác, trả về số đã được làm sạch
    return cleaned.length === 10 ? cleaned : null; // Kiểm tra số điện thoại có 10 chữ số (đối với các trường hợp khác)
};
