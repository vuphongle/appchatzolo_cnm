/**
 * Hàm format ngày sinh từ chuỗi (YYYY-MM-DD, YYYY/MM/DD, ...) sang dd/MM/yyyy
 * @param {string} dob - Chuỗi ngày sinh (VD: "2003-09-29" hoặc "2003/09/29")
 * @returns {string} - Chuỗi dạng dd/MM/yyyy (VD: "29/09/2003") hoặc "Chưa cập nhật"
 */
export const formatDOB = (dob) => {
  if (!dob) return 'Chưa cập nhật';

  // Chuyển chuỗi dob thành đối tượng Date
  const date = new Date(dob);

  // Kiểm tra xem có parse được không
  if (isNaN(date.getTime())) {
    return 'Chưa cập nhật';
  }

  // Lấy ngày, tháng, năm
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Trả về chuỗi dd/MM/yyyy
  return `${day}/${month}/${year}`;
};
