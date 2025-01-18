import React, { useState, useEffect } from "react";
import "./MainPage.css"; // CSS riêng cho giao diện
import UserService from "../services/UserService";
import MessageService from "../services/MessageService";
import flag from "../image/icon_VN.png";
import avatar_default from '../image/avatar_user.jpg';
import { useAuth } from "../context/AuthContext"; // Import custom hook để sử dụng context
import ContactsTab from "./ContactsTab";

// Dữ liệu danh sách tin nhắn
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

// Component chính
const MainPage = () => {
    const { MyUser } = useAuth();

    const [activeTab, setActiveTab] = useState("chat"); // State quản lý tab
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

    const [phoneNumber, setPhoneNumber] = useState("");
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state

    const [sentInvitations, setSentInvitations] = useState([]); // Danh sách lời mời đã gửi

    // Xử lý gửi tin nhắn kết bạn
    const [isFriendRequestModalOpen, setIsFriendRequestModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState(`Xin chào, mình là ${MyUser.my_user.name}. Mình biết bạn qua số điện thoại. Kết bạn với mình nhé!`);
    const [isRequestSent, setIsRequestSent] = useState(false);

    // Hàm render nội dung theo tab
    const renderContent = () => {
        switch (activeTab) {
            case "chat":
                return (
                    <div>
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
                                    <h1>Chào mừng {MyUser.my_user.name} đến với Zolo PC!</h1>
                                    <p>
                                        Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người
                                        thân, bạn bè được tối ưu hóa cho máy tính của bạn.
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                );
            case "contacts":
                return <ContactsTab />;

            default:
                return null;
        }
    };

    const handleSearchFriend = async () => {
        if (phoneNumber === MyUser.my_user.phoneNumber) {
            setError("Bạn không thể tìm kiếm chính mình.");
            return;
        }

        setLoading(true);
        try {
            // Trước khi gửi, thay thế %2B thành dấu +
            const formattedPhoneNumber = phoneNumber.replace(/%2B/g, '+');

            const response = await UserService.get("/searchFriend", { phoneNumber: formattedPhoneNumber });

            setUser(response); // Cập nhật thông tin người dùng
            setError(null);

            setIsUserInfoModalOpen(true); // Mở modal thông tin người dùng
        } catch (err) {
            setUser(null);
            setError("Người dùng không tồn tại");
        } finally {
            setLoading(false);
        }
    };



    const handleAddFriend = () => {
        setIsModalOpen(true); // Open the "Add Friend" modal
    };

    const closeAllModal = () => {
        setIsModalOpen(false);
        setIsUserInfoModalOpen(false);
    };

    // Hàm gửi yêu cầu kết bạn
    const sendFriendRequest = async () => {
        const message = {
            id: new Date().getTime().toString(),
            senderID: MyUser.my_user.id,
            receiverID: user.id,
            content: messageContent,
            isRead: false,
            sendDate: new Date().toISOString(),
            status: 'Chờ đồng ý',
        };

        try {
            // Xóa những lời mời cũ trước khi gửi lời mời mới
            await MessageService.deleteInvitation(MyUser.my_user.id, user.id);

            // Gửi yêu cầu kết bạn qua MessageService
            const response = await MessageService.post('/addFriend', message);

            setIsRequestSent(true);
            setIsFriendRequestModalOpen(false);


            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };


    // Kiểm tra giá trị của MyUser tại đây
    console.log("MyUser:", MyUser);

    if (!MyUser) {
        return <div>User not logged in</div>;
    }

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
                    <button className="action-button" title="Thêm bạn" onClick={handleAddFriend}>
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
                                        onClick={() => setSelectedChat(message)}
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


            {/* ---------------------------------------------------------------------------------- */}
            {/* Add Friend Modal */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2 className="Search-model-header">Thêm bạn</h2>
                        <div className="input-group">
                            <select className="country-code">
                                <option value="+84">(+84) <img src={flag} alt="Flag" /></option>
                                {/* Thêm các lựa chọn khác nếu cần */}
                            </select>
                            <input
                                className="phone-number"
                                type="text"
                                placeholder="Số điện thoại"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        {error && <div className="error">{error}</div>}

                        <div className="action-buttons">
                            <button className="search-modal" onClick={handleSearchFriend} disabled={loading}>
                                {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
                            </button>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {isUserInfoModalOpen && user && (
                <div className="modal">
                    <div className="modal-content user-info-modal">
                        <div className="modal-header">
                            <i className="fas fa-chevron-left" onClick={() => setIsUserInfoModalOpen(false)}></i>
                            <h2>Thông tin tài khoản</h2>
                            <i className="fas fa-times" onClick={() => closeAllModal()}></i>
                        </div>
                        <div className="modal-body">
                            <div>
                                <img src={user.avatar || avatar_default} />
                                <h3>{user.name}</h3>
                            </div>

                            <div className="action-buttons">
                                {/* Kiểm tra nếu user đó có trong friendIds của my_user thì không hiển thị nút Kết bạn */}
                                {/* {!MyUser.my_user.friendIds.includes(user.id) && ( */}
                                <button onClick={() => setIsFriendRequestModalOpen(true)}>Kết bạn</button>
                                {/* )} */}
                                <button className="message-button">Nhắn tin</button>
                            </div>

                            {/* Modal yêu cầu kết bạn */}
                            {isFriendRequestModalOpen && (
                                <div className="friend-request-modal">
                                    <div className="modal-header">
                                        <h2>Gửi yêu cầu kết bạn</h2>
                                        <i className="fas fa-times" onClick={() => setIsFriendRequestModalOpen(false)}></i>
                                    </div>
                                    <div>
                                        <textarea
                                            className="message-sendRequest"
                                            placeholder="Nhập nội dung yêu cầu kết bạn"
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                        />
                                        <div className="sendRequest-class">
                                            <button className="sendRequest-button" onClick={sendFriendRequest}>Gửi yêu cầu</button>
                                            <button className="closeSendRequest-button" onClick={() => setIsFriendRequestModalOpen(false)}>Hủy</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="personal-info">
                                <p>Giới tính:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{user.sex}</p>
                                <p>Ngày sinh:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{user.dob}</p>
                                <p>Điện thoại:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{user.phoneNumber}</p>
                            </div>

                            <div className="list-container">
                                <div className="list-item">
                                    <i className="fas fa-users"></i>
                                    <span>Nhóm chung (0)</span>
                                </div>
                                <div className="list-item">
                                    <i className="fas fa-id-card"></i>
                                    <span>Chia sẻ danh thiếp</span>
                                </div>
                                <div className="list-item">
                                    <i className="fas fa-ban"></i>
                                    <span>Chặn tin nhắn và cuộc gọi</span>
                                </div>
                                <div className="list-item">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>Báo xấu</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isRequestSent && (
                <div className="notification-box">
                    <p>Bạn đã gửi lời mời kết bạn thành công!</p>
                    <button className="button-confirm-send" onClick={() => setIsRequestSent(false)}>OK</button>
                </div>
            )}
        </div>
    );
};

export default MainPage;
