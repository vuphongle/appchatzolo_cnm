import React, { useState } from "react";
import "./MainPage.css"; // CSS riêng cho giao diện
import ContactsTab from "./ContactsTab";

// Dữ liệu danh sách tin nhắn
const messages = [
  { id: 1, groupName: "IUH - DHKTPM17A - CT7", unreadCount: 86, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 2, groupName: "Team Ổn CN Mới", unreadCount: 6, img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg" },
  { id: 3, groupName: "Team Ổn", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 4, groupName: "Nhóm 4 PTUD JAVA", unreadCount: 0, img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg" },
  { id: 5, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 6, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 7, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 8, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 9, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 10, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
  { id: 11, groupName: "Cloud của tôi", unreadCount: 0, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
];

// Component tin nhắn
const MessageItem = ({ groupName, unreadCount, img }) => (
  <li className="message-item">
    <img src={img} alt="Avatar" className="avatar" />
    <div className="message-info">
      <h4>{groupName}</h4>
      <p>Chưa có tin nhắn</p>
    </div>
    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
  </li>
);

// Component chính
const MainPage = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // State quản lý tab

  const toggleSettingsMenu = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  // Hàm render nội dung theo tab
  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <section className="welcome-section">
            <h1>Chào mừng đến với Zolo PC!</h1>
            <p>
              Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân,
              bạn bè được tối ưu hóa cho máy tính của bạn.
            </p>
          </section>
        );
      case "contacts":
        return <ContactsTab />;

      default:
        return null;
    }
  };

  return (
    <div className="main-container">
      {/* Thanh bên trái */}
      <nav className="sidebar-nav">
        <div className="nav-item">
          <img
            src="https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg"
            alt="User Avatar"
            className="avatar-img"
          />
        </div>
        <div className="nav-item" onClick={() => setActiveTab("chat")}>
          <i className="icon">💬</i>
        </div>
        <div className="nav-item" onClick={() => setActiveTab("contacts")}>
          <i className="icon">👥</i>
        </div>
        <div className="nav-item settings" onClick={toggleSettingsMenu}>
          <i className="icon">⚙️</i>
          {isSettingsOpen && (
            <div className="settings-menu">
              <ul>
                <li className="cat-dat">Thông tin tài khoản</li>
                <li className="cat-dat">Cài đặt</li>
                <li className="cat-dat">Dữ liệu</li>
                <li className="cat-dat">Ngôn ngữ</li>
                <li className="cat-dat">Hỗ trợ</li>
                <li className="logout">Đăng xuất</li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar header luôn hiển thị */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <input type="text" className="search-bar" placeholder="Tìm kiếm" />
          <button className="search-button">🔍</button>
          <button className="action-button" title="Thêm bạn">
            <img
              className="action-button-img"
              src="https://img.icons8.com/?size=100&id=23372&format=png&color=000000"
              alt="Add Friend"
            />
          </button>
          <button className="action-button" title="Tạo nhóm">
            <img
              className="action-button-img"
              src="https://img.icons8.com/?size=100&id=3734&format=png&color=000000"
              alt="Create Group"
            />
          </button>
        </div>

        {/* Sidebar tabs hiển thị trong tab "chat" */}
        {activeTab === "chat" && (
          <>
            <div className="sidebar-tabs">
              <button className="tab active">Tất cả</button>
              <button className="tab">Chưa đọc</button>
              <button className="tab">Phân loại</button>
            </div>
            <div className="message-list">
              <ul>
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    groupName={message.groupName}
                    unreadCount={message.unreadCount}
                    img={message.img}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
        {/* Sidebar tabs hiển thị trong tab "contacts" */}
        {activeTab === "contacts" && (
          <>
          <div className="container-fluid">
  <div className="d-flex align-items-start ">
    <div className="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
      <button
        className="nav-link active d-flex align-items-center fs-6 text-dark"
        id="v-pills-friendlist-tab"
        data-bs-toggle="pill"
        data-bs-target="#v-pills-friendlist"
        type="button"
        role="tab"
        aria-controls="v-pills-friendlist"
        aria-selected="true"
      >
        <i className="fas fa-user-friends me-2"></i>
        Danh sách bạn bè
      </button>
      <button
        className="nav-link d-flex align-items-center fs-6 text-dark"
        id="v-pills-grouplist-tab"
        data-bs-toggle="pill"
        data-bs-target="#v-pills-grouplist"
        type="button"
        role="tab"
        aria-controls="v-pills-grouplist"
        aria-selected="false"
      >
        <i className="fas fa-users me-2"></i>
        Danh sách nhóm
      </button>
      <button
        className="nav-link d-flex align-items-center fs-6 text-dark"
        id="v-pills-friend-tab"
        data-bs-toggle="pill"
        data-bs-target="#v-pills-friend"
        type="button"
        role="tab"
        aria-controls="v-pills-friend"
        aria-selected="false"
      >
        <i className="fas fa-user-plus me-2"></i>
        Lời mời kết bạn
      </button>
      <button
        className="nav-link d-flex align-items-center fs-6 text-dark"
        id="v-pills-group-tab"
        data-bs-toggle="pill"
        data-bs-target="#v-pills-group"
        type="button"
        role="tab"
        aria-controls="v-pills-group"
        aria-selected="false"
      >
        <i className="fas fa-users me-2"></i>
        Lời mời vào nhóm
      </button>
    </div>
  </div>
</div>

          </>
        )}
      </aside>

      {/* Nội dung chính */}
      <main className="main-content">{renderContent()}</main>
    </div>
  );
};

export default MainPage;
