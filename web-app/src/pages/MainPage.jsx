import React, { useState, useEffect, useRef, useMemo } from "react";
import "./MainPage.css"; // CSS riêng cho giao diện
import UserService from "../services/UserService";
import MessageService from "../services/MessageService";
import flag from "../image/icon_VN.png";
import avatar_default from '../image/avatar_user.jpg';
import { useAuth } from "../context/AuthContext"; // Import custom hook để sử dụng context
import ContactsTab from "./ContactsTab";
import { useWebSocket } from "../context/WebSocket";
import { useNavigate } from 'react-router-dom';
import moment from "moment-timezone";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from "axios";
import S3Service from "../services/S3Service";





//thêm sự kiện onClick để cập nhật state selectedChat trong MainPage.
const MessageItem = ({ groupName, unreadCount, img, onClick, chatMessages = [] }) => (
    <li className="message-item" onClick={onClick}>
        <img src={img} alt="Avatar" className="avatar" />
        <div className="message-info">
            <h4>{groupName}</h4>
            {unreadCount > 0 ? (
                <p>{`Bạn có tin nhắn chưa đọc`}</p>  // Hiển thị số tin nhắn chưa đọc
            ) : (
                chatMessages.length === 0 ? (
                    <p></p>  // Hiển thị nếu không có tin nhắn
                ) : (
                    <p>{chatMessages[chatMessages.length - 1].content}</p>  // Hiển thị tin nhắn cuối
                )
            )}
        </div>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}  {/* Hiển thị số tin nhắn chưa đọc */}
    </li>
);


