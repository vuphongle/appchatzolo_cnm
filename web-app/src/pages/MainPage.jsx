import React from "react";
import "./MainPage.css"; // CSS riêng cho giao diện chính

const MainPage = () => {
  return (
    <div className="main-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Zalo Web</h2>
        </div>
        <div className="sidebar-search">
          <input type="text" placeholder="Tìm kiếm" />
        </div>
        <div className="sidebar-categories">
          <button>Tất cả</button>
          <button>Phân loại</button>
        </div>
        <div className="sidebar-messages">
          <h4>Tất cả tin nhắn</h4>
          <ul>
            <li>
              <span>Truyền File</span>
              <span>15 phút trước</span>
            </li>
            {/* Thêm các tin nhắn khác */}
          </ul>
        </div>
      </aside>
      <main className="main-content">
        <header className="content-header">
          <div className="profile-section">
            <span className="profile-icon">👤</span>
          </div>
        </header>
        <section className="welcome-section">
          <h1>Chào mừng đến với Zalo PC!</h1>
          <p>
            Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân,
            bạn bè được tối ưu hóa cho máy tính của bạn.
          </p>
          <div className="action-buttons">
            <button className="btn-upload">Gửi File</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MainPage;
