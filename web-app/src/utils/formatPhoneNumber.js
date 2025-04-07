export const formatPhoneNumber = (phone) => {
    if (!phone) return null;

    // Loại bỏ khoảng trắng
    const cleaned = phone.replace(/\s+/g, '');

    // Kiểm tra định dạng: chỉ chứa số và tùy chọn dấu + ở đầu
    if (!/^(\+?\d+)$/.test(cleaned)) {
        return null;
    }

    // Nếu đã có +84 thì kiểm tra độ dài (12 ký tự: +84 và 9 số)
    if (cleaned.startsWith('+84')) {
        return cleaned.length === 12 ? cleaned : null;
    }

    // Nếu bắt đầu bằng 0 và có 10 chữ số, chuyển thành định dạng quốc tế +84
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return '+84' + cleaned.slice(1);
    }

    // Nếu không thỏa mãn các điều kiện trên, trả về null
    return null;
};  