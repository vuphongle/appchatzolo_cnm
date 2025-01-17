import React, { useState } from "react";
import "./MainPage.css"; // CSS riêng cho giao diện

const messages = [
  {
    id: 1,
    groupName: "IUH - DHKTPM17A - CT7",
    unreadCount: 86,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 2,
    groupName: "Team Ổn CN Mới",
    unreadCount: 6,
    img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg",
  },
  {
    id: 3,
    groupName: "Team Ổn",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 4,
    groupName: "Nhóm 4 PTUD JAVA",
    unreadCount: 0,
    img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg",
  },
  {
    id: 5,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 6,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 7,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 8,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 9,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 10,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
  {
    id: 11,
    groupName: "Cloud của tôi",
    unreadCount: 0,
    img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg",
  },
];

//thêm sự kiện onClick để cập nhật state selectedChat trong MainPage.
const MessageItem = ({ groupName, unreadCount, img, onClick }) => (
  <li className="message-item" onClick={onClick}>
    <img src={img} alt="Avatar" className="avatar" />
    <div className="message-info">
      <h4>{groupName}</h4>
      <p>Chưa có tin nhắn</p>
    </div>
    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
  </li>
);

const MainPage = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  //chọn component MessageItem
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState(""); // Nội dung tin nhắn nhập vào
  const [chatMessages, setChatMessages] = useState([]); // Danh sách tin nhắn của chat

  //nhấn enter gửi tin nhắn
  const handleSendMessage = (e) => {
    if (e.key === "Enter" && messageInput.trim() !== "") {
      // Thêm tin nhắn mới vào danh sách chatMessages
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, text: messageInput },
      ]);
      setMessageInput(""); // Reset ô nhập tin nhắn
    }
  };

  const toggleSettingsMenu = () => {
    setIsSettingsOpen(!isSettingsOpen);
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
        <div className="nav-item">
          <i className="icon">💬</i>
        </div>
        <div className="nav-item">
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

      {/* Sidebar danh sách tin nhắn */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <input type="text" className="search-bar" placeholder="Tìm kiếm" />
          <button className="search-button">🔍</button>

          <button className="action-button" title="Thêm bạn">
            <img
              className="action-button-img"
              src="https://img.icons8.com/?size=100&id=23372&format=png&color=000000"
              alt=""
            />
          </button>
          <button className="action-button" title="Tạo nhóm">
            <img
              className="action-button-img"
              src="https://img.icons8.com/?size=100&id=3734&format=png&color=000000"
              alt=""
            />
          </button>
        </div>
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
                onClick={() => setSelectedChat(message)}
              />
            ))}
          </ul>
        </div>
      </aside>

      {/* Nội dung chính */}
      <main className="main-content">
        {selectedChat ? (
          <>
            <header className="content-header">
              <div className="profile">
                <img src={selectedChat.img} alt="Avatar" className="avatar" />
                <span>{selectedChat.groupName}</span>
              </div>
            </header>
            <section className="chat-section">
              {/* Khu vực hiển thị tin nhắn */}
              <div className="chat-messages">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="chat-message">
                      <p>{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <p>Bắt đầu trò chuyện với {selectedChat.groupName}</p>
                )}
              </div>
              {/* Thanh nhập tin nhắn */}
              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleSendMessage}
                  placeholder={`Nhập @, tin nhắn tới ${selectedChat.groupName}`}
                />
                <div className="chat-icons">
                  <button title="Sticker">
                    <span>😊</span>
                  </button>
                  <button title="Image">
                    <span>🖼️</span>
                  </button>
                  <button title="Attachment">
                    <span>📎</span>
                  </button>
                  <button title="Capture">
                    <span>📸</span>
                  </button>
                  <button title="Thumbs Up">
                    <span>👍</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="content-header">
              <div className="profile">
                <span className="profile-picture">👤</span>
              </div>
            </header>
            <section className="welcome-section">
              <h1>Chào mừng đến với Zolo PC!</h1>
              <p>
                Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người
                thân, bạn bè được tối ưu hóa cho máy tính của bạn.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MainPage;
