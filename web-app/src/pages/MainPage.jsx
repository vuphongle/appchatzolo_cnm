import React, { useState, useEffect } from "react";
import "./MainPage.css"; // CSS riêng cho giao diện
import UserService from "../services/UserService";
import MessageService from "../services/MessageService";
import flag from "../image/icon_VN.png";
import avatar_default from '../image/avatar_user.jpg';
import { useAuth } from "../context/AuthContext"; // Import custom hook để sử dụng context
import ContactsTab from "./ContactsTab";
import { useWebSocket } from "../context/WebSocket";
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';



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
    const navigate = useNavigate();

    const { MyUser, setMyUser, logout } = useAuth();
    const { sendMessage, onMessage } = useWebSocket(); // Lấy hàm gửi tin nhắn từ context
    const [activeTab, setActiveTab] = useState("chat"); // State quản lý tab
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    //chọn component MessageItem
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState(""); // Nội dung tin nhắn nhập vào
    const [chatMessages, setChatMessages] = useState([]); // Danh sách tin nhắn của chat

    const [isLoggingOut, setIsLoggingOut] = useState(false);



    // useEffect để tải tin nhắn khi chọn cuộc trò chuyện
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !selectedChat?.id) return;

        MessageService.get(`/messages?senderID=${MyUser?.my_user?.id}&receiverID=${selectedChat?.id}`)
            .then(data => {
                // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
                const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));
                setChatMessages(sortedMessages);
            })
            .catch(err => console.error("Error fetching messages:", err));
    }, [selectedChat, MyUser?.my_user?.id]);

    //lấy dữ liệu messages từ backend
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        // Gọi API để lấy dữ liệu tin nhắn từ backend
        MessageService.get("/messages")
            .then((data) => {
                // Cập nhật dữ liệu tin nhắn
                setMessages(data);
            })
            .catch((err) => {
                console.error("Error fetching messages:", err);
            });
    }, []); // Chỉ chạy một lần khi component được mount



    // Lắng nghe tin nhắn mới từ WebSocket theo thời gian thực
    useEffect(() => {
        const unsubscribe = onMessage((incomingMessage) => {
            if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !selectedChat?.id) return;

            if (
                (incomingMessage.senderID === MyUser?.my_user?.id && incomingMessage.receiverID === selectedChat?.id) ||
                (incomingMessage.senderID === selectedChat?.id && incomingMessage.receiverID === MyUser?.my_user?.id)
            ) {
                setChatMessages((prev) => [...prev, incomingMessage].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
            }
        });

        return () => {
            unsubscribe(); // Hủy đăng ký khi component unmount
        };
    }, [selectedChat, onMessage, MyUser?.my_user?.id]);
    //cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        const chatContainer = document.querySelector(".chat-messages");
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [chatMessages]);



    const [friends, setFriends] = useState([]); // Danh sách bạn bè
    // Lấy danh sách bạn bè từ backend
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id) return;

        UserService.getFriends(MyUser.my_user.id)
            .then((data) => {
                setFriends(data); // Cập nhật danh sách bạn bè
            })
            .catch((err) => {
                console.error("Error fetching friends:", err);
            });
    }, [MyUser]);



    //nhấn enter gửi tin nhắn
    const handleSendMessage = () => {
        if (messageInput.trim() === "" || !selectedChat) return;

        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !selectedChat?.id) return;

        const message = {
            id: new Date().getTime().toString(),
            senderID: MyUser.my_user.id, // Thay bằng ID người dùng hiện tại
            receiverID: selectedChat.id,
            content: messageInput,
            sendDate: new Date().toISOString(),
            isRead: false
        };

        sendMessage(message); // Gửi qua WebSocket
        setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));// sap xep tin nhan
        setMessageInput(""); // Xóa input
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

    const [friendRequests, setFriendRequests] = useState([]);

    // Xử lý gửi tin nhắn kết bạn
    const [isFriendRequestModalOpen, setIsFriendRequestModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState(`Xin chào, mình là ${MyUser?.my_user?.name}. Mình biết bạn qua số điện thoại. Kết bạn với mình nhé!`);
    const [isRequestSent, setIsRequestSent] = useState(false);
    //Tích hợp danh sách bạn bè vào danh sách tin nhắn
    const allMessagesAndFriends = [
        ...messages,
        ...(Array.isArray(friends) ? friends.map((friend) => ({
            id: friend.id,
            groupName: friend.name,
            unreadCount: 0,
            img: friend.avatar,
        })) : []), // Nếu friends không phải mảng, trả về mảng rỗng
    ];
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
                                    <div className="chat-messages">
                                        {chatMessages.length > 0 ? (
                                            chatMessages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`chat-message ${msg.senderID === MyUser?.my_user?.id ? "sent" : "received"
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Bắt đầu trò chuyện với {selectedChat.groupName}</p>
                                        )}
                                    </div>
                                    <div className="chat-input-container">
                                        <input
                                            type="text"
                                            className="chat-input"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder={`Nhập tin nhắn tới ${selectedChat.groupName}`}
                                        />
                                        <button onClick={handleSendMessage} className="send-button">
                                            Gửi
                                        </button>
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
                                    <h1>Chào mừng {MyUser?.my_user?.name || "Khách"} đến với Zolo PC!</h1>
                                    <p>
                                        Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân,
                                        bạn bè được tối ưu hóa cho máy tính của bạn.
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                );
            case "contacts":
                return MyUser && MyUser.my_user ? <ContactsTab userId={MyUser.my_user.id} friendRequests={friendRequests} /> : <div>Loading...</div>;
            // return (
            //     <div>
            //         <h3>Danh sách bạn bè</h3>
            //         <ul>
            //             {friends.length > 0 ? (
            //                 friends.map((friend) => (
            //                     <li
            //                         key={friend.id}
            //                         className="contact-item"
            //                         onClick={() => setSelectedChat(friend)}
            //                     >
            //                         <img
            //                             src={friend.avatar || avatar_default}
            //                             alt="Avatar"
            //                             className="avatar"
            //                         />
            //                         <span>{friend.name}</span>
            //                     </li>
            //                 ))
            //             ) : (
            //                 <p>Không có bạn bè nào</p>
            //             )}
            //         </ul>
            //     </div>
            // );
            default:
                return null;
        }
    };


    const handleSearchFriend = async () => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.phoneNumber) return;

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
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !user?.id) return;

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

            // Cập nhật trực tiếp trong state để danh sách luôn mới
            setFriendRequests((prevRequests) => [...prevRequests, message]);

            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Kiểm tra giá trị của MyUser tại đây
    console.log("MyUser:", MyUser ? MyUser : "No user logged in");

    // const logout = (callback) => {
    //     setIsLoggingOut(true); // Hiển thị hiệu ứng logout
    //     setMyUser(null);
    //     localStorage.removeItem('idToken'); // Xóa token để App.js nhận diện đăng xuất
    //     localStorage.removeItem('my_user');
    //     localStorage.removeItem('phoneNumber');
    //     localStorage.removeItem('userAttributes');
    //     localStorage.removeItem('lastLoginTime');

    //     if (callback) {
    //         setTimeout(() => {
    //             setIsLoggingOut(false);
    //             callback(); // Chờ 3 giây trước khi chuyển hướng
    //         }, 3000);
    //     }
    // };

    const handleLogout = () => {
        setIsLoggingOut(true);
        logout(() => {
            navigate('/');
        });
    };

    //Phiên đăng nhập
    const [sessionExpired, setSessionExpired] = useState(false);

    const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 phút
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const handleActivity = () => setLastActivity(Date.now());

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        const intervalId = setInterval(() => {
            if (Date.now() - lastActivity > SESSION_TIMEOUT) {
                // logout();
                // navigate('/main');
                setSessionExpired(true);
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, [lastActivity]);

    const handleSessionExpired = () => {
        setSessionExpired(false);
        logout();
        navigate('/');
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
                                <li className="logout" onClick={handleLogout}>Đăng xuất</li>
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
                                {allMessagesAndFriends.map((item) => (
                                    <MessageItem
                                        key={item.id}
                                        groupName={item.groupName}
                                        unreadCount={item.unreadCount}
                                        img={item.img || "https://via.placeholder.com/40"}
                                        onClick={() => setSelectedChat(item)}
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
                            <div className="d-flex align-items-start w-100">
                                <div className="nav flex-column nav-pills me-3 w-100" id="v-pills-tab" role="tablist" aria-orientation="vertical">
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
                                {!MyUser.my_user.friendIds.includes(user.id) && (
                                    <button onClick={() => setIsFriendRequestModalOpen(true)}>Kết bạn</button>
                                )}
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

            {sessionExpired && (
                <div className="session-expired-overlay">
                    <div className="session-expired-box">
                        <p>Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại !!</p>
                        <button onClick={handleSessionExpired}>OK</button>
                    </div>
                </div>
            )}

            {/* Hiển thị loading spinner khi đang xử lý logout */}
            {isLoggingOut && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p className="loading-text">Đang đăng xuất...</p>
                </div>
            )}
        </div>
    );
};

export default MainPage;