const UserInfoModal = ({ user, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Trạng thái để hiển thị màn hình cập nhật ảnh
    const [avatar, setAvatar] = useState(user.avatar);
    const [file, setFile] = useState(null);
    const [originalAvatar, setOriginalAvatar] = useState(user.avatar);
    const [name, setName] = useState(user.name);
    const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : "2003-12-02");

    // Kiểm tra dữ liệu có thay đổi không
    const isChanged = useMemo(() => name !== user.name || dob !== (user.dob ? new Date(user.dob).toISOString().split('T')[0] : "2003-12-02"), [name, dob, user]);

    const handleUpdateInfo = async () => {
        try {
            await UserService.updateUserInfo(user.id, { name, dob });
            // Cập nhật lại thông tin người dùng trong state
            user.name = name;
            user.dob = dob;
            alert("Cập nhật thông tin thành công!");
            onClose();
        } catch (error) {
            alert("Cập nhật thất bại! " + error.message);
        }
    };

    const startUploading = () => {
        setOriginalAvatar(avatar);  // Lưu lại avatar gốc
        setIsUploading(true);
    };

    const cancelUpload = () => {
        setAvatar(originalAvatar);  // Phục hồi avatar gốc
        setFile(null);  // Xóa file đã chọn
        setIsUploading(false);
    };


    // Xử lý khi chọn ảnh mới
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if (selectedFile) {
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                alert("Chỉ chấp nhận file (.jpg, .jpeg, .png)");
                return;
            }
            setFile(selectedFile);
            setAvatar(URL.createObjectURL(selectedFile)); // Hiển thị ảnh mới
        }
    };


    // Upload file lên server
    const uploadAvatar = async () => {
        if (!file) return;

        try {
            const url = await S3Service.uploadAvatar(file);
            setAvatar(url);
            // setUser((prev) => ({ ...prev, avatar: url })); // Nếu có state user
            setIsUploading(false);
            alert("Cập nhật avatar thành công!");
        } catch (error) {
            alert("Upload thất bại!");
        }
    };

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            {isUploading ? "Cập nhật ảnh đại diện" : isEditing ? "Cập nhật thông tin cá nhân" : "Thông tin tài khoản"}
                        </h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>

                    {/* Nếu đang tải ảnh lên */}
                    {isUploading ? (
                        <div className="modal-body text-center">
                            <label className="btn btn-light d-flex align-items-center mx-auto" style={{ border: "1px solid #ddd", cursor: "pointer" }}>
                                <i className="fas fa-upload me-2"></i> Tải lên từ máy tính
                                <input type="file" className="d-none" accept=".jpg, .jpeg, .png" onChange={handleFileChange} />
                            </label>
                            <h6 className="mt-3">Ảnh đại diện của tôi</h6>
                            <div className="mb-3 d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
                                <img src={avatar} alt="Avatar" className="rounded-circle mt-2" style={{ width: "80px", height: "100px" }} />
                            </div>
                            <p className="text-muted">Bạn chưa cập nhật ảnh đại diện nào</p>
                        </div>
                    ) : (
                        <>
                            {/* Profile Image & Name */}
                            {!isEditing && (
                                <div className="d-flex align-items-center p-3 border-bottom">
                                    <div className="position-relative" style={{ width: "60px", height: "60px" }}>
                                        {avatar && avatar !== "" ? (
                                            <img src={avatar} alt="Avatar" className="rounded-circle shadow-sm" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                                        ) : (
                                            <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center" style={{ width: "60px", height: "60px", fontSize: "24px" }}>
                                                {user.name?.split(" ").map(word => word[0]).join("")}
                                            </div>
                                        )}

                                        <label
                                            className="position-absolute bottom-0 end-0 bg-light rounded-circle shadow-sm d-flex justify-content-center align-items-center"
                                            style={{ width: "24px", height: "24px", cursor: "pointer" }}
                                            onClick={() => setIsUploading(true)}
                                        >
                                            <i className="fas fa-camera" style={{ fontSize: "12px" }}></i>
                                        </label>
                                    </div>

                                    {/* Tên */}
                                    <p className="ms-3 fw-bold mb-0">
                                        {user.name}
                                        <i className="fas fa-pencil-alt ms-2" style={{ cursor: "pointer" }} onClick={() => setIsEditing(true)}></i>
                                    </p>
                                </div>
                            )}


                            {/* Body */}
                            <div className="modal-body">
                                {isEditing ? (
                                    // Giao diện chỉnh sửa
                                    <div>
                                        <div className="mb-3">
                                            <h6 className="form-label">Tên hiển thị</h6>
                                            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div className="mb-3 mt-4">
                                            <h5 className="form-label fw-bold">Thông tin cá nhân</h5>
                                            <div className="d-flex align-items-center">
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        value="Nam"
                                                        checked={"Nam"}
                                                        className="form-check-input"
                                                    />
                                                    <label className="form-check-label ms-2">Nam</label>
                                                </div>
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        value="Nữ"
                                                        checked={""}
                                                        className="form-check-input"
                                                    />
                                                    <label className="form-check-label ms-2">Nữ</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <h6 className="form-label">Ngày sinh</h6>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Giao diện xem thông tin
                                    <div>
                                        <p><strong>Giới tính:</strong> {user.sex}</p>
                                        <p><strong>Ngày sinh:</strong> {user.dob}</p>
                                        <p><strong>Điện thoại:</strong> {user.phoneNumber}</p>
                                        <p className="text-muted small">Chỉ bạn bè có lưu số của bạn trong danh bạ mới xem được số này</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="modal-footer">
                        {isUploading ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={cancelUpload}>Hủy</button>
                                <button type="button" className="btn btn-primary" onClick={uploadAvatar}>Cập nhật ảnh</button>
                            </>
                        ) : isEditing ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Hủy</button>
                                <button type="button" className="btn btn-primary" disabled={!isChanged} onClick={handleUpdateInfo}>Cập nhật</button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)} >Cập nhật</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// Component chính
const MainPage = () => {
    const navigate = useNavigate();
    const [isUserInfoVisible, setIsUserInfoVisible] = useState(false);

    const handleUserInfoToggle = () => {
        setIsUserInfoVisible(true);
    };

    const handleCloseModal = () => {
        setIsUserInfoVisible(false);
    };

    const { MyUser, setMyUser, logout } = useAuth();
    const { sendMessage, onMessage } = useWebSocket(); // Lấy hàm gửi tin nhắn từ context
    const [activeTab, setActiveTab] = useState("chat"); // State quản lý tab
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    //chọn component MessageItem
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState(""); // Nội dung tin nhắn nhập vào
    const [chatMessages, setChatMessages] = useState([]); // Danh sách tin nhắn của chat

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]); // Danh sách tin nhắn chưa đọc

    //set trang thái online/offline ------------- ở đây
    const handleSelectChat = async (user) => {
        try {
            // 🔥 1. Gọi API kiểm tra trạng thái online của user
            const updatedUser = await UserService.getUserStatus(user.id);

            // 🔥 2. Gọi API lấy tin nhắn chưa đọc
            const unreadMsgs = await MessageService.getUnreadMessagesCountForAllFriends(MyUser.my_user.id, user.id);

            // 🔥 3. Nếu có tin nhắn chưa đọc => Đánh dấu là đã đọc
            if (unreadMsgs.length > 0) {
                await MessageService.savereadMessages(MyUser.my_user.id, user.id);
            }

            // 🔥 4. Cập nhật state
            setSelectedChat({
                ...user,
                isOnline: updatedUser.isOnline, // Cập nhật trạng thái online từ backend
            });

            setUnreadMessages([]); // Đánh dấu tất cả tin nhắn là đã đọc

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu user hoặc tin nhắn:", error);

            // Nếu có lỗi, vẫn cập nhật user nhưng mặc định là offline
            setSelectedChat({
                ...user,
                isOnline: false,
            });

            setUnreadMessages([]); // Nếu lỗi, reset danh sách tin nhắn chưa đọc
        }
    };


    // State để lưu số lượng tin nhắn chưa đọc cho từng bạn
    const [unreadMessagesCounts, setUnreadMessagesCounts] = useState([]);
    const [friends, setFriends] = useState([]); // Danh sách bạn bè
    // Hàm lấy số lượng tin nhắn chưa đọc cho từng bạn
    const getUnreadMessagesForFriends = async (friends) => {
        const unreadCounts = await Promise.all(
            friends.map(async (friend) => {
                const unreadCount = await MessageService.getSLUnreadMessages(MyUser.my_user.id, friend.id);
                return { friendId: friend.id, unreadCount }; // Trả về đối tượng với friendId và unreadCount
            })
        );
        return unreadCounts; // Trả về danh sách các tin nhắn chưa đọc cho từng bạn
    };
    // useEffect để lấy số lượng tin nhắn chưa đọc cho tất cả bạn bè
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id) return;

        const fetchUnreadMessagesCountForAllFriends = async () => {
            const unreadCounts = await MessageService.getUnreadMessagesCountForAllFriends(MyUser.my_user.id);
            setUnreadMessagesCounts(unreadCounts); // Lưu số lượng tin nhắn chưa đọc vào state
        };

        fetchUnreadMessagesCountForAllFriends();
    }, [MyUser]);





    // useEffect(() => {
    //     const unsubscribe = onMessage((message) => {
    //         if (message.type === "USER_STATUS_UPDATE") {
    //             setFriends((prevFriends) =>
    //                 prevFriends.map((friend) =>
    //                     friend.id === message.userId ? { ...friend, isOnline: message.isOnline } : friend
    //                 )
    //             );

    //             if (selectedChat && selectedChat.id === message.userId) {
    //                 setSelectedChat((prevChat) => ({
    //                     ...prevChat,
    //                     isOnline: message.isOnline,
    //                 }));
    //             }
    //         }
    //     });

    //     return () => {
    //         unsubscribe(); // Hủy lắng nghe khi unmount
    //     };
    // }, [selectedChat, onMessage]);





    // useEffect để tải tin nhắn khi chọn cuộc trò chuyện
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !selectedChat?.id) return;

        // Lấy tất cả tin nhắn giữa người gửi và người nhận
        MessageService.get(`/messages?senderID=${MyUser.my_user.id}&receiverID=${selectedChat.id}`)
            .then((data) => {
                // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
                const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));

                // Lọc các tin nhắn chưa đọc
                const unreadMessages = sortedMessages.filter((msg) => msg.isRead === false);

                // Nếu có tin nhắn chưa đọc, gọi API để đánh dấu là đã đọc
                if (unreadMessages.length > 0) {
                    // Gửi yêu cầu PUT để đánh dấu tin nhắn là đã đọc
                    MessageService.savereadMessages(MyUser.my_user.id, selectedChat.id)
                        .then(() => {
                            // Sau khi đánh dấu là đã đọc, cập nhật lại các tin nhắn đã được đọc
                            const updatedMessages = sortedMessages.map((msg) =>
                                msg.isRead === false ? { ...msg, isRead: true } : msg
                            );
                            setChatMessages(updatedMessages); // Cập nhật lại state tin nhắn ngay lập tức

                            // Cập nhật số lượng tin nhắn chưa đọc cho bạn bè
                            const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                                if (count.friendId === selectedChat.id) {
                                    return { ...count, unreadCount: 0 };
                                }
                                return count;
                            });
                            setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật số lượng tin nhắn chưa đọc
                        })
                        .catch((error) => {
                            console.error("Lỗi khi đánh dấu tin nhắn là đã đọc", error);
                        });
                } else {
                    // Nếu không có tin nhắn chưa đọc, chỉ cần cập nhật lại danh sách tin nhắn
                    setChatMessages(sortedMessages);
                }
            })
            .catch((err) => {
                console.error("Error fetching messages:", err);
            });
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


    // Lắng nghe tin nhắn mới từ WebSocketload tin nhắn realtime
    useEffect(() => {
        const unsubscribe = onMessage((incomingMessage) => {
            if (incomingMessage.senderID === selectedChat?.id || incomingMessage.receiverID === selectedChat?.id) {
                // Cập nhật tin nhắn mới vào chatMessages
                setChatMessages((prevMessages) =>
                    [...prevMessages, incomingMessage].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate))
                );
            }

            // Cập nhật số lượng tin nhắn chưa đọc cho các bạn bè
            const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                if (count.friendId === incomingMessage.senderID) {
                    return {
                        ...count,
                        unreadCount: count.unreadCount + 1, // Thêm 1 cho số tin nhắn chưa đọc
                    };
                }
                return count;
            });
            setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật lại số lượng tin nhắn chưa đọc
        });

        return () => {
            unsubscribe(); // Hủy lắng nghe khi component unmount
        };
    }, [selectedChat, unreadMessagesCounts, onMessage]);



    //cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        const chatContainer = document.querySelector(".chat-messages");
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [chatMessages]);




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
            sendDate: moment().tz('Asia/Ho_Chi_Minh').toISOString(),
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
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [emojiBtnPosition, setEmojiBtnPosition] = useState({});
    const modalRef = useRef(null);
    const userInfoModalRef = useRef(null);
    const isSettingsOpenRef = useRef(null);
    const emojiPickerVisibleRef = useRef(null);

    const [loading, setLoading] = useState(false); // Loading state

    const [friendRequests, setFriendRequests] = useState([]);

    // Xử lý gửi tin nhắn kết bạn
    const [isFriendRequestModalOpen, setIsFriendRequestModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState(`Xin chào, mình là ${MyUser?.my_user?.name}. Mình biết bạn qua số điện thoại. Kết bạn với mình nhé!`);
    const [isRequestSent, setIsRequestSent] = useState(false);
    //Tích hợp danh sách bạn bè vào danh sách tin nhắn
    const allMessagesAndFriends = [
        ...messages,
        ...(Array.isArray(friends) ? friends.map((friend) => {
            const unreadCount = unreadMessagesCounts.find(u => u.friendId === friend.id)?.unreadCount || 0;
            return {
                id: friend.id,
                groupName: friend.name,
                unreadCount: unreadCount,  // Đảm bảo tính toán số tin nhắn chưa đọc
                img: friend.avatar,
            };
        }) : []),
    ];


    const handleEmojiClick = (emoji) => {
        setMessageInput(messageInput + emoji); // Thêm emoji vào tin nhắn
        setEmojiPickerVisible(false); // Ẩn bảng cảm xúc sau khi chọn
    };

    const toggleEmojiPicker = (e) => {
        // Định vị vị trí của biểu tượng cảm xúc
        const buttonRect = e.target.getBoundingClientRect();
        setEmojiBtnPosition({
            top: buttonRect.top,
            left: buttonRect.left,
        });
        setEmojiPickerVisible(!emojiPickerVisible);
    };

    // Hàm render nội dung theo tab
    const renderContent = () => {
        switch (activeTab) {
            case "chat":
                return (
                    <div style={{ position: "relative", bottom: "15px" }}>
                        {selectedChat ? (
                            <>
                                <header className="content-header">
                                    <div className="profile">
                                        <img src={selectedChat.img} alt="Avatar" className="avatar" />
                                        <span className="username">{selectedChat.groupName}</span>
                                        <span className="user-status">
                                            {selectedChat.isOnline ? (
                                                <span className="status-dot online"></span>
                                            ) : (
                                                <span className="status-dot offline"></span>
                                            )}
                                            {selectedChat.isOnline ? " Đang hoạt động" : " Không hoạt động"}
                                        </span>
                                    </div>
                                </header>
                                <section className="chat-section">
                                    <div className="chat-messages">
                                        {chatMessages.length > 0 ? (
                                            chatMessages.map((msg, index) => {
                                                const isSentByMe = msg.senderID === MyUser?.my_user?.id;
                                                const isLastMessageByMe = isSentByMe && index === chatMessages.length - 1;

                                                // 📌 Lấy thời gian gửi tin nhắn và chuyển đổi sang múi giờ Việt Nam
                                                const messageTime = moment(msg.sendDate).tz('Asia/Ho_Chi_Minh').format("HH:mm");
                                                const messageDate = moment(msg.sendDate).tz('Asia/Ho_Chi_Minh').format("DD/MM/YYYY");

                                                // 📌 Lấy ngày của tin nhắn trước đó
                                                const prevMessage = chatMessages[index - 1];
                                                const prevMessageDate = prevMessage ? moment(prevMessage.sendDate).tz('Asia/Ho_Chi_Minh').format("DD/MM/YYYY") : null;

                                                // 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày trước đó
                                                const shouldShowDate = index === 0 || prevMessageDate !== messageDate;

                                                return (
                                                    <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                                                        {/* 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày */}
                                                        {shouldShowDate && (
                                                            <div className="message-date-center">
                                                                {moment(msg.sendDate).tz('Asia/Ho_Chi_Minh').calendar(null, {
                                                                    sameDay: "[Hôm nay]",
                                                                    lastDay: "[Hôm qua]",
                                                                    lastWeek: "[Tuần trước]",
                                                                    sameElse: "DD/MM/YYYY"
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
                                                            <p>{msg.content}</p>

                                                            {/* 📌 Hiển thị thời gian bên dưới tin nhắn */}
                                                            <span className="message-time">{messageTime}</span>

                                                            {/* 📌 Nếu là tin nhắn cuối cùng bạn gửi và đã đọc => hiển thị "✔✔ Đã nhận" */}
                                                            {isLastMessageByMe && msg.isRead && (
                                                                <span className="message-status read-status">✔✔ Đã nhận</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p>Bắt đầu trò chuyện với {selectedChat?.groupName}</p>
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
                                            <button title="Sticker" onClick={toggleEmojiPicker}>
                                                <span>😊</span>
                                            </button>
                                            <button title="Image">
                                                <span>🖼️</span>
                                            </button>
                                            <button title="Attachment">
                                                <span>📎</span>
                                            </button>
                                            <button title="Capture">
                                                <span>🔉</span>
                                            </button>
                                            <button title="Thumbs Up">
                                                <span>🎙️</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Emoji Picker */}
                                    {emojiPickerVisible && (
                                        <div
                                            className="emoji-picker visible"
                                            style={{ top: emojiBtnPosition.top + 50, left: emojiBtnPosition.left }}
                                            ref={emojiPickerVisibleRef}
                                        >
                                            <span onClick={() => handleEmojiClick('😊')}>😊</span>
                                            <span onClick={() => handleEmojiClick('😂')}>😂</span>
                                            <span onClick={() => handleEmojiClick('😍')}>😍</span>
                                            <span onClick={() => handleEmojiClick('😎')}>😎</span>
                                            <span onClick={() => handleEmojiClick('🥺')}>🥺</span>
                                            <span onClick={() => handleEmojiClick('🥰')}>🥰</span>
                                            <span onClick={() => handleEmojiClick('🤩')}>🤩</span>
                                            <span onClick={() => handleEmojiClick('🤗')}>🤗</span>
                                            <span onClick={() => handleEmojiClick('🤔')}>🤔</span>
                                            <span onClick={() => handleEmojiClick('🤭')}>🤭</span>
                                            <span onClick={() => handleEmojiClick('🤫')}>🤫</span>
                                            <span onClick={() => handleEmojiClick('🤥')}>🤥</span>
                                            <span onClick={() => handleEmojiClick('🤐')}>🤐</span>
                                            <span onClick={() => handleEmojiClick('🤨')}>🤨</span>
                                            <span onClick={() => handleEmojiClick('🤓')}>🤓</span>
                                            <span onClick={() => handleEmojiClick('🧐')}>🧐</span>
                                            <span onClick={() => handleEmojiClick('🤠')}>🤠</span>
                                            <span onClick={() => handleEmojiClick('🤡')}>🤡</span>
                                            <span onClick={() => handleEmojiClick('🤢')}>🤢</span>
                                            <span onClick={() => handleEmojiClick('🤧')}>🤧</span>
                                            <span onClick={() => handleEmojiClick('🤮')}>🤮</span>
                                            <span onClick={() => handleEmojiClick('🤥')}>🤥</span>
                                            <span onClick={() => handleEmojiClick('🤬')}>🤬</span>
                                            <span onClick={() => handleEmojiClick('🤯')}>🤯</span>
                                            <span onClick={() => handleEmojiClick('🤠')}>🤠</span>
                                            <span onClick={() => handleEmojiClick('😈')}>😈</span>
                                            <span onClick={() => handleEmojiClick('💀')}>💀</span>
                                            <span onClick={() => handleEmojiClick('☠️')}>☠️</span>
                                            <span onClick={() => handleEmojiClick('👻')}>👻</span>
                                            <span onClick={() => handleEmojiClick('👽')}>👽</span>
                                            <span onClick={() => handleEmojiClick('🙀')}>🙀</span>
                                            <span onClick={() => handleEmojiClick('😸')}>😸</span>
                                            <span onClick={() => handleEmojiClick('🤖')}>🤖</span>
                                            <span onClick={() => handleEmojiClick('🙈')}>🙈</span>
                                            <span onClick={() => handleEmojiClick('💩')}>💩</span>

                                            <span onClick={() => handleEmojiClick('👍')}>👍</span>


                                        </div>
                                    )}
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
    //console.log("MyUser:", MyUser ? MyUser : "No user logged in");

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
                        <div className="settings-menu" ref={isSettingsOpenRef}>
                            <ul>
                                <li className="cat-dat" onClick={handleUserInfoToggle}>
                                    Thông tin tài khoản
                                </li>
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
            {isUserInfoVisible && (
                <UserInfoModal user={MyUser.my_user} onClose={handleCloseModal} />
            )}

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
                    <div className="modal-content" ref={modalRef}>
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
                    <div className="modal-content user-info-modal" ref={userInfoModalRef}>
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
