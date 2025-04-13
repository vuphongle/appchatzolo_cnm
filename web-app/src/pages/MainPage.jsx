import React, { useState, useEffect, useRef, useMemo } from "react";
import "../css/MainPage.css"; // CSS riêng cho giao diện
import "../css/ModelTimkiem_TinNhan.css"; // CSS riêng cho giao diện
import SearchModal from './SearchModal';
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
import UserInfoModal from "./UserInfoModal";


import S3Service from "../services/S3Service";
import { se } from "date-fns/locale";
import CreateGroupModal from "./CreateGroupModal";
import FriendInfoModal from "./FriendInfoModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { v4 as uuidv4 } from 'uuid';

import VideoCallComponent from '../context/VideoCallComponent';  // Import VideoCallComponent

//thêm sự kiện onClick để cập nhật state selectedChat trong MainPage.
const MessageItem = ({ groupName, unreadCount, img, onClick, chatMessages = [], onDeleteChat }) => (
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
        <div className="dropdown position-absolute top-0 end-0 mt-2 me-2">
            <button
                className="btn btn-light border-0 p-0"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: '30px', // Đặt chiều cao tùy ý
                    padding: '5px 10px', // Thay đổi padding nếu cần
                    lineHeight: '1', // Cân chỉnh chiều cao dòng văn bản
                }}
            >
                <i className="fas fa-ellipsis-h"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end text-end">
                <li>
                    <a className="dropdown-item" onClick={(e) => { e.stopPropagation(); document.body.click(); }}>
                        Thêm vào nhóm
                    </a>
                </li>
                <li>
                    <hr className="dropdown-divider" />
                </li>
                <li>
                    <a
                        className="dropdown-item text-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            document.body.click();
                            onDeleteChat && onDeleteChat(); // Gọi hàm xóa
                        }}
                    >
                        Xóa hội thoại
                    </a>
                </li>
            </ul>
        </div>
    </li>
);

const MessageOptionsMenu = ({ onRecall, onForward, isOwner, isMine }) => {
    return (
        <div
            className={`p-1 shadow rounded-3 message-options-menu scale-down ${isMine ? 'mine' : 'theirs'}`}
        >
            <button className="dropdown-item" onClick={onForward}>
                <i className="bi bi-share me-2"></i> Chia sẻ
            </button>
            <div className="dropdown-divider"></div>
            {isOwner && (
                <button className="dropdown-item text-danger" onClick={onRecall}>
                    <i className="bi bi-arrow-counterclockwise me-2"></i> Thu hồi
                </button>
            )}
        </div>
    );
};



