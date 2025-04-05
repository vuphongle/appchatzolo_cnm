export const isOlderThan14 = (birthDate) => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Nếu ngày sinh chưa đến trong năm nay, trừ đi 1 tuổi
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= 14;
  }
  return age >= 14;
};
