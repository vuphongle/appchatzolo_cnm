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
import moment from "moment";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from "axios";
import UserInfoModal from "./UserInfoModal";


import S3Service from "../services/S3Service";
import { se } from "date-fns/locale";

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
            const unreadMsgs = await MessageService.getUnreadMessages(MyUser.my_user.id, user.id);

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






    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === "USER_STATUS_UPDATE") {
                setFriends((prevFriends) =>
                    prevFriends.map((friend) =>
                        friend.id === message.userId ? { ...friend, isOnline: message.isOnline } : friend
                    )
                );

                if (selectedChat && selectedChat.id === message.userId) {
                    setSelectedChat((prevChat) => ({
                        ...prevChat,
                        isOnline: message.isOnline,
                    }));
                }
            }
        });

        return () => {
            unsubscribe(); // Hủy lắng nghe khi unmount
        };
    }, [selectedChat, onMessage]);

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
    const handleSendMessage = async () => {
        if (messageInput.trim() === "" && selectedFiles.length === 0 && selectedImages.length === 0) return; // Nếu không có nội dung và không có file

        // Xử lý ảnh đã chọn
        if (selectedImages.length > 0) {
            try {
                const uploadedImages = [];
                // Tải lên tất cả các ảnh
                for (let file of selectedImages) {
                    const fileUrl = await S3Service.uploadImage(file); // Tải ảnh lên S3
                    uploadedImages.push(fileUrl);
                }

                // Gửi tin nhắn cho mỗi ảnh
                for (let url of uploadedImages) {
                    const message = {
                        id: new Date().getTime().toString(),
                        senderID: MyUser.my_user.id,
                        receiverID: selectedChat.id,
                        content: url, // Nội dung là URL của ảnh đã tải lên
                        sendDate: new Date().toISOString(),
                        isRead: false,
                    };

                    // Gửi tin nhắn qua WebSocket hoặc API của bạn
                    sendMessage(message);

                    // Cập nhật tin nhắn vào danh sách chat
                    setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
                }
                setSelectedImages([]); // Reset images
            } catch (error) {
                console.error("Upload image failed", error);
                return;
            }
        }

        // Xử lý các tệp đã chọn
        if (selectedFiles.length > 0) {
            try {
                const uploadedFiles = [];
                // Tải lên tất cả các tệp
                for (let file of selectedFiles) {
                    const fileUrl = await S3Service.uploadFile(file); // Tải tệp lên S3
                    uploadedFiles.push(fileUrl);
                }

                // Gửi tin nhắn cho mỗi tệp
                for (let url of uploadedFiles) {
                    const message = {
                        id: new Date().getTime().toString(),
                        senderID: MyUser.my_user.id,
                        receiverID: selectedChat.id,
                        content: url, // Nội dung là URL của tệp đã tải lên
                        sendDate: new Date().toISOString(),
                        isRead: false,
                    };

                    // Gửi tin nhắn qua WebSocket hoặc API của bạn
                    sendMessage(message);

                    // Cập nhật tin nhắn vào danh sách chat
                    setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));

                }
                setSelectedFiles([]);
            } catch (error) {
                console.error("Upload file failed", error);
                return;
            }
        }

        //Xử lý tin nhắn văn bản nếu có
        if (messageInput.trim()) {
            //Loại bỏ tên file nếu có trong tin nhắn
            const textMessage = messageInput.replace(/(?:https?|ftp):\/\/[\n\S]+|(\S+\.\w{3,4})/g, "").trim();

            if (textMessage === "") {
                setMessageInput("");
                return
            }; // Nếu tin nhắn chỉ chứa URL hoặc tên file

            const message = {
                id: new Date().getTime().toString(),
                senderID: MyUser.my_user.id,
                receiverID: selectedChat.id,
                content: textMessage, // Nội dung tin nhắn là văn bản
                sendDate: new Date().toISOString(),
                isRead: false,
            };

            // Gửi tin nhắn qua WebSocket hoặc API của bạn
            sendMessage(message);

            // Cập nhật tin nhắn vào danh sách chat
            setChatMessages((prev) => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }

        // Reset lại danh sách file và nội dung tin nhắn
        setMessageInput(""); // Xóa ô input
        setSelectedFiles([]); // Reset images
        setSelectedImages([]); // Reset images
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
        ...(Array.isArray(friends) ? friends.map((friend) => ({
            id: friend.id,
            groupName: friend.name,
            unreadCount: 0,
            img: friend.avatar,
        })) : []), // Nếu friends không phải mảng, trả về mảng rỗng
    ];

    const handleEmojiClick = (emoji) => {
        setMessageInput(messageInput + emoji); // Thêm emoji vào tin nhắn
        setEmojiPickerVisible(false); // Ẩn bảng cảm xúc sau khi chọn
    };

    const toggleEmojiPicker = (e) => {
        // Định vị vị trí của biểu tượng cảm xúc
        const buttonRect = e.target.getBoundingClientRect();
        setEmojiBtnPosition({
            top: buttonRect.top + 50,
            left: buttonRect.left - 200,
        });
        setEmojiPickerVisible(!emojiPickerVisible);
    };

    // const handleImageUpload = (event) => {
    //     const file = event.target.files[0];
    //     if (!file) return;
    //     setMessageInput(messageInput + file.name); // Thêm URL ảnh vào tin nhắn
    // };

    // const handleFileChange = (event) => {
    //     const file = event.target.files[0]; // Lấy file người dùng chọn
    //     if (!file) return;
    //     setMessageInput(messageInput + file.name); // Thêm URL ảnh vào tin nhắn

    // };

    const [selectedImages, setSelectedImages] = useState([]); // Lưu trữ các file đã chọn
    const [selectedFiles, setSelectedFiles] = useState([]); // Lưu trữ các file đã chọn

    // Hàm xử lý khi chọn ảnh
    const handleImageUpload = (event) => {
        const file = event.target.files[0]; // Chỉ lấy 1 file mỗi lần
        if (file) {
            setMessageInput(messageInput + " " + file.name); // Thêm URL ảnh vào tin nhắn
            setSelectedImages((prevFiles) => [...prevFiles, file]); // Thêm file vào danh sách
        }
    };

    // Hàm xử lý khi chọn file
    const handleFileUpload = (event) => {
        const file = event.target.files[0]; // Chỉ lấy 1 file mỗi lần
        if (file) {
            setMessageInput(messageInput + " " + file.name); // Thêm URL ảnh vào tin nhắn
            setSelectedFiles((prevFiles) => [...prevFiles, file]); // Thêm file vào danh sách
        }
    };

    // Hàm render nội dung theo tab
    const renderContent = () => {
        switch (activeTab) {
            case "chat":
                return (
                    <div style={{ position: "relative", bottom: "0px" }}>
                        {selectedChat ? (
                            <>
                                <header className="content-header">
                                    <div className="profile">
                                        <img src={selectedChat.img || avatar_default} alt="Avatar" className="avatar" />
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

                                                // 📌 Lấy thời gian gửi tin nhắn
                                                const messageTime = moment(msg.sendDate).format("HH:mm");
                                                const messageDate = moment(msg.sendDate).format("DD/MM/YYYY");

                                                // 📌 Lấy ngày của tin nhắn trước đó
                                                const prevMessage = chatMessages[index - 1];
                                                const prevMessageDate = prevMessage ? moment(prevMessage.sendDate).format("DD/MM/YYYY") : null;

                                                // 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày trước đó
                                                const shouldShowDate = index === 0 || prevMessageDate !== messageDate;

                                                // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
                                                const isImageMessage = (url) => url.match(/\.(jpeg|jpg|gif|png)$/) != null;

                                                return (
                                                    <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                                                        {/* 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày trước đó */}
                                                        {shouldShowDate && (
                                                            <div className="message-date-center">
                                                                {moment(msg.sendDate).calendar(null, {
                                                                    sameDay: "[Hôm nay]",
                                                                    lastDay: "[Hôm qua]",
                                                                    lastWeek: "[Tuần trước]",
                                                                    sameElse: "DD/MM/YYYY"
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
                                                            {/* Kiểm tra xem có phải là ảnh không và hiển thị ảnh nếu đúng */}
                                                            {isImageMessage(msg.content) ? (
                                                                <img src={msg.content} alt="Image" className="message-image" />
                                                            ) : (
                                                                <p>{msg.content}</p>
                                                            )}

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
                                        <div className="chat-icons">
                                            <button
                                                title="Image"
                                                onClick={() => document.getElementById('image-input').click()} // Kích hoạt input khi nhấn vào button
                                            >
                                                {/* Ẩn input nhưng vẫn giữ nó kích hoạt khi nhấn vào */}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload} // Gọi hàm handleImageUpload khi có thay đổi
                                                    style={{ display: 'none' }} // Ẩn input khỏi giao diện
                                                    id="image-input"
                                                />
                                                <span>
                                                    <i className="fas fa-image" style={{ fontSize: "24px", color: '#47546c' }}></i> {/* Biểu tượng hình ảnh từ Font Awesome */}
                                                    {/* #1675ff */}
                                                </span>
                                            </button>
                                            <button
                                                title="Attachment"
                                                onClick={() => document.getElementById('file-input').click()} // Kích hoạt input khi nhấn vào button
                                            >
                                                {/* Ẩn input nhưng vẫn giữ nó kích hoạt khi nhấn vào */}
                                                <input
                                                    type="file"
                                                    accept="file/*" // Cho phép chọn tất cả các loại file (có thể thay đổi nếu cần)
                                                    onChange={handleFileUpload} // Gọi hàm handleFileChange khi có thay đổi
                                                    style={{ display: 'none' }} // Ẩn input khỏi giao diện
                                                    id="file-input"
                                                />
                                                <span>
                                                    <i className="fas fa-paperclip" style={{ fontSize: "24px", color: '#47546c' }}></i> {/* Biểu tượng đính kèm từ Font Awesome */}
                                                </span>
                                            </button>
                                            <button title="Record">
                                                <span><i className="fas fa-microphone" style={{ fontSize: "24px", color: '#47546c' }}></i></span>
                                            </button>
                                            <button title="Thumbs Up">
                                                <span><i className="fas fa-volume-up" style={{ fontSize: "24px", color: '#47546c' }}></i></span>
                                            </button>
                                        </div>
                                        <div className="input-container">
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
                                            <button
                                                className="icon-button"
                                                onClick={toggleEmojiPicker}
                                            >
                                                <i className="fas fa-smile" style={{ color: 'gray', fontSize: '20px' }}></i>
                                            </button>
                                        </div>
                                        <button onClick={handleSendMessage} className="send-button">
                                            Gửi
                                        </button>
                                    </div>

                                    {/* Emoji Picker */}
                                    {emojiPickerVisible && (
                                        <div
                                            className="emoji-picker visible"
                                            style={{ top: emojiBtnPosition.top - 400, left: emojiBtnPosition.left - 415 }}
                                        // ref={emojiPickerVisibleRef}
                                        >
                                            <h6 style={{ width: "300px", height: "15px", marginTop: "10px", marginBottom: "0px" }}>Cảm xúc</h6>
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

                                            <h6 style={{ width: "300px", height: "15px", marginTop: "10px", marginBottom: "0px" }}>Cử chỉ</h6>
                                            <span onClick={() => handleEmojiClick('👍')}>👍</span>
                                            <span onClick={() => handleEmojiClick('🤚')}>🤚</span>
                                            <span onClick={() => handleEmojiClick('👌')}>👌</span>
                                            <span onClick={() => handleEmojiClick('🤌')}>🤌</span>
                                            <span onClick={() => handleEmojiClick('✌️')}>✌️</span>
                                            <span onClick={() => handleEmojiClick('🤟')}>🤟</span>
                                            <span onClick={() => handleEmojiClick('🤙')}>🤙</span>
                                            <span onClick={() => handleEmojiClick('🫵')}>🫵</span>
                                            <span onClick={() => handleEmojiClick('👈')}>👈</span>
                                            <span onClick={() => handleEmojiClick('👉')}>👉</span>
                                            <span onClick={() => handleEmojiClick('👀')}>👀</span>
                                            <span onClick={() => handleEmojiClick('👅')}>👅</span>
                                            <span onClick={() => handleEmojiClick('👎')}>👎</span>
                                            <span onClick={() => handleEmojiClick('👏')}>👏</span>

                                            <h6 style={{ width: "300px", height: "15px", marginTop: "10px", marginBottom: "0px" }}>Động vật và tự nhiên</h6>
                                            <span onClick={() => handleEmojiClick('🐶')}>🐶</span>
                                            <span onClick={() => handleEmojiClick('🐭')}>🐭</span>
                                            <span onClick={() => handleEmojiClick('🐹')}>🐹</span>
                                            <span onClick={() => handleEmojiClick('🐰')}>🐰</span>
                                            <span onClick={() => handleEmojiClick('🦊')}>🦊</span>
                                            <span onClick={() => handleEmojiClick('🐻')}>🐻</span>
                                            <span onClick={() => handleEmojiClick('🐼')}>🐼</span>
                                            <span onClick={() => handleEmojiClick('🐨')}>🐨</span>
                                            <span onClick={() => handleEmojiClick('🐯')}>🐯</span>
                                            <span onClick={() => handleEmojiClick('🦁')}>🦁</span>
                                            <span onClick={() => handleEmojiClick('🐮')}>🐮</span>
                                            <span onClick={() => handleEmojiClick('🐷')}>🐷</span>
                                            <span onClick={() => handleEmojiClick('🐽')}>🐽</span>
                                            <span onClick={() => handleEmojiClick('🐞')}>🐞</span>
                                            <span onClick={() => handleEmojiClick('🪰')}>🪰</span>
                                            <span onClick={() => handleEmojiClick('🦋')}>🦋</span>
                                            <span onClick={() => handleEmojiClick('🐢')}>🐢</span>
                                            <span onClick={() => handleEmojiClick('🐍')}>🐍</span>
                                            <span onClick={() => handleEmojiClick('🦕')}>🦕</span>
                                            <span onClick={() => handleEmojiClick('🦞')}>🦞</span>
                                            <span onClick={() => handleEmojiClick('🦀')}>🦀</span>
                                            <span onClick={() => handleEmojiClick('🪼')}>🪼</span>
                                            <span onClick={() => handleEmojiClick('🐋')}>🐋</span>
                                            <span onClick={() => handleEmojiClick('🦍')}>🦍</span>
                                            <span onClick={() => handleEmojiClick('🐓')}>🐓</span>
                                            <span onClick={() => handleEmojiClick('🦢')}>🦢</span>
                                            <span onClick={() => handleEmojiClick('🦜')}>🦜</span>
                                            <span onClick={() => handleEmojiClick('🐀')}>🐀</span>
                                            <span onClick={() => handleEmojiClick('🦔')}>🦔</span>
                                            <span onClick={() => handleEmojiClick('🐘')}>🐘</span>
                                            <span onClick={() => handleEmojiClick('🐎')}>🐎</span>
                                            <span onClick={() => handleEmojiClick('🦨')}>🦨</span>
                                            <span onClick={() => handleEmojiClick('🐇')}>🐇</span>
                                            <span onClick={() => handleEmojiClick('🫎')}>🫎</span>
                                            <span onClick={() => handleEmojiClick('🐃')}>🐃</span>
                                            <span onClick={() => handleEmojiClick('🌱')}>🌱</span>
                                            <span onClick={() => handleEmojiClick('🪨')}>🪨</span>
                                            <span onClick={() => handleEmojiClick('🍁')}>🍁</span>
                                            <span onClick={() => handleEmojiClick('🍄')}>🍄</span>
                                            <span onClick={() => handleEmojiClick('🌺')}>🌺</span>
                                            <span onClick={() => handleEmojiClick('🌻')}>🌻</span>
                                            <span onClick={() => handleEmojiClick('🌞')}>🌞</span>
                                            <span onClick={() => handleEmojiClick('🌓')}>🌓</span>
                                            <span onClick={() => handleEmojiClick('🌙')}>🌙</span>
                                            <span onClick={() => handleEmojiClick('🌏')}>🌏</span>
                                            <span onClick={() => handleEmojiClick('🌟')}>🌟</span>
                                            <span onClick={() => handleEmojiClick('✨')}>✨</span>
                                            <span onClick={() => handleEmojiClick('🐾')}>🐾</span>
                                            <span onClick={() => handleEmojiClick('⛄️')}>⛄️</span>
                                            <span onClick={() => handleEmojiClick('🍅')}>🍅</span>
                                            <span onClick={() => handleEmojiClick('🍆')}>🍆</span>
                                            <span onClick={() => handleEmojiClick('🥑')}>🥑</span>
                                            <span onClick={() => handleEmojiClick('🫛')}>🫛</span>
                                            <span onClick={() => handleEmojiClick('🧄')}>🧄</span>
                                            <span onClick={() => handleEmojiClick('🫚')}>🫚</span>
                                            <span onClick={() => handleEmojiClick('🍰')}>🍰</span>
                                            <span onClick={() => handleEmojiClick('🍿')}>🍿</span>
                                            <span onClick={() => handleEmojiClick('🍭')}>🍭</span>
                                            <span onClick={() => handleEmojiClick('🍩')}>🍩</span>
                                            <span onClick={() => handleEmojiClick('🍺')}>🍺</span>
                                            <span onClick={() => handleEmojiClick('🍸')}>🍸</span>
                                            <span onClick={() => handleEmojiClick('🍼')}>🍼</span>
                                            <span onClick={() => handleEmojiClick('🍶')}>🍶</span>

                                            <h6 style={{ width: "300px", height: "15px", marginTop: "10px", marginBottom: "0px" }}>Hoạt động</h6>
                                            <span onClick={() => handleEmojiClick('⚽️')}>⚽️</span>
                                            <span onClick={() => handleEmojiClick('🏀')}>🏀</span>
                                            <span onClick={() => handleEmojiClick('🏈')}>🏈</span>
                                            <span onClick={() => handleEmojiClick('⚾️')}>⚾️</span>
                                            <span onClick={() => handleEmojiClick('🏸')}>🏸</span>
                                            <span onClick={() => handleEmojiClick('🏒')}>🏒</span>
                                            <span onClick={() => handleEmojiClick('🪃')}>🪃</span>
                                            <span onClick={() => handleEmojiClick('🥅')}>🥅</span>
                                            <span onClick={() => handleEmojiClick('🏹')}>🏹</span>
                                            <span onClick={() => handleEmojiClick('🥋')}>🥋</span>
                                            <span onClick={() => handleEmojiClick('🛼')}>🛼</span>
                                            <span onClick={() => handleEmojiClick('🎿')}>🎿</span>
                                            <span onClick={() => handleEmojiClick('🏋️‍♀️')}>🏋️‍♀️</span>
                                            <span onClick={() => handleEmojiClick('🥁')}>🥁</span>
                                            <span onClick={() => handleEmojiClick('🪘')}>🪘</span>
                                            <span onClick={() => handleEmojiClick('🎷')}>🎷</span>
                                            <span onClick={() => handleEmojiClick('🎺')}>🎺</span>
                                            <span onClick={() => handleEmojiClick('🎻')}>🎻</span>
                                            <span onClick={() => handleEmojiClick('🎲')}>🎲</span>
                                            <span onClick={() => handleEmojiClick('🎯')}>🎯</span>
                                            <span onClick={() => handleEmojiClick('🎳')}>🎳</span>
                                            <span onClick={() => handleEmojiClick('🎮')}>🎮</span>
                                            <span onClick={() => handleEmojiClick('🎰')}>🎰</span>
                                            <span onClick={() => handleEmojiClick('🧩')}>🧩</span>
                                            <span onClick={() => handleEmojiClick('🚴‍♂️')}>🚴‍♂️</span>
                                            <span onClick={() => handleEmojiClick('🏆')}>🏆</span>
                                            <span onClick={() => handleEmojiClick('🏅')}>🏅</span>
                                            <span onClick={() => handleEmojiClick('🚗')}>🚗</span>
                                            <span onClick={() => handleEmojiClick('🚌')}>🚌</span>
                                            <span onClick={() => handleEmojiClick('🚑')}>🚑</span>
                                            <span onClick={() => handleEmojiClick('🦽')}>🦽</span>
                                            <span onClick={() => handleEmojiClick('🚛')}>🚛</span>
                                            <span onClick={() => handleEmojiClick('🚲')}>🚲</span>
                                            <span onClick={() => handleEmojiClick('⌚️')}>⌚️</span>
                                            <span onClick={() => handleEmojiClick('📱')}>📱</span>
                                            <span onClick={() => handleEmojiClick('💻')}>💻</span>
                                            <span onClick={() => handleEmojiClick('🖨')}>🖨</span>
                                            <span onClick={() => handleEmojiClick('💿')}>💿</span>
                                            <span onClick={() => handleEmojiClick('📷')}>📷</span>
                                            <span onClick={() => handleEmojiClick('⌛️')}>⌛️</span>
                                            <span onClick={() => handleEmojiClick('📋')}>📋</span>
                                            <span onClick={() => handleEmojiClick('📚')}>📚</span>
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
                                        img={item.img || avatar_default}
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
