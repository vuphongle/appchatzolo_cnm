import React, { useState } from "react";
import "./RegisterPage.css"; // CSS riêng cho giao diện đăng ký
import ApiService from "../services/ApiService";

const RegisterPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

    const handleRegister = async () => {
        setErrorMessage(''); // Reset lỗi trước khi thực hiện
       
    
        try {
            // Gọi API để đăng ký người dùng
            await ApiService.post('/auth/create-user', {
                phoneNumber,
                password,
            });
    
            alert('User created successfully');
            
        } catch (error) {
            // Hiển thị lỗi nếu API trả về lỗi
            setErrorMessage(error.response?.data || 'Error creating user');
        } finally {
           
        }
    };


  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng ký tài khoản</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <div className="input-group">
            <label htmlFor="phone">📱 Số điện thoại</label>
            <input
              id="phone"
              type="text"
              placeholder="+84XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">🔒 Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* <div className="input-group">
            <label htmlFor="confirmPassword">🔒 Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div> */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <button className="btn-register" type="submit">
            Đăng ký
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