const ForwardMessageModal = ({ isOpen, onClose, onForward, friends, messageContent }) => {
    const [selected, setSelected] = useState([]);
    const [isForwarding, setIsForwarding] = useState(false);


    const toggleSelect = (userId) => {
        setSelected((prev) =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-flex align-items-center justify-content-center" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content" style={{ maxHeight: "90vh", overflow: "hidden" }}>

                    {/* Header */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Chia sẻ tin nhắn</h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>

                    {/* Body */}
                    <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Chọn bạn bè:</label>
                            {friends.length === 0 ? (
                                <p className="text-muted">Không có bạn bè để chia sẻ.</p>
                            ) : (
                                <div className="form-check-group">
                                    {friends.map((friend) => (
                                        <div key={friend.id} className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                value={friend.id}
                                                checked={selected.includes(friend.id)}
                                                onChange={() => toggleSelect(friend.id)}
                                                id={`friend-${friend.id}`}
                                            />
                                            <label className="form-check-label" htmlFor={`friend-${friend.id}`}>
                                                {friend.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-light border rounded">
                            <strong className="d-block mb-2">Tin nhắn cần chia sẻ:</strong>
                            <div>{messageContent}</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={selected.length === 0 || isForwarding}
                            onClick={async () => {
                                setIsForwarding(true);
                                await onForward(selected);
                                setIsForwarding(false);
                            }}
                        >
                            Chia sẻ
                        </button>
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
    const [isUserChangePWVisible, setIsUserChangePWVisible] = useState(false);
    const [messageInputKey, setMessageInputKey] = useState(Date.now());

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    const [invitationCount, setInvitationCount] = useState(0);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setIsRecording(true);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `record-${Date.now()}.webm`, { type: 'audio/webm' });

                // Gửi lên S3 hoặc API upload
                const url = await S3Service.uploadFile(audioFile); // dùng chung như uploadFile/image
                const message = {
                    id: new Date().getTime().toString(),
                    senderID: MyUser?.my_user?.id,
                    receiverID: selectedChat.id,
                    content: url,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                };
                sendMessage(message);
                setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
            };

            recorder.start();
        } catch (err) {
            console.error("Lỗi khi truy cập microphone:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };


    const handleUserInfoToggle = () => {
        setIsUserInfoVisible(true);
        setIsSettingsOpen(false)
    };

    const handleUserChangePWToggle = () => {
        setIsUserChangePWVisible(true);
        setIsSettingsOpen(false)
    };

    const handleCloseModal = () => {
        setIsUserInfoVisible(false);
        setIsModalGroupOpen(false);
        setIsUserChangePWVisible(false);
    };

    const { MyUser, setMyUser, logout, updateUserInfo } = useAuth();
    const { sendMessage, onMessage } = useWebSocket(); // Lấy hàm gửi tin nhắn từ context
    const { sendFriendRequestToReceiver } = useWebSocket();
    const [activeTab, setActiveTab] = useState("chat"); // State quản lý tab
    const [activeSubTab, setActiveSubTab] = useState("friends");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);

    //chọn component MessageItem
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState(""); // Nội dung tin nhắn nhập vào
    const [chatMessages, setChatMessages] = useState([]); // Danh sách tin nhắn của chat

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]); // Danh sách tin nhắn chưa đọc

    const [friendList, setFriendList] = useState([]);
    const selectedChatIdAtShareRef = useRef(null);

    const updateFriendList = (friendId) => {
        const friendIds = Array.isArray(MyUser?.my_user?.friendIds) ? MyUser.my_user.friendIds : [];
        setFriendList((prevList) => {
            // Kiểm tra xem bạn đã có trong danh sách chưa
            if (!prevList.includes(friendId)) {
                return [...prevList, friendId];  // Thêm bạn mới vào danh sách
            }
            return prevList;
        });

        // Cập nhật lại thông tin người dùng nếu cần
        const updatedUserData = {
            ...MyUser,
            my_user: {
                ...MyUser.my_user,
                friendIds: [...friendIds, friendId],
            },
        };
        updateUserInfo(updatedUserData);
    };

    //set trang thái online/offline ------------- ở đây
    // Khi người dùng chọn một bạn từ danh sách tìm kiếm
    const handleSelectChat = async (user) => {
        try {
            // Gọi API để lấy trạng thái online của user
            const updatedUser = await UserService.getUserById(user.id);

            // Cập nhật thông tin người bạn và trạng thái online
            setSelectedChat({
                ...user,
                isOnline: updatedUser.online,  // Cập nhật trạng thái online từ backend
                username: updatedUser.name,
                avatar: updatedUser.avatar,
            });
            //console.log("Selected user", updatedUser);
            //console.log("User status", updatedUser.isOnline);
            // Gọi API hoặc xử lý thêm các bước cần thiết, ví dụ như lấy tin nhắn chưa đọc
            const unreadMsgs = await MessageService.getUnreadMessagesCountForAllFriends(MyUser?.my_user?.id, user.id);
            if (unreadMsgs.length > 0) {
                await MessageService.savereadMessages(MyUser?.my_user?.id, user.id);
            }

            setUnreadMessages([]);  // Đánh dấu tất cả tin nhắn là đã đọc

            setActiveTab("chat");

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu user hoặc tin nhắn:", error);

            // Nếu có lỗi, thiết lập trạng thái offline mặc định
            setSelectedChat({
                ...user,
                isOnline: false,

            });

            setUnreadMessages([]);

            setActiveTab("chat")
        }
    };

    const handleDeleteChat = async (senderID, receiverID) => {
        if (!window.confirm("Bạn có chắc muốn xóa toàn bộ hội thoại này không?")) return;

        try {
            // 1. Gọi API để xóa tin nhắn trong DB (cho cả 2 bên)
            const result = await MessageService.deleteChat(senderID, receiverID);
            alert(result);

            // 2. Nếu đang chat với người đó thì xóa khỏi UI
            if (selectedChat && selectedChat.id === receiverID) {
                setSelectedChat(null);
                setChatMessages([]);
            }

            // 3. (Tùy chọn) Cập nhật lại danh sách cuộc trò chuyện nếu cần
            // setConversations(prev => prev.filter(conv => conv.userId !== receiverID));

            // Chú ý: Không cần gửi thông báo WebSocket từ FE,
            // Backend sẽ tự gửi thông báo xóa chat cho người bên kia.
        } catch (error) {
            console.error("Lỗi khi xóa hội thoại:", error);
            alert("Không thể xóa hội thoại.");
        }
    };

    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardMessageId, setForwardMessageId] = useState(null);

    // Gọi API chia sẻ
    const handleForward = async (selectedUserIds) => {
        try {
            if (!forwardMessageId) return;
            const uniqueUserIds = [...new Set(selectedUserIds)];

            await MessageService.forwardMessage(forwardMessageId, MyUser.my_user.id, uniqueUserIds);

            alert("Chia sẻ thành công!");
            setShowForwardModal(false);
            setForwardMessageId(null);

        } catch (err) {
            alert("Chia sẻ thất bại!");
            console.error("Lỗi chia sẻ:", err);
        }
    };


    const [showMenuForMessageId, setShowMenuForMessageId] = useState(null);


    // State để lưu số lượng tin nhắn chưa đọc cho từng bạn
    const [unreadMessagesCounts, setUnreadMessagesCounts] = useState([]);
    const [friends, setFriends] = useState([]); // Danh sách bạn bè
    // Hàm lấy số lượng tin nhắn chưa đọc cho từng bạn
    const getUnreadMessagesForFriends = async (friends) => {
        const unreadCounts = await Promise.all(
            friends.map(async (friend) => {
                const unreadCount = await MessageService.getSLUnreadMessages(MyUser?.my_user?.id, friend.id);
                return { friendId: friend.id, unreadCount }; // Trả về đối tượng với friendId và unreadCount
            })
        );
        return unreadCounts; // Trả về danh sách các tin nhắn chưa đọc cho từng bạn
    };

    // useEffect để lấy số lượng tin nhắn chưa đọc cho tất cả bạn bè
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id) return;

        const fetchUnreadMessagesCountForAllFriends = async () => {
            const unreadCounts = await MessageService.getUnreadMessagesCountForAllFriends(MyUser?.my_user?.id);
            setUnreadMessagesCounts(unreadCounts); // Lưu số lượng tin nhắn chưa đọc vào state
        };

        fetchUnreadMessagesCountForAllFriends();
    }, [MyUser]);

    // useEffect để tải tin nhắn khi chọn cuộc trò chuyện
    useEffect(() => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.id || !selectedChat?.id) return;

        // Lấy tất cả tin nhắn giữa người gửi và người nhận
        MessageService.get(`/messages?senderID=${MyUser?.my_user?.id}&receiverID=${selectedChat.id}`)
            .then((data) => {
                // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
                const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));

                // Cộng 7 giờ vào sendDate của mỗi tin nhắn
                const updatedMessages = sortedMessages.map((msg) => ({
                    ...msg,
                    sendDate: moment(msg.sendDate).add(7, 'hours').format("YYYY-MM-DDTHH:mm:ssZ") // Cộng 7 giờ vào sendDate
                }));

                // Lọc các tin nhắn chưa đọc
                const unreadMessages = updatedMessages.filter((msg) => msg.isRead === false);

                // Nếu có tin nhắn chưa đọc, gọi API để đánh dấu là đã đọc
                if (unreadMessages.length > 0) {
                    // Gửi yêu cầu PUT để đánh dấu tin nhắn là đã đọc
                    MessageService.savereadMessages(MyUser?.my_user?.id, selectedChat.id)
                        .then(() => {
                            setChatMessages(updatedMessages);  // Cập nhật tin nhắn ngay lập tức

                            // Cập nhật số lượng tin nhắn chưa đọc cho bạn bè
                            const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                                if (count.friendId === selectedChat.id) {
                                    return { ...count, unreadCount: 0 };  // Đánh dấu đã đọc (unreadCount = 0)
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
                    setChatMessages(updatedMessages);
                }
            })
            .catch((err) => {
                console.error("Error fetching messages:", err);
            });
    }, [selectedChat, MyUser?.my_user?.id]);  // Khi selectedChat hoặc MyUser thay đổi

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
                // console.log("Messages data là gì:", messages); // Kiểm tra dữ liệu tin nhắn
            });
    }, []); // Chỉ chạy một lần khi component được mount

    // console.log("Messages data là gì:", selectedChat); // Kiểm tra dữ liệu tin nhắn



    useEffect(() => {
        const unsubscribe = onMessage((incomingMessage) => {
            if (incomingMessage.type === "DELETE_MESSAGE") {
                // Kiểm tra: nếu cuộc chat đang được chọn thuộc về người gửi lệnh xóa,
                // thì xóa luôn phần hiển thị
                if (selectedChat && (selectedChat.id === incomingMessage.from || selectedChat.id === incomingMessage.to)) {
                    setSelectedChat(null);
                    setChatMessages([]);
                }
                // Bạn có thể cập nhật danh sách tin nhắn chưa đọc hoặc danh sách cuộc trò chuyện ở đây nếu cần
                return; // Kết thúc xử lý cho thông báo xóa
            }
            if (incomingMessage.type === "RECALL_MESSAGE") {
                const recalledMessageId = incomingMessage.messageId;
                // Giả sử chatMessages được lưu ở state, bạn xoá tin nhắn có id vừa recall
                setChatMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === recalledMessageId ? { ...msg, content: "Tin nhắn đã được thu hồi" } : msg
                    )
                );
                return; // Kết thúc xử lý cho RECALL_MESSAGE
            }
            if (incomingMessage.type === "WAITING_APPROVED") {
                // Cập nhật số lời mời kết bạn chưa đọc
                setInvitationCount((prev) => prev + (incomingMessage.count || 1));
            }
            // Tin nhắn socket đồng ý kết bạn
            if (incomingMessage.type === "SUBMIT_FRIEND_REQUEST") {
                updateFriendList(incomingMessage.senderID);

                if (incomingMessage.type === "CHAT") {
                    const msg = incomingMessage.message;

                    // Nếu cuộc trò chuyện đang mở là đúng chiều người gửi/nhận
                    if (
                        selectedChat &&
                        (msg.senderID === selectedChat.id || msg.receiverID === selectedChat.id)
                    ) {
                        setChatMessages((prev) =>
                            [...prev, msg].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate))
                        );
                    } else {
                        // Nếu không phải, tăng unread
                        const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                            if (count.friendId === msg.senderID) {
                                return {
                                    ...count,
                                    unreadCount: count.unreadCount + 1,
                                };
                            }
                            return count;
                        });
                        setUnreadMessagesCounts(updatedUnreadCounts);
                    }
                }


                // updateFriendList(incomingMessage.senderID); // Cập nhật danh sách bạn bè khi có tin nhắn mới
                if (incomingMessage.type === "SUBMIT_FRIEND_REQUEST") {
                    updateFriendList(incomingMessage.senderID); // Cập nhật danh sách bạn bè khi có tin nhắn mới

                    // Kiểm tra nếu người gửi không phải là selectedChat
                    if (incomingMessage.senderID !== selectedChat?.id) {
                        // Tăng unreadCount nếu tin nhắn không đến từ cuộc trò chuyện hiện tại
                        const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                            if (count.friendId === incomingMessage.senderID) {
                                return {
                                    ...count,
                                    unreadCount: count.unreadCount + 1, // Tăng số tin nhắn chưa đọc
                                };
                            }
                            return count;
                        });
                        setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật lại số lượng tin nhắn chưa đọc
                    } else {
                        // Nếu người gửi là selectedChat, cập nhật tin nhắn và đánh dấu là đã đọc
                        const validSendDate = moment(incomingMessage.sendDate).isValid()
                            ? moment(incomingMessage.sendDate).toISOString()
                            : new Date().toISOString();

                        // Cập nhật tin nhắn mới vào chatMessages
                        setChatMessages((prevMessages) => [
                            ...prevMessages,
                            { ...incomingMessage, sendDate: validSendDate },
                        ].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));

                        // Đánh dấu tin nhắn là đã đọc và cập nhật số lượng tin nhắn chưa đọc về 0
                        if (incomingMessage.isRead === false) {
                            MessageService.savereadMessages(MyUser.my_user.id, selectedChat.id)
                                .then(() => {
                                    // Cập nhật trạng thái tin nhắn là đã đọc
                                    setChatMessages((prevMessages) =>
                                        prevMessages.map((msg) =>
                                            msg.id === incomingMessage.id ? { ...msg, isRead: true } : msg
                                        )
                                    );

                                    // Cập nhật số lượng tin nhắn chưa đọc cho người bạn đang chọn
                                    const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                                        if (count.friendId === selectedChat.id) {
                                            return { ...count, unreadCount: 0 }; // Đánh dấu tin nhắn là đã đọc
                                        }
                                        return count;
                                    });
                                    setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật lại số lượng tin nhắn chưa đọc
                                    // Gọi lại reload trang khi nhấn vào tin nhắn đồng ý kết bạn

                                })
                                .catch((error) => {
                                    console.error("Lỗi khi đánh dấu tin nhắn là đã đọc", error);
                                });
                        }
                    }
                }
            }

            // Tin nhắn bình thường
            if (incomingMessage.senderID === selectedChat?.id || incomingMessage.receiverID === selectedChat?.id) {
                // Cập nhật tin nhắn mới
                const validSendDate = moment(incomingMessage.sendDate).isValid()
                    ? moment(incomingMessage.sendDate).toISOString()
                    : new Date().toISOString();

                // Cập nhật tin nhắn vào chatMessages
                setChatMessages((prevMessages) => [
                    ...prevMessages,
                    { ...incomingMessage, sendDate: validSendDate },
                ].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));

                // Nếu tin nhắn chưa được đọc, đánh dấu là đã đọc
                if (incomingMessage.isRead === false) {
                    MessageService.savereadMessages(MyUser.my_user.id, selectedChat.id)
                        .then(() => {
                            // Cập nhật trạng thái của tin nhắn trong chatMessages
                            setChatMessages((prevMessages) =>
                                prevMessages.map((msg) =>
                                    msg.id === incomingMessage.id ? { ...msg, isRead: true } : msg
                                )
                            );

                            // Cập nhật số lượng tin nhắn chưa đọc cho người bạn đang chọn
                            const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                                if (count.friendId === selectedChat.id) {
                                    return { ...count, unreadCount: 0 }; // Đánh dấu tin nhắn là đã đọc
                                }
                                return count;
                            });
                            setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật lại số lượng tin nhắn chưa đọc
                        })
                        .catch((error) => {
                            console.error("Lỗi khi đánh dấu tin nhắn là đã đọc", error);
                        });
                }
            } else {
                // Tăng số lượng tin nhắn chưa đọc nếu tin nhắn không thuộc cuộc trò chuyện đã chọn
                if (incomingMessage.isRead === false) {
                    const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                        if (count.friendId === incomingMessage.senderID) {
                            return {
                                ...count,
                                unreadCount: count.unreadCount + 1, // Tăng số tin nhắn chưa đọc
                            };
                        }
                        return count;
                    });
                    setUnreadMessagesCounts(updatedUnreadCounts); // Cập nhật lại số lượng tin nhắn chưa đọc
                }
            }
        });

        return () => unsubscribe(); // Hủy lắng nghe khi component unmount
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

        UserService.getFriends(MyUser?.my_user?.id)
            .then((data) => {
                setFriends(data); // Cập nhật danh sách bạn bè
            })
            .catch((err) => {
                console.error("Error fetching friends:", err);
            });
    }, [MyUser]);

    //nhấn enter gửi tin nhắn
    const handleSendMessage = async () => {
        const progress = document.getElementById('uploadProgress');
        const status = document.getElementById('status');

        const textContent = messageInputRef.current?.innerText.trim();

        if (!textContent && attachedFiles.length === 0) return;


        const isFileNameOnly = attachedFiles.some(file => {
            return file.name === textContent || textContent.includes(file.name);
        });


        // Xử lý file là ảnh (image/*)
        const imageFiles = attachedFiles.filter(file => file.type.startsWith("image/"));
        const otherFiles = attachedFiles.filter(file => !file.type.startsWith("image/"));

        // Upload và gửi ảnh
        if (imageFiles.length > 0) {
            try {
                const uploadedImages = [];
                for (let file of imageFiles) {
                    const fileUrl = await S3Service.uploadImage(file);
                    uploadedImages.push(fileUrl);
                }

                for (let url of uploadedImages) {
                    const message = {
                        id: uuidv4(),
                        senderID: MyUser?.my_user?.id,
                        receiverID: selectedChat.id,
                        content: url,
                        sendDate: new Date().toISOString(),
                        isRead: false,
                    };
                    sendMessage(message);
                    setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
                }
            } catch (error) {
                console.error("Upload image failed", error);
                return;
            }
        }

        // Upload và gửi file thường
        if (otherFiles.length > 0) {
            try {
                const uploadedFiles = [];
                for (let file of otherFiles) {
                    const fileUrl = await S3Service.uploadFile(file);
                    uploadedFiles.push(fileUrl);
                }

                for (let url of uploadedFiles) {
                    const message = {
                        id: uuidv4(),
                        senderID: MyUser?.my_user?.id,
                        receiverID: selectedChat.id,
                        content: url,
                        sendDate: new Date().toISOString(),
                        isRead: false,
                    };
                    sendMessage(message);
                    setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
                }
            } catch (error) {
                console.error("Upload file failed", error);
                return;
            }
        }

        // Gửi tin nhắn văn bản nếu có
        if (textContent && !isFileNameOnly) {
            const message = {
                id: uuidv4(),
                senderID: MyUser?.my_user?.id,
                receiverID: selectedChat.id,
                content: textContent,
                sendDate: new Date().toISOString(),
                isRead: false,
            };
            sendMessage(message);
            setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }

        // Reset mọi thứ
        setAttachedFiles([]);
        // if (messageInputRef.current) {
        //     messageInputRef.current.innerHTML = ""; // Xoá nội dung ô nhập
        // }
        setMessageInputKey(Date.now()); // Đặt lại key để làm mới ô nhập
    };

    const handleFriendTab = () => {
        if (invitationCount > 0) {
            // Nếu có lời mời kết bạn chưa đọc, chuyển sang tab bạn bè
            setActiveSubTab("requests");
            setInvitationCount(0);
        }
        setActiveTab("contacts");
        setSelectedChat(null); // Đặt lại selectedChat khi chuyển sang tab bạn bè
    }


    const toggleSettingsMenu = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    const [phoneNumber, setPhoneNumber] = useState("");
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalGroupOpen, setIsModalGroupOpen] = useState(false);
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [emojiBtnPosition, setEmojiBtnPosition] = useState({});

    const [loading, setLoading] = useState(false); // Loading state

    const [friendRequests, setFriendRequests] = useState([]);

    // Xử lý gửi tin nhắn kết bạn
    const [isFriendRequestModalOpen, setIsFriendRequestModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState(`Xin chào, mình là ${MyUser?.my_user?.name}. Mình biết bạn qua số điện thoại. Kết bạn với mình nhé!`);
    const [isRequestSent, setIsRequestSent] = useState(false);
    //tìm kiếm ban bè trong danh sách chat
    const [searchQuery, setSearchQuery] = useState(""); // State to store the search query
    const filteredFriends = Array.isArray(friends)
        ? friends.filter(friend =>
            friend.name.toLowerCase().includes(searchQuery.toLowerCase()) // Lọc tên theo query, không phân biệt chữ hoa/thường
        )
        : [];
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

    const handleUserInfoModalOpen = async () => {
        if (isFriendRequestSent === false) {
            setIsFriendRequestModalOpen(true);
        }
        else if (isFriendRequestSent === true) {
            try {
                // Xóa những lời mời cũ
                const response = await MessageService.deleteInvitation(MyUser?.my_user?.id, user.id);
                if (response) {
                    // Cập nhật trực tiếp trong state để danh sách luôn mới
                    setFriendRequests((prevRequests) => [...prevRequests.filter((req) => req.senderID !== user.id)]);
                    setIsFriendRequestSent(false);
                    //gửi thông báo bên B
                    sendMessage({
                        type: "INVITATION_REVOKE",
                        senderID: MyUser?.my_user?.id,
                        receiverID: user.id,
                    });
                } else {
                    console.error('Không thể xóa lời mời');
                }
            } catch (error) {
                console.error('Lỗi khi xóa lời mời:', error);
            }
        }
    };

    // Hàm mở giao diện chat
    const openChat = (user) => {
        setSelectedChat({
            ...user,  // Cập nhật tất cả thông tin từ user vào selectedChat
            isOnline: user.online,
            username: user.name,
            avatar: user.avatar || avatar_default, // Nếu không có avatar, sử dụng ảnh mặc định
        });
        setActiveTab("chat");   // Chuyển sang tab chat
        setIsModalOpen(false);   // Đóng modal kết bạn
    };

    const handleEmojiClick = (emoji) => {
        messageInputRef.current?.focus();

        // Chèn emoji tại vị trí con trỏ
        document.execCommand("insertText", false, emoji);
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

    const [attachedFiles, setAttachedFiles] = useState([]);
    const messageInputRef = useRef(null);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const imageFiles = files.filter(file => file.type.startsWith("image/"));
        if (imageFiles.length > 0) {
            setAttachedFiles((prev) => [...prev, ...imageFiles]);
        }
        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 0);
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setAttachedFiles((prev) => [...prev, ...files]);
        }
        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 0);
    };

    //Hàm xử lý tìm tin nhắn giữa 2 user
    const [searchQueryMessage, setSearchQueryMessage] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);  // Toggle modal state
    const [resultsCount, setResultsCount] = useState(0);  // Số lượng kết quả tìm thấy
    const [filteredMessages, setFilteredMessages] = useState(chatMessages); // Khai báo state filteredMessages

    // Handle searching messages
    const handleSearchMessages = () => {
        if (searchQueryMessage === '') {
            // Nếu không có từ khóa tìm kiếm, đặt lại chatMessages về danh sách ban đầu
            setFilteredMessages(chatMessages);
            setResultsCount(0);  // Đặt kết quả trùng khớp là 0 khi không có từ khóa tìm kiếm
            return;
        }

        // Kiểm tra xem có tin nhắn nào khớp với từ khóa không
        const filteredMessages = chatMessages.filter((msg) =>
            msg.content.toLowerCase().includes(searchQueryMessage.toLowerCase())
        );

        // Cập nhật filteredMessages và số lượng kết quả tìm thấy
        setFilteredMessages(filteredMessages);
        setResultsCount(filteredMessages.length); // Cập nhật số lượng kết quả tìm thấy
    };


    // Toggle the search modal
    const toggleSearchModal = () => {
        setIsSearchModalOpen((prev) => !prev);
    };
    // Hàm hiển thị phần tin nhắn có từ khóa tìm kiếm, làm nổi bật phần tìm được
    const highlightText = (text) => {
        if (!searchQuery) return text;  // Nếu không có từ khóa tìm kiếm, trả lại văn bản ban đầu
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));  // Chia văn bản thành các phần nhỏ
        return parts.map((part, index) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <span key={index} className="highlight">{part}</span>  // Tô màu vàng nếu là từ khóa
            ) : (
                part // Nếu không phải từ khóa, trả lại phần đó
            )
        );
    };

    useEffect(() => {
        if (searchQueryMessage === '') {
            setFilteredMessages(chatMessages);  // Trả về toàn bộ tin nhắn khi không có từ khóa tìm kiếm
            setResultsCount(0);  // Đặt lại kết quả trùng khớp là 0
        } else {
            const result = chatMessages.filter((msg) =>
                msg.content.toLowerCase().includes(searchQueryMessage.toLowerCase())
            );
            setFilteredMessages(result);
            setResultsCount(result.length); // Cập nhật số lượng kết quả tìm thấy
        }
    }, [searchQueryMessage, chatMessages]);  // Theo dõi sự thay đổi của searchQueryMessage

    // hàm call video
    const [isVideoCallVisible, setIsVideoCallVisible] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const videoCallRef = useRef(null);
    const toggleSearchModalCall = () => {
        setIsVideoCallVisible((prev) => !prev);
    };
    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === "video_call_request" && message.to === MyUser.my_user.id) {
                // Hiển thị modal cuộc gọi đến
                const userResponse = window.confirm(`Cuộc gọi video đến từ ${message.from}, bạn có muốn nhận không?`);
                if (userResponse) {
                    // Chấp nhận cuộc gọi
                    videoCallRef.current.startCall(message.from);
                    setIsCalling(true);  // Đánh dấu người dùng đang gọi video
                    setIsVideoCallVisible(true);  // Hiển thị modal cuộc gọi video
                }
            }
        });

        return () => {
            unsubscribe(); // Hủy đăng ký khi component unmount
        };
    }, [onMessage, MyUser.my_user.id]);


    const removeFile = (fileToRemove) => {
        setAttachedFiles((prev) => prev.filter((f) => f !== fileToRemove));
    };

    const handleInputChange = () => {
        // Nếu cần lưu nội dung dạng text để gửi đi
        const content = messageInputRef.current.innerText;
        setMessageInput(content);
    };

    const getPureFileUrl = (url) => {
        return url.replace(/(file|image)\/[^_]+_/, "$1/");
    }


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
                                        <img src={selectedChat.avatar || avatar_default} alt="Avatar" className="avatar" />
                                        <span className="username">{selectedChat.groupName || selectedChat.username}</span>
                                        <span className="user-status">
                                            {selectedChat.isOnline ? (
                                                <span className="status-dot online"></span>
                                            ) : (
                                                <span className="status-dot offline"></span>
                                            )}
                                            {selectedChat.isOnline ? " Đang hoạt động" : " Không hoạt động"}
                                        </span>
                                    </div>
                                    {/* Thêm nút tìm kiếm và gọi video vào header */}
                                    <div className="header-actions">
                                        {/* Nút tìm kiếm */}
                                        <button
                                            className="search-btn"
                                            onClick={toggleSearchModal}
                                        >
                                            <i className="fas fa-search"></i>
                                        </button>

                                        {/* Nút gọi video */}
                                        <button
                                            className="video-call-btn"
                                            onClick={toggleSearchModalCall}
                                        >
                                            <i className="fas fa-video"></i>
                                        </button>
                                    </div>
                                </header>
                                {/* Modal tìm kiếm tin nhắn */}
                                <SearchModal
                                    isSearchModalOpen={isSearchModalOpen}
                                    setIsSearchModalOpen={setIsSearchModalOpen}
                                    chatMessages={chatMessages}
                                    searchQuery={searchQueryMessage} // Truyền vào searchQuery
                                    setSearchQuery={setSearchQueryMessage} // Truyền vào setSearchQuery
                                    handleSearchMessages={handleSearchMessages}
                                />
                                {/*truyền vào các biến này   remoteUserId, userId, isVideoCallVisible, setIsVideoCallVisible  để call*/}
                                <VideoCallComponent
                                    remoteUserId={selectedChat.id} // Truyền ID người nhận vào VideoCallComponent
                                    userId={MyUser.my_user.id} // Truyền ID người gửi vào VideoCallComponent
                                    isVideoCallVisible={isVideoCallVisible} // Truyền trạng thái gọi video
                                    setIsVideoCallVisible={setIsVideoCallVisible} // Truyền hàm để đóng VideoCallComponent

                                />
                                <section className="chat-section">
                                    <div className="chat-messages">
                                        {chatMessages.length > 0 ? (
                                            chatMessages.map((msg, index) => {
                                                const isSentByMe = msg.senderID === MyUser?.my_user?.id;

                                                const isLastMessageByMe = isSentByMe && index === chatMessages.length - 1;

                                                // 📌 Lấy thời gian gửi tin nhắn và chuyển đổi sang múi giờ Việt Nam


                                                const messageTime = moment(msg.sendDate); // Giả sử msg.sendDate là thời gian nhận được
                                                const displayTime = messageTime.isValid() ? messageTime.format("HH:mm") : moment().format("HH:mm");


                                                const messageDate = moment(msg.sendDate).tz('Asia/Ho_Chi_Minh').format("DD/MM/YYYY");

                                                // 📌 Lấy ngày của tin nhắn trước đó
                                                const prevMessage = chatMessages[index - 1];
                                                const prevMessageDate = prevMessage ? moment(prevMessage.sendDate).tz('Asia/Ho_Chi_Minh').format("DD/MM/YYYY") : null;

                                                // 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày trước đó
                                                const shouldShowDate = index === 0 || prevMessageDate !== messageDate;

                                                // Kiểm tra xem tin nhắn có phải là URL của ảnh hay không
                                                const isImageMessage = (url) => url?.match(/\.(jjpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;

                                                const isVideoMessage = (url) => url?.match(/\.(mp4|wmv|webm|mov)$/i);

                                                const isAudioMessage = (url) => url?.match(/\.(mp3|wav|ogg)$/i);

                                                const isDocumentFile = (url) =>
                                                    url?.match(/\.(pdf|doc|docx|ppt|mpp|pptx|xls|xlsx|csv|txt|odt|ods|odp|json|xml|yaml|yml|ini|env|conf|cfg|toml|properties|java|js|ts|jsx|tsx|c|cpp|cs|py|rb|go|php|swift|rs|kt|scala|sh|bat|ipynb|h5|pkl|pb|ckpt|onnx|zip|rar|tar|gz|7z|jar|war|dll|so|deb|rpm|apk|ipa|whl|html|htm|css|scss|sass|vue|md|sql)$/i);

                                                return (
                                                    <div key={msg.id} id={`message-${msg.id}`} style={{ display: "flex", flexDirection: "column" }}>
                                                        {/* 📌 Hiển thị ngày giữa màn hình nếu là tin đầu tiên hoặc khác ngày trước đó */}
                                                        {shouldShowDate && (
                                                            <div className="message-date-center">
                                                                {moment(msg.sendDate).add(7, 'hours').isValid()
                                                                    ? moment(msg.sendDate).tz('Asia/Ho_Chi_Minh').calendar(null, {
                                                                        sameDay: "[Hôm nay] DD/MM/YYYY",
                                                                        lastDay: "[Hôm qua] DD/MM/YYYY",
                                                                        lastWeek: "[Tuần trước] DD/MM/YYYY",
                                                                        sameElse: "DD/MM/YYYY"
                                                                    })
                                                                    : "Invalid date"}
                                                            </div>
                                                        )}

                                                        <div className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
                                                            {/* Kiểm tra xem có phải là ảnh không và hiển thị ảnh nếu đúng */}
                                                            {isImageMessage(msg.content) ? (
                                                                <img src={msg.content} alt="Image" className="message-image" />
                                                            ) : isVideoMessage(msg.content) ? (
                                                                <video controls className="message-video">
                                                                    <source src={msg.content} type="video/mp4" />
                                                                    Trình duyệt không hỗ trợ video.
                                                                </video>
                                                            ) : isAudioMessage(msg.content) ? (
                                                                <audio controls className="message-audio">
                                                                    <source src={msg.content} type="audio/mp3" />
                                                                    Trình duyệt không hỗ trợ audio.
                                                                </audio>
                                                            ) : isDocumentFile(msg.content) ? (
                                                                <div className="file-message">
                                                                    <span className="file-icon">
                                                                        <i className="fa fa-file-alt"></i>
                                                                    </span>
                                                                    <span className="file-name"> {getPureFileUrl(msg.content).split('/').pop()}</span>
                                                                    <div>
                                                                        <a href={msg.content} download className="btn btn-blue">
                                                                            <button className="download-btn">Tải xuống</button>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p>{highlightText(msg.content)}</p>
                                                            )}

                                                            {/* 📌 Hiển thị thời gian bên dưới tin nhắn */}
                                                            <span className="message-time">{displayTime}</span>

                                                            {/* 📌 Nếu là tin nhắn cuối cùng bạn gửi và đã đọc => hiển thị "✔✔ Đã nhận" */}
                                                            {isLastMessageByMe && isSentByMe && msg.isRead && (
                                                                <span className="message-status read-status">✔✔ Đã nhận</span>
                                                            )}
                                                            {showMenuForMessageId === msg.id && (
                                                                <MessageOptionsMenu
                                                                    isOwner={msg.senderID === MyUser.my_user.id}
                                                                    isMine={msg.senderID === MyUser.my_user.id}
                                                                    onRecall={async () => {
                                                                        setShowMenuForMessageId(null);
                                                                        try {
                                                                            await MessageService.recallMessage(msg.id, MyUser.my_user.id, selectedChat.id);
                                                                            console.log("id message là :", msg.id);
                                                                            // Cập nhật lại danh sách tin nhắn
                                                                            setChatMessages((prev) => prev.map((m) =>
                                                                                m.id === msg.id ? { ...m, content: "Tin nhắn đã được thu hồi" } : m
                                                                            ));
                                                                            // Gửi thông báo WebSocket nếu có
                                                                        } catch (err) {
                                                                            console.error("Lỗi thu hồi:", err);
                                                                        }
                                                                    }}
                                                                    onForward={() => {
                                                                        // selectedChatIdAtShareRef.current = selectedChat?.id;
                                                                        setShowMenuForMessageId(null);
                                                                        setForwardMessageId(msg.id); // Gán ID tin nhắn đang muốn chia sẻ
                                                                        setShowForwardModal(true);   // Hiện modal chia sẻ
                                                                    }}
                                                                    onClose={() => setShowMenuForMessageId(null)}
                                                                />
                                                            )}
                                                        </div>
                                                        <ForwardMessageModal
                                                            isOpen={showForwardModal}
                                                            onClose={() => setShowForwardModal(false)}
                                                            onForward={handleForward}
                                                            friends={friends}
                                                            messageContent={chatMessages.find(m => m.id === forwardMessageId)?.content}
                                                        />
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
                                                    multiple
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
                                                    accept="file/*"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    style={{ display: 'none' }}
                                                    id="file-input"
                                                />
                                                <span>
                                                    <i className="fas fa-paperclip" style={{ fontSize: "24px", color: '#47546c' }}></i> {/* Biểu tượng đính kèm từ Font Awesome */}
                                                </span>
                                            </button>
                                            <button
                                                title={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                                                onClick={isRecording ? stopRecording : startRecording}
                                            >
                                                <span>
                                                    <i
                                                        className="fas fa-microphone"
                                                        style={{
                                                            fontSize: "24px",
                                                            color: isRecording ? 'red' : '#47546c'
                                                        }}
                                                    ></i>
                                                </span>
                                            </button>
                                            <button title="Thumbs Up">
                                                <span><i className="fas fa-volume-up" style={{ fontSize: "24px", color: '#47546c' }}></i></span>
                                            </button>
                                        </div>
                                        <div className="input-container">
                                            <div
                                                key={messageInputKey}
                                                className="chat-input"
                                                contentEditable
                                                suppressContentEditableWarning={true}
                                                ref={messageInputRef}
                                                onInput={handleInputChange}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault(); // tránh xuống dòng
                                                        handleSendMessage();
                                                    }
                                                }}
                                                data-placeholder={`Nhập tin nhắn tới ${selectedChat.groupName}`}
                                            >
                                                {attachedFiles.map((file, index) => (
                                                    <span key={index} contentEditable={false} className="file-tag">
                                                        {file.name}
                                                        <button
                                                            className="remove-file"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(file);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            <button
                                                className="icon-button"
                                                onClick={toggleEmojiPicker}
                                                style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
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
                                        <div className="setting-overlay" onClick={() => setEmojiPickerVisible(false)}>
                                            <div
                                                className="emoji-picker visible"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ top: emojiBtnPosition.top - 400, left: emojiBtnPosition.left - 105 }}
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
                return MyUser && MyUser.my_user ? <ContactsTab userId={MyUser.my_user.id} friendRequests={friendRequests} onSelectChat={handleSelectChat}
                    avatar_default={avatar_default}
                    MyUser={MyUser}
                    isUserInfoModalOpen={isUserInfoModalOpen}
                    setIsUserInfoModalOpen={setIsUserInfoModalOpen}
                    closeAllModal={closeAllModal}
                    handleUserInfoModalOpen={handleUserInfoModalOpen}
                    isFriendRequestSent={isFriendRequestSent}
                    isFriendRequestModalOpen={isFriendRequestModalOpen}
                    messageContent={messageContent}
                    setMessageContent={setMessageContent}
                    sendFriendRequest={sendFriendRequest}
                    setIsFriendRequestModalOpen={setIsFriendRequestModalOpen} /> : <div>Loading...</div>;
            default:
                return null;
        }
    };


    const handleSearchFriend = async () => {
        if (!MyUser || !MyUser.my_user || !MyUser.my_user.phoneNumber) return;

        if (!phoneNumber || phoneNumber.trim() === "") {
            setError("Vui lòng nhập số điện thoại.");
            return;
        }

        // Chuẩn hóa số điện thoại trước khi gửi
        let formattedPhoneNumber = phoneNumber.trim();

        // Nếu bắt đầu bằng '+84' => giữ nguyên
        if (formattedPhoneNumber.startsWith('+84')) {
            // không cần làm gì
        }
        // Nếu bắt đầu bằng '0' => thay bằng '+84'
        else if (formattedPhoneNumber.startsWith('0')) {
            formattedPhoneNumber = '+84' + formattedPhoneNumber.substring(1);
        }
        // Nếu chỉ là 9 chữ số không đầu '0', ví dụ: '344387030'
        else if (/^\d{9}$/.test(formattedPhoneNumber)) {
            formattedPhoneNumber = '+84' + formattedPhoneNumber;
        }
        // Trường hợp sai định dạng
        else {
            setError("Số điện thoại không hợp lệ.");
            return;
        }

        if (formattedPhoneNumber === MyUser?.my_user?.phoneNumber) {
            setError("Bạn không thể tìm kiếm chính mình.");
            return;
        }

        setLoading(true);
        try {
            const response = await UserService.get("/searchFriend", { phoneNumber: formattedPhoneNumber });

            setUser(response); // Cập nhật thông tin người dùng

            setIsUserInfoModalOpen(true); // Mở modal thông tin người dùng

            //Xử lý hiện thị nút "Kết bạn" hay "Gửi lời mời"
            try {
                const response_count = await MessageService.countInvitations(MyUser?.my_user?.id, response.id);
                if (response_count > 0) {
                    setIsFriendRequestSent(true);
                }
                else if (response_count === 0) {
                    setIsFriendRequestSent(false);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra lời mời:', error);
            }
            setError(null);
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

    const handleCreateGroup = () => {
        setIsModalGroupOpen(true);
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
            senderID: MyUser?.my_user?.id,
            receiverID: user.id,
            content: messageContent,
            isRead: false,
            sendDate: new Date().toISOString(),
            status: 'Chờ đồng ý',
            type: "WAITING_APPROVED"
        };

        try {

            // Gửi yêu cầu kết bạn qua MessageService
            const response = await MessageService.post('/addFriend', message);

            setIsFriendRequestSent(true);
            setIsRequestSent(true);
            setIsFriendRequestModalOpen(false);

            // Cập nhật trực tiếp trong state để danh sách luôn mới
            setFriendRequests((prevRequests) => [...prevRequests, message]);

            // Gửi WebSocket thông báo
            sendMessage(message);

            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

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
                        src={MyUser?.my_user?.avatar || avatar_default}
                        alt="User Avatar"
                        className="avatar-img"
                    />
                </div>

                <div className="nav-item" onClick={() => setActiveTab("chat")}>
                    <i className="icon">
                        <img src="/MainPage/chat.png" alt="Chat Icon" />
                    </i>
                </div>
                <div className="nav-item" onClick={handleFriendTab}>
                    <i className="icon">
                        <img src="/MainPage/friends.png" alt="friends Icon" />
                    </i>
                    {invitationCount > 0 && <span className="badge">{invitationCount}</span>}
                </div>
                <div className="nav-item settings" onClick={toggleSettingsMenu}>
                    <i className="icon">
                        <img src="/MainPage/settings2.png" alt="seting Icon" />
                    </i>
                    {isSettingsOpen && (
                        <div
                            className="setting-overlay"
                            onClick={() => setIsSettingsOpen(false)}
                        >
                            <div
                                className="settings-menu"
                                onClick={(e) => e.stopPropagation()} // Ngừng sự kiện click bubble
                            >
                                <ul>
                                    <li className="cat-dat" onClick={handleUserInfoToggle}>
                                        Thông tin tài khoản
                                    </li>
                                    <li className="cat-dat" onClick={handleUserChangePWToggle} >Mật khẩu</li>
                                    <li className="cat-dat">Dữ liệu</li>
                                    <li className="cat-dat">Ngôn ngữ</li>
                                    <li className="cat-dat">Hỗ trợ</li>
                                    <li className="logout" onClick={handleLogout}>Đăng xuất</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            {isUserInfoVisible && (
                <UserInfoModal user={MyUser?.my_user} onClose={handleCloseModal} />
            )}

            {isUserChangePWVisible && (
                <ChangePasswordModal user={MyUser?.my_user} onClose={handleCloseModal} logout={handleLogout} />
            )}

            {/* Sidebar header luôn hiển thị */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <input type="text" className="search-bar" placeholder="Tìm kiếm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}

                    />
                    <button className="search-button">
                        <img src="/MainPage/search.png" alt="Chat Icon" />
                    </button>
                    <button className="action-button" title="Thêm bạn" onClick={handleAddFriend}>
                        <img
                            className="action-button-img"
                            src="/MainPage/add-friend.png"
                            alt="Add Friend"

                        />
                    </button>
                    <button className="action-button" title="Tạo nhóm" onClick={handleCreateGroup}>
                        <img
                            className="action-button-img"
                            src="/MainPage/add-group1.png"
                            alt="Create Group"
                            style={{ width: "35px", height: "35px" }}
                        />
                    </button>
                </div>

                {isModalGroupOpen && (
                    <CreateGroupModal onClose={handleCloseModal} />
                )}

                {/* Sidebar tabs hiển thị trong tab "chat" */}
                {activeTab === "chat" && (
                    <>

                        <div className="sidebar-tabs">
                            <button className="tab active">Tất cả</button>
                            <button className="tab active">Chưa đọc</button>
                            <button className="tab active">Phân loại</button>
                        </div>
                        <div className="message-list">
                            <ul>
                                {searchQuery === "" ? (
                                    // Sắp xếp các message item sao cho các item có unreadCount > 0 sẽ hiển thị đầu tiên
                                    allMessagesAndFriends
                                        .sort((a, b) => b.unreadCount - a.unreadCount) // Sắp xếp các tin nhắn theo unreadCount (tin nhắn chưa đọc lên đầu)
                                        .map((item) => (
                                            <MessageItem
                                                key={item.id}
                                                groupName={item.groupName}
                                                unreadCount={item.unreadCount}
                                                img={item.img || avatar_default}
                                                onClick={() => handleSelectChat(item)} // Cập nhật selectedChat khi chọn người bạn
                                                onDeleteChat={() => handleDeleteChat(MyUser?.my_user.id, item.id)}
                                            />
                                        ))
                                ) : filteredFriends.length > 0 ? (
                                    // Sắp xếp các message item của bạn bè đã lọc theo query tìm kiếm
                                    filteredFriends
                                        .sort((a, b) => b.unreadCount - a.unreadCount) // Sắp xếp các tin nhắn theo unreadCount (tin nhắn chưa đọc lên đầu)
                                        .map((item) => (
                                            <MessageItem
                                                key={item.id}
                                                groupName={item.name}
                                                unreadCount={unreadMessagesCounts.find((u) => u.friendId === item.id)?.unreadCount || 0}
                                                img={item.avatar || avatar_default}
                                                onClick={() => handleSelectChat(item)} // Cập nhật selectedChat khi chọn người bạn
                                            />
                                        ))
                                ) : (
                                    <p>Không tìm thấy bạn bè nào.</p> // Hiển thị khi không tìm thấy kết quả
                                )}
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
                                        onClick={() => setActiveSubTab("friends")}
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
                                        onClick={() => setActiveSubTab("groups")}
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
                                        onClick={() => setActiveSubTab("requests")}
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
                                        onClick={() => setActiveSubTab("requestsGroup")}
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
                <div className="overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="modal-e"
                        onClick={(e) => e.stopPropagation()}  // Ngừng sự kiện click bubble tại modal
                    >
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
                                    required
                                />
                            </div>
                            {error && <div className="error">{error}</div>}

                            <div className="action-buttons">
                                <button className="search-modal-button" onClick={handleSearchFriend} disabled={loading}>
                                    {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
                                </button>
                                <button className="close-modal" onClick={() => setIsModalOpen(false)}>Hủy</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isUserInfoModalOpen && user && (
                <FriendInfoModal
                    user={user}
                    avatar_default={avatar_default}
                    MyUser={MyUser}
                    isUserInfoModalOpen={isUserInfoModalOpen}
                    setIsUserInfoModalOpen={setIsUserInfoModalOpen}
                    closeAllModal={closeAllModal}
                    handleUserInfoModalOpen={handleUserInfoModalOpen}
                    isFriendRequestSent={isFriendRequestSent}
                    isFriendRequestModalOpen={isFriendRequestModalOpen}
                    messageContent={messageContent}
                    setMessageContent={setMessageContent}
                    sendFriendRequest={sendFriendRequest}
                    setIsFriendRequestModalOpen={setIsFriendRequestModalOpen}
                    openChat={openChat}
                />
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

            {/* Hiển thị đang ghi âm */}
            {isRecording && (
                <div className="recording-modal">
                    <i className="fas fa-microphone" style={{ color: "red", fontSize: "32px", marginRight: "10px" }}></i>
                    <span>Đang ghi âm...</span>
                </div>
            )}
        </div>
    );
};

export default MainPage;