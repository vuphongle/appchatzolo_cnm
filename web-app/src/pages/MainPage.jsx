import React, { useState, useEffect, useRef, useMemo } from "react";
import "../css/MainPage.css"; // CSS riêng cho giao diện
import "../css/ModelTimkiem_TinNhan.css"; // CSS riêng cho giao diện
import SearchModal from './SearchModal';
import UserService from "../services/UserService";
import MessageService from "../services/MessageService";
import GroupService from "../services/GroupService";
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
import GroupMenuModal from "./GroupMenuModal";


import S3Service from "../services/S3Service";
import { se } from "date-fns/locale";
import CreateGroupModal from "./CreateGroupModal";
import FriendInfoModal from "./FriendInfoModal";
import ChangePasswordModal from "./ChangePasswordModal";
import AddMemberModal from "./AddMemberModal";
import { v4 as uuidv4 } from 'uuid';

import VideoCallComponent from '../context/VideoCallComponent';  // Import VideoCallComponent
import showToast from "../utils/AppUtils";

import MessageReaction from "./MessageReaction";

//thêm sự kiện onClick để cập nhật state selectedChat trong MainPage.
const MessageItem = ({ groupName, unreadCount, img, onClick, chatMessages = [], onDeleteChat }) => (
    <li className="message-item" tabIndex={0} onClick={onClick}>
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
        <div className="dropdown position-absolute top-0 end-0 mt-2 me-3">
            <button
                className="btn btn-light border-0 p-0"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: '30px',
                    padding: '5px 10px',
                    lineHeight: '1',
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

const MessageOptionsMenu = ({ onRecall, onForward, onDeleteForMe, onPinMessage, isOwner, isMine, isRecalled, isPinned }) => {
    const menuRef = useRef(null);
    const [menuDirection, setMenuDirection] = useState('open-up'); // Mặc định mở lên trên

    useEffect(() => {
        if (menuRef.current) {
            // Lấy vị trí của menu so với cửa sổ
            const menuRect = menuRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (menuRect.top < windowHeight / 4) {
                setMenuDirection('open-down');
            } else {
                setMenuDirection('open-up');
            }
        }
    }, []);

    return (
        <div
            ref={menuRef}
            className={`p-1 shadow rounded-3 message-options-menu scale-down ${isMine ? 'mine' : 'theirs'} ${menuDirection}`}
        >
            {!isRecalled && (
                <button className="dropdown-item" onClick={onForward}>
                    <i className="bi bi-share me-2"></i> Chia sẻ
                </button>
            )}
            {!isRecalled && !isPinned && (
                <button className="dropdown-item" onClick={onPinMessage} >
                    <i className="bi bi-share me-2"></i> Ghim tin nhắn
                </button>
            )}
            <div className="dropdown-divider"></div>
            {isOwner && !isRecalled && (
                <button className="dropdown-item text-danger" onClick={onRecall}>
                    <i className="bi bi-arrow-counterclockwise me-2"></i> Thu hồi
                </button>
            )}
            {!isRecalled && (
                <button className="dropdown-item text-danger" onClick={onDeleteForMe}>
                    <i className="bi bi-trash me-2"></i> Chỉ xóa ở phía tôi
                </button>
            )}
        </div>
    );
};

const ForwardMessageModal = ({ isOpen, onClose, onForward, friends, groups, messageContent }) => {
    const [selected, setSelected] = useState([]);
    const [isForwarding, setIsForwarding] = useState(false);


    const toggleSelect = (userId) => {
        setSelected((prev) =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };


    if (!isOpen) return null;

    return (
        <div className="modal show d-flex align-items-center justify-content-center" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content" style={{ width: "500px", maxHeight: "90vh", overflow: "hidden" }}>

                    {/* Header */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Chia sẻ tin nhắn</h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>

                    {/* Body */}
                    <div className="modal-body" style={{ flexGrow: 1, overflowY: "auto" }}>
                        <div className="mb-3">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control rounded-pill "
                                    placeholder="Tìm kiếm..."
                                />
                            </div>
                        </div>
                        <hr />
                        <div className="mb-3">
                            <div className="friend-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                {friends.length === 0 ? (
                                    <p className="text-muted">Không có bạn bè để chia sẻ.</p>
                                ) : (
                                    <div className="form-check-group" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                        {friends.map((friend) => (
                                            <div key={friend.id} className="form-check mb-2 me-3 d-flex align-items-center">
                                                <input
                                                    className="form-check-input me-2 "
                                                    type="checkbox"
                                                    value={friend.id}
                                                    checked={selected.includes(friend.id)}
                                                    onChange={() => toggleSelect(friend.id)}
                                                    id={`friend-${friend.id}`}
                                                />
                                                <label className="form-check-label d-flex align-items-center" htmlFor={`friend-${friend.id}`}>
                                                    <img
                                                        src={friend.avatar}
                                                        alt={friend.name}
                                                        className="rounded-circle me-2 ms-2"
                                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                    />
                                                    <span>{friend.name}</span>
                                                </label>
                                            </div>
                                        ))}
                                        {groups.length === 0 ? (
                                            <p className="text-muted">Không có nhóm để chia sẻ.</p>
                                        ) : (
                                            groups.map(group => (
                                                <div key={group.id} className="form-check mb-2 d-flex align-items-center">
                                                    <input
                                                        className="form-check-input me-2"
                                                        type="checkbox"
                                                        value={group.id}
                                                        checked={selected.includes(group.id)}
                                                        onChange={() => toggleSelect(group.id)}
                                                        id={`group-${group.id}`}
                                                    />
                                                    <label className="form-check-label d-flex align-items-center" htmlFor={`group-${group.id}`}>
                                                        <img
                                                            src={group.image}
                                                            alt={group.groupName}
                                                            className="rounded-circle me-2 ms-2"
                                                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                        />
                                                        <span>{group.groupName}</span>
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <hr />
                        <div className="mb-3">
                            <div
                                className="p-3 bg-secondary text-white border rounded"
                                style={{
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    maxHeight: "100px",
                                    backgroundColor: "#f0f0f0"
                                }}
                            >
                                <strong className="d-block mb-2 fw-bold fs-5">Chia sẻ tin nhắn</strong>
                                <p className="mb-0">{messageContent}</p>
                            </div>
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

    const [invitationCount, setInvitationCount] = useState(0);

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioFile, setAudioFile] = useState(null); // Lưu file âm thanh tạm thời
    const [showModal, setShowModal] = useState(false); // Hiển thị modal để người dùng chọn gửi hay hủy

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
                const audioFileTemp = new File([audioBlob], `record-${Date.now()}.webm`, { type: 'audio/webm' });
                setAudioFile(audioFileTemp); // Lưu file ghi âm tạm thời

                setShowModal(true); // Mở modal để người dùng kiểm tra
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

    // Xử lý khi người dùng chọn gửi ghi âm
    const handleSendRecording = async () => {
        if (audioFile) {
            const url = await S3Service.uploadFile(audioFile); // Upload lên S3
            const message = {
                id: new Date().getTime().toString(),
                senderID: MyUser?.my_user?.id,
                receiverID: selectedChat.id,
                content: url,
                sendDate: new Date().toISOString(),
                isRead: false,
                type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                status: 'sent',
            };
            sendMessage(message);
            setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }
        setShowModal(false); // Đóng modal sau khi gửi
    };

    // Xử lý khi người dùng chọn hủy ghi âm
    const handleCancelRecording = () => {
        setAudioFile(null); // Hủy file ghi âm
        setShowModal(false); // Đóng modal
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
    const [selectedTab, setSelectedTab] = useState("all");

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

    const removeFriendFromList = (friendId) => {
        const friendIds = Array.isArray(MyUser?.my_user?.friendIds) ? MyUser.my_user.friendIds : [];

        setFriendList((prevList) => prevList.filter((id) => id !== friendId));

        const updatedUserData = {
            ...MyUser,
            my_user: {
                ...MyUser.my_user,
                friendIds: friendIds.filter((id) => id !== friendId),
            },
        };

        updateUserInfo(updatedUserData);
    };

    //hiển thị group mà user tham gia 
    const [conversations, setConversations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const groupIds = Array.isArray(MyUser?.my_user?.groupIds) ? MyUser.my_user.groupIds : [];
    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (groupIds.length > 0) {
                try {
                    const memberPromises = groupIds.map(async (groupId) => {
                        console.log("Fetching members for group:", groupId);  // Log kiểm tra groupId
                        const response = await GroupService.getGroupMembers(groupId);
                        console.log("Group Members Response:", response);  // Kiểm tra phản hồi từ API
                        return response.data;
                    });

                    const allMembers = await Promise.all(memberPromises);
                    setGroupMembers(allMembers.flat());  // Flat để gộp tất cả thành viên lại
                } catch (error) {
                    console.error("Lỗi khi lấy thành viên nhóm:", error);

                }
            }
        };

        fetchGroupMembers();
    }, [groupIds]);  // Chạy lại khi groupIds thay đổi

    // Hàm xử lý khi nhóm bị xóa
    const handleGroupDeleted = (groupId) => {
        setConversations((prev) => prev.filter((conv) => conv.id !== groupId));
        setGroups((prev) => prev.filter((group) => group.id !== groupId));
        if (selectedChat?.id === groupId) {
            setSelectedChat(null);
            setChatMessages([]);
        }

        // Cập nhật groupIds trong MyUser và localStorage
        const updatedGroupIds = groupIds.filter((id) => id !== groupId);
        const updatedUser = {
            ...MyUser,
            my_user: {
                ...MyUser.my_user,
                groupIds: updatedGroupIds,
            },
        };
        setMyUser(updatedUser);
        localStorage.setItem("my_user", JSON.stringify(updatedUser));
    };

    //set trang thái online/offline ------------- ở đây
    // Khi người dùng chọn một bạn từ danh sách tìm kiếm
    const handleSelectChat = async (item) => {
        try {
            setIsMenuModalOpen(false)
            let updatedUser;
            if (item.type === 'group') {
                // Nếu là nhóm, gọi API lấy tin nhắn trong nhóm
                const groupResponse = await GroupService.getGroupMembers(item.id);
                const group = groupResponse?.data;
                if (!group) {
                    throw new Error("Không thể lấy thông tin nhóm");
                }
                const groupMessages = await MessageService.fetchGroupMessages(item.id);
                setSelectedChat({
                    ...item,
                    isOnline: true,  // Trạng thái online không cần thiết cho nhóm
                    username: item?.groupName,
                    avatar: item.img,
                    type: 'group'
                });
                setChatMessages(groupMessages);  // Cập nhật tin nhắn nhóm
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === item.id ? { ...group, type: 'group' } : conv
                    )
                );
            } else {
                // Nếu là người dùng, gọi API lấy thông tin người dùng
                updatedUser = await UserService.getUserById(item.id);  // Lấy thông tin người dùng
                setSelectedChat({
                    ...item,
                    isOnline: updatedUser.online,  // Trạng thái online của người dùng
                    username: updatedUser.name,
                    avatar: updatedUser.avatar,
                });
            }

            // Tiếp tục xử lý các tin nhắn chưa đọc
            const unreadMsgs = await MessageService.getUnreadMessagesCountForAllFriends(MyUser?.my_user?.id, item.id);
            if (unreadMsgs.length > 0) {
                await MessageService.savereadMessages(MyUser.my_user.id, item.id);
            }

            setUnreadMessages([]);  // Đánh dấu tất cả tin nhắn là đã đọc
            setActiveTab("chat");
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu user hoặc tin nhắn:", error);

            // Nếu có lỗi, thiết lập trạng thái offline mặc định
            setSelectedChat({
                ...item,
                isOnline: false,
            });

            setUnreadMessages([]);
            setActiveTab("chat");
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

            await MessageService.forwardMessage(forwardMessageId, MyUser?.my_user?.id, uniqueUserIds);

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

        if (selectedChat.type === 'group') {
            // Gọi hàm lấy tin nhắn trong nhóm khi selectedChat là nhóm
            MessageService.get(`/group-messages?groupId=${selectedChat.id}`)
                .then((data) => {
                    // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
                    const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));

                    // Cộng 7 giờ vào sendDate của mỗi tin nhắn
                    const updatedMessages = sortedMessages.map((msg) => ({
                        ...msg,
                        senderName: msg.name, // Đảm bảo gửi tên người gửi từ BE
                        senderAvatar: msg.avatar || "/default-avatar.jpg",
                        sendDate: moment(msg.sendDate).add(7, 'hours').format("YYYY-MM-DDTHH:mm:ssZ") // Cộng 7 giờ vào sendDate
                    }));

                    //console.log("Updated Messages chứa gì:", updatedMessages); // Kiểm tra dữ liệu tin nhắn đã cập nhật
                    // Cập nhật tin nhắn vào state
                    setChatMessages(updatedMessages);


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
                    console.error("Error fetching group messages:", err);
                });
        } else {
            // Lấy tất cả tin nhắn giữa người gửi và người nhận khi là cuộc trò chuyện cá nhân
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
        }
    }, [selectedChat, MyUser?.my_user?.id]); // Khi selectedChat hoặc MyUser thay đổi



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
            if (incomingMessage.type === "CREATE_GROUP") {
                console.log("Incoming message:", incomingMessage); // Log thông báo nhận được
                const newGroup = incomingMessage.newGroup;

                // Thêm mới groupMember vào danh sách
                setGroupMembers((prevMembers) => [
                    ...prevMembers,
                    {
                        id: newGroup.id,
                        groupName: newGroup.groupName,
                        image: newGroup.image,
                        userGroups: incomingMessage.userGroups,
                        createAt: newGroup.createAt,
                        createtorId: newGroup.creatorId,
                    },
                ]);
                // Cập nhật lại groupIds trong state và context
                const groupIds = Array.isArray(MyUser?.my_user?.groupIds) ? MyUser.my_user.groupIds : [];
                const updatedGroupIds = [...groupIds, newGroup.id];

                const updatedUserData = {
                    ...MyUser,
                    my_user: {
                        ...MyUser.my_user,
                        groupIds: updatedGroupIds,  // Cập nhật groupIds mới
                    },
                };

                // Cập nhật lại MyUser trong context
                updateUserInfo(updatedUserData);

                // Cập nhật lại my_user trong local storage
                localStorage.setItem('my_user', JSON.stringify(updatedUserData.my_user));

                // Lấy lại thông tin người dùng mới từ localStorage
                const updatedUserFromStorage = JSON.parse(localStorage.getItem('my_user'));
                showToast(`${incomingMessage.message}`, "info");
                return;
            }

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

            // pin message and unpin message chung luôn
            if (incomingMessage.type === "PIN_MESSAGE") {
                const pinnedMessageId = incomingMessage.messageId;
                setChatMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === pinnedMessageId ? { ...msg, pinned: !msg.pinned } : msg
                    )
                );
                return;
            }

            if (incomingMessage.type === "ADD_TO_GROUP") {
                const groupId = incomingMessage.groupId;

                // Cập nhật groupIds trong MyUser và localStorage
                if (!groupIds.includes(groupId)) {
                    const updatedUser = {
                        ...MyUser,
                        my_user: {
                            ...MyUser.my_user,
                            groupIds: [...groupIds, groupId],
                        },
                    };
                    setMyUser(updatedUser);
                    localStorage.setItem("my_user", JSON.stringify(updatedUser));
                }

                // Tải thông tin nhóm mới và thêm vào danh sách nhóm
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const group = res?.data;
                        if (group) {
                            // Cập nhật lại thông tin nhóm trong `groups`
                            setGroups((prev) =>
                                prev.map((g) => (g.id === groupId ? { ...g, ...group } : g)) // Cập nhật nhóm với dữ liệu mới
                            );

                            // Cập nhật lại thông tin nhóm trong `conversations`
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === groupId
                                        ? { ...conv, groupName: group?.groupName, img: group.image, type: 'group' } // Cập nhật các thuộc tính thông tin nhóm
                                        : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));
                return;
            }

            if (incomingMessage.type === "GROUP_UPDATE_INFO") {
                const groupId = incomingMessage.groupId;
                const newGroupName = incomingMessage.groupName;
                const newGroupAvatar = incomingMessage.image;

                console.log("selectChat:", selectedChat); // Log thông báo nhận được

                // Cập nhật lại selectedChat 
                setSelectedChat((prevChat) =>
                    prevChat.id === groupId
                        ? { ...prevChat, groupName: newGroupName, avatar: newGroupAvatar, img: newGroupAvatar }
                        : prevChat
                );

                // Cập nhật lại groupMembers sau khi nhận thông tin nhóm mới
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const group = res?.data;
                        if (group) {
                            // Cập nhật lại groupMembers
                            setGroupMembers((prevMembers) =>
                                prevMembers.map((member) =>
                                    member.id === groupId ? { ...member, groupName: newGroupName, image: newGroupAvatar } : member
                                )
                            );
                            // Cập nhật lại conversations với thông tin nhóm mới
                            setConversations((prevConversations) =>
                                prevConversations.map((conv) =>
                                    conv.id === groupId ? { ...conv, groupName: group.groupName, img: group.image } : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));


                showToast(`${incomingMessage.message}`, "info");
                return;
            }
            if (incomingMessage.type === "PROMOTE_CO_LEADER") {
                const groupId = incomingMessage.groupId;

                // Tải thông tin nhóm mới và thêm vào danh sách nhóm
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const group = res?.data;
                        if (group) {
                            // Cập nhật groups
                            if (!groups.some((g) => g.id === groupId)) {
                                setGroups((prev) => [...prev, group]);
                            } else {
                                setGroups((prev) =>
                                    prev.map((g) =>
                                        g.id === groupId ? group : g
                                    )
                                );
                            }
                            // Cập nhật conversations
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === groupId ? { ...group, type: 'group' } : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));
                return;
            }

            if (incomingMessage.type === "REMOVE_REACT") {
                const { messageId, userId } = incomingMessage;

                setChatMessages((prevMessages) =>
                    prevMessages.map((msg) => {
                        if (msg.id === messageId) {
                            const updatedReactions = Array.isArray(msg.reactions)
                                ? msg.reactions.filter((r) => r.userId !== userId)
                                : [];

                            return { ...msg, reactions: updatedReactions };
                        }
                        return msg;
                    })
                );
                return;
            }

            if (incomingMessage.type === "PROMOTE_TO_LEADER") {
                const groupId = incomingMessage.groupId;

                // Tải thông tin nhóm mới và thêm vào danh sách nhóm
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const group = res?.data;
                        if (group) {
                            // Cập nhật groups
                            if (!groups.some((g) => g.id === groupId)) {
                                setGroups((prev) => [...prev, group]);
                            } else {
                                setGroups((prev) =>
                                    prev.map((g) =>
                                        g.id === groupId ? group : g
                                    )
                                );
                            }
                            // Cập nhật conversations
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === groupId ? { ...group, type: 'group' } : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));
                return;
            }

            if (incomingMessage.type === "DEMOTE_TO_MEMBER") {
                console.log("Gỡ phó nhóm:", incomingMessage); // Log thông báo nhận được
                const groupId = incomingMessage.groupId;

                // Tải thông tin nhóm mới và thêm vào danh sách nhóm
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const group = res?.data;
                        console.log("Group data là gì:", group); // Kiểm tra dữ liệu nhóm
                        if (group) {
                            // Cập nhật groups
                            if (!groups.some((g) => g.id === groupId)) {
                                setGroups((prev) => [...prev, group]);
                            } else {
                                setGroups((prev) =>
                                    prev.map((g) =>
                                        g.id === groupId ? group : g
                                    )
                                );
                            }
                            // Cập nhật conversations
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === groupId ? { ...group, type: 'group' } : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));

                return;
            }

            if (incomingMessage.type === "MEMBER_REMOVED") {
                const groupId = incomingMessage.groupId;
                const removedUserId = incomingMessage.removedUserId;

                // Nếu người bị xóa là người dùng hiện tại
                if (removedUserId === MyUser?.my_user?.id) {
                    setConversations((prev) => prev.filter((conv) => conv.id !== groupId));
                    setGroups((prev) => prev.filter((group) => group.id !== groupId));
                    if (selectedChat?.id === groupId) {
                        setSelectedChat(null);
                        setChatMessages([]);
                    }
                    const updatedGroupIds = groupIds.filter((id) => id !== groupId);
                    const updatedUser = {
                        ...MyUser,
                        my_user: {
                            ...MyUser.my_user,
                            groupIds: updatedGroupIds,
                        },
                    };
                    setMyUser(updatedUser);
                    localStorage.setItem("my_user", JSON.stringify(updatedUser));
                    // showToast("Bạn đã bị xóa khỏi nhóm!", "info");
                }

                // Cập nhật danh sách thành viên của nhóm
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === groupId
                            ? {
                                ...conv,
                                userGroups: conv.userGroups.filter((member) => member.userId !== removedUserId),
                            }
                            : conv
                    )
                );
                setGroups((prev) =>
                    prev.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                userGroups: group.userGroups.filter((member) => member.userId !== removedUserId),
                            }
                            : group
                    )
                );

                return;
            }

            if (incomingMessage.type === "REACT_NOTIFICATION") {
                const { messageId, reactionType, userId } = incomingMessage;

                setChatMessages((prevMessages) =>
                    prevMessages.map((msg) => {
                        if (msg.id === messageId) {
                            const oldReactions = Array.isArray(msg.reactions) ? msg.reactions : [];

                            // Thêm reaction mới (không cần lọc nếu bạn cho phép nhiều lần)
                            const newReaction = { userId, reactionType };
                            const updatedReactions = [...oldReactions, newReaction];

                            // ✅ Clone toàn bộ message để chắc chắn trigger re-render
                            return {
                                ...msg,
                                reactions: updatedReactions,
                            };
                        }
                        return msg;
                    })
                );
                return;
            }

            if (incomingMessage.type === "GROUP_DELETED") {
                const groupId = incomingMessage.groupId;
                // Cập nhật danh sách hội thoại: Xóa nhóm bị xóa
                setConversations((prev) => prev.filter((conv) => conv.id !== groupId));
                setGroups((prev) => prev.filter((group) => group.id !== groupId));
                // Nếu nhóm bị xóa là selectedChat, xóa selectedChat
                // showToast(`Nhóm ${selectedChat?.groupName} đã bị giải tán!`, "info");
                if (selectedChat?.id === groupId) {
                    setSelectedChat(null);
                    setChatMessages([]);
                }

                // Cập nhật groupIds trong MyUser và localStorage
                const updatedGroupIds = groupIds.filter((id) => id !== groupId);
                const updatedUser = {
                    ...MyUser,
                    my_user: {
                        ...MyUser.my_user,
                        groupIds: updatedGroupIds,
                    },
                };
                setMyUser(updatedUser);
                localStorage.setItem("my_user", JSON.stringify(updatedUser));

                return;
            }

            if (incomingMessage.type === "LEAVE_GROUP") {
                const groupId = incomingMessage.groupId;

                // Nếu người rời nhóm là người dùng hiện tại
                if (MyUser?.my_user?.id === incomingMessage.userId) {
                    setConversations((prev) => prev.filter((conv) => conv.id !== groupId));
                    setGroups((prev) => prev.filter((group) => group.id !== groupId));
                    if (selectedChat?.id === groupId) {
                        setSelectedChat(null);
                        setChatMessages([]);
                    }
                    const updatedGroupIds = groupIds.filter((id) => id !== groupId);
                    const updatedUser = {
                        ...MyUser,
                        my_user: {
                            ...MyUser.my_user,
                            groupIds: updatedGroupIds,
                        },
                    };
                    setMyUser(updatedUser);
                    localStorage.setItem("my_user", JSON.stringify(updatedUser));
                }
                return;
            }

            if (incomingMessage.type === "GROUP_UPDATE") {
                const groupId = incomingMessage.groupId;
                if (selectedChat?.id === groupId) {
                    setIsMenuModalOpen(false);
                }
                // Lấy thông tin nhóm mới nhất
                GroupService.getGroupMembers(groupId)
                    .then((res) => {
                        const updatedGroup = res?.data;
                        if (updatedGroup) {
                            // Cập nhật groups
                            setGroups((prev) =>
                                prev.map((group) =>
                                    group.id === groupId ? updatedGroup : group
                                )
                            );
                            // Cập nhật conversations
                            setConversations((prev) =>
                                prev.map((conv) =>
                                    conv.id === groupId ? { ...updatedGroup, type: 'group' } : conv
                                )
                            );
                        }
                    })
                    .catch((err) => console.error("Error fetching group:", err));
                return;
            }

            if (incomingMessage.type === "CHAT") {
                const msg = incomingMessage.message;
                if (!selectedChat) return; // Nếu không có selectedChat, không làm gì cả

                // Kiểm tra nếu selectedChat là nhóm
                if (selectedChat.type === "GROUP_CHAT") {
                    console.log("Incoming message :", incomingMessage); // Kiểm tra dữ liệu tin nhắn
                    // Nếu tin nhắn là của nhóm đang chọn
                    if (incomingMessage.receiverID === selectedChat.id) {
                        const validSendDate = moment(incomingMessage.sendDate).isValid()
                            ? moment(incomingMessage.sendDate).toISOString()
                            : new Date().toISOString();

                        // Cập nhật tin nhắn nhóm và tự động cuộn xuống
                        setChatMessages((prevMessages) => [
                            ...prevMessages,
                            { ...msg, sendDate: validSendDate },
                        ].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));

                        // Cuộn xuống tin nhắn mới nhất (đảm bảo không cần reload trang)
                        const chatContainer = document.querySelector(".chat-messages");
                        if (chatContainer) {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }
                    }
                } else {
                    // Nếu là chat cá nhân
                    if (msg.senderID === selectedChat.id || msg.receiverID === selectedChat.id) {
                        const validSendDate = moment(incomingMessage.sendDate).isValid()
                            ? moment(incomingMessage.sendDate).toISOString()
                            : new Date().toISOString();

                        // Cập nhật tin nhắn cá nhân
                        setChatMessages((prevMessages) => [
                            ...prevMessages,
                            { ...msg, sendDate: validSendDate },
                        ].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
                    } else {
                        // Nếu không phải chat cá nhân, tăng unread count
                        const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                            if (count.friendId === msg.senderID) {
                                return { ...count, unreadCount: count.unreadCount + 1 };
                            }
                            return count;
                        });
                        setUnreadMessagesCounts(updatedUnreadCounts);
                    }
                }
            }

            if (incomingMessage.type === "REMOVE_FRIEND") {
                console.log("ddd message:", incomingMessage); // Kiểm tra dữ liệu tin nhắn
                removeFriendFromList(incomingMessage.sender);
            }

            if (incomingMessage.type === "FRIEND_REQUEST") {
                // Cập nhật số lời mời kết bạn chưa đọc
                setInvitationCount(incomingMessage.count);
            }
            console.log("Incoming message :", incomingMessage); // Kiểm tra dữ liệu tin nhắn
            // Tin nhắn socket đồng ý kết bạn
            if (incomingMessage.type === "SUBMIT_FRIEND_REQUEST") {
                updateFriendList(incomingMessage.sender);

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
                } else if (incomingMessage.senderID === selectedChat?.id || incomingMessage.receiverID === selectedChat?.id) {
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
                        MessageService.savereadMessages(MyUser?.my_user?.id, selectedChat.id)
                            .then(() => {
                                // Cập nhật trạng thái tin nhắn là đã đọc
                                setChatMessages((prevMessages) =>
                                    prevMessages.map((msg) =>
                                        msg.id === incomingMessage.id ? { ...msg, isRead: true } : msg
                                    )
                                );

                                // Cập nhật số lượng tin nhắn chưa đọc cho người bạn đang chọn
                                const updatedUnreadCounts = unreadMessagesCounts.map((count) => {
                                    if (count.friendId === incomingMessage.senderID) {
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
                    MessageService.savereadMessages(MyUser?.my_user?.id, selectedChat.id)
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


    const handleSendMessage = async () => {
        const progress = document.getElementById('uploadProgress');
        const status = document.getElementById('status');

        const textContent = messageInputRef.current?.innerText.trim();

        if (!textContent && attachedFiles.length === 0) return;

        const isFileNameOnly = attachedFiles.some(file => {
            return file.name === textContent || textContent.includes(file.name);
        });

        // Kiểm tra xem đang gửi tin nhắn trong nhóm hay không
        const receiverId = selectedChat?.type === 'group' ? selectedChat.id : selectedChat?.id; // Nếu là group, lấy ID nhóm, nếu không lấy ID cá nhân

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
                        receiverID: receiverId, // Sử dụng receiverId được cập nhật cho nhóm
                        content: url,
                        sendDate: new Date().toISOString(),
                        isRead: false,
                        type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                        status: 'sent',
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
                        receiverID: receiverId, // Sử dụng receiverId được cập nhật cho nhóm
                        content: url,
                        sendDate: new Date().toISOString(),
                        isRead: false,
                        type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                        status: 'sent',
                    };
                    sendMessage(message); // Gửi qua WebSocket
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
                receiverID: receiverId, // Sử dụng receiverId được cập nhật cho nhóm
                content: textContent,
                sendDate: new Date().toISOString(),
                isRead: false,
                type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                status: 'sent',
            };
            sendMessage(message); // Gửi qua WebSocket
            setChatMessages(prev => [...prev, message].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
        }

        // Reset mọi thứ
        setAttachedFiles([]);
        setMessageInputKey(Date.now()); // Đặt lại key để làm mới ô nhập
    };

    const handleFriendTab = () => {
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
    const [isModalMemberOpen, setIsModalMemberOpen] = useState(false);
    const handleCloseMemberModal = () => {
        setIsModalMemberOpen(false);
    };
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
                chatMessages: [],
            };
        }) : []),
        ...(Array.isArray(groupMembers) ? groupMembers.map((group) => {
            const unreadCount = unreadMessagesCounts.find(u => u.groupId === group.id)?.unreadCount || 0;
            return {
                id: group.id,
                groupName: group?.groupName,
                creatorId: group.creatorId,
                createdAt: group.createdAt,
                userGroups: group.userGroups,
                unreadCount: unreadCount,  // Đảm bảo tính toán số tin nhắn chưa đọc
                img: group.image,
                type: 'group', // Thêm thông tin loại để phân biệt giữa bạn bè và nhóm
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
                } else {
                    console.error('Không thể xóa lời mời');
                }
            } catch (error) {
                console.error('Lỗi khi xóa lời mời:', error);
            }
        }
    };

    useEffect(() => {
        if (activeTab === "contacts") {
            setActiveSubTab("friends");
        }
    }, [activeTab]);

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
        // setEmojiPickerVisible(false); // Ẩn bảng cảm xúc sau khi chọn
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

        const unsubscribe = onMessage((msg) => {
            console.log('📨 Tin nhắn đến:', msg);
            // Kiểm tra xem selectedChat có hợp lệ không và có thuộc tính type không
            if (!selectedChat || !selectedChat.type) {

                return;
            }
            if (selectedChat.type === 'group') {
                // Gọi hàm lấy tin nhắn trong nhóm khi selectedChat là nhóm
                MessageService.get(`/group-messages?groupId=${selectedChat.id}`)
                    .then((data) => {
                        // Sắp xếp tin nhắn theo thời gian từ cũ đến mới
                        const sortedMessages = data.sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));

                        // Cộng 7 giờ vào sendDate của mỗi tin nhắn
                        const updatedMessages = sortedMessages.map((msg) => ({
                            ...msg,
                            senderName: msg.name, // Đảm bảo gửi tên người gửi từ BE
                            senderAvatar: msg.avatar || "/default-avatar.jpg",
                            sendDate: moment(msg.sendDate).add(7, 'hours').format("YYYY-MM-DDTHH:mm:ssZ") // Cộng 7 giờ vào sendDate
                        }));

                        //console.log("Updated Messages chứa gì:", updatedMessages); // Kiểm tra dữ liệu tin nhắn đã cập nhật
                        // Cập nhật tin nhắn vào state
                        setChatMessages(updatedMessages);


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
                                        if (count.groupId === selectedChat.id) {
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
                        console.error("Error fetching group messages:", err);
                    });
            }

        });

        return () => unsubscribe(); // Gỡ listener khi component unmount

    }, [onMessage, selectedChat]); // Theo dõi sự thay đổi của selectedChat và unreadMessagesCounts


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
            if (message.type === "video_call_request" && message.to === MyUser?.my_user?.id) {
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
    }, [onMessage, MyUser?.my_user?.id]);


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

    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuModalOpen((prev) => !prev);
    };

    // const ss = (message, groupId, userIds) => {
    //     // Gửi tin nhắn đến tất cả thành viên trong nhóm
    //     userIds.forEach(userId => {
    //         // Gửi tin nhắn qua WebSocket
    //         sendMessage({
    //             ...message,
    //             receiverID: groupId, // Dùng receiverID là ID nhóm
    //             userId, // Gửi đến từng người dùng trong nhóm
    //         });

    //     });
    // };
    useEffect(() => {
        const unsubscribe = onMessage((incomingMessage) => {
            if (incomingMessage.type === "CHAT" && selectedChat) {
                if (selectedChat.type === 'group' && incomingMessage.receiverID === selectedChat.id) {
                    // Cập nhật tin nhắn nhóm
                    const validSendDate = moment(incomingMessage.sendDate).isValid()
                        ? moment(incomingMessage.sendDate).toISOString()
                        : new Date().toISOString();

                    setChatMessages(prevMessages => [
                        ...prevMessages,
                        { ...incomingMessage, sendDate: validSendDate }
                    ].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate)));
                }
            }
        });
        return () => unsubscribe();
    }, [selectedChat, onMessage]);
    const [showAllPinned, setShowAllPinned] = useState(false);


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
                                        <img src={selectedChat.avatar || selectedChat.img || avatar_default} alt="Avatar" className="avatar" />
                                        <span className="username">{selectedChat?.groupName || selectedChat.username}</span>
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

                                        {/* Nút thêm thành viên */}
                                        {selectedChat?.type === 'group' && (
                                            <button
                                                className="search-btn"
                                                onClick={() => setIsModalMemberOpen(true)}>
                                                <i className="fas fa-user-plus"></i>
                                            </button>
                                        )}
                                        {isModalMemberOpen && (
                                            <AddMemberModal
                                                onClose={handleCloseMemberModal}
                                                groupId={selectedChat.id}
                                                setSelectedConversation={setSelectedChat}
                                                conversation={selectedChat}
                                                sendMessage={sendMessage}
                                            />
                                        )}

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

                                        {/* Nút menu ngoài cùng bên phải */}
                                        <button
                                            className="menu-btn"
                                            onClick={toggleMenu}
                                        >
                                            <i className="fas fa-bars"></i>
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
                                    userId={MyUser?.my_user?.id} // Truyền ID người gửi vào VideoCallComponent
                                    isVideoCallVisible={isVideoCallVisible} // Truyền trạng thái gọi video
                                    setIsVideoCallVisible={setIsVideoCallVisible} // Truyền hàm để đóng VideoCallComponent

                                />

                                <section className="chat-section">
                                    {chatMessages && chatMessages.some(msg => msg.pinned) && (() => {
                                        const pinnedMessages = chatMessages.filter(msg => msg.pinned);
                                        const displayMessages = showAllPinned ? pinnedMessages : [pinnedMessages[0]];
                                        const extraCount = pinnedMessages.length - 1;

                                        return (
                                            <div className="pinned-messages p-1">
                                                {displayMessages.map((msg) => {
                                                    const isLong = msg.content.length > 15;
                                                    const displayContent = msg.showFullContent
                                                        ? msg.content
                                                        : `${msg.content.slice(0, 15)}${isLong ? "..." : ""}`;

                                                    return (
                                                        <div key={msg.id} className="card bg-light mb-2 shadow-sm">
                                                            <div className="card-body py-0 px-3 d-flex justify-content-between align-items-center">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="fas fa-thumbtack me-2"></i>
                                                                    <p className="mb-0 small"
                                                                        style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                                        {displayContent}
                                                                        {isLong && (
                                                                            <i
                                                                                className="btn btn-link btn-sm text-decoration-none ps-2"
                                                                                onClick={() => {
                                                                                    setChatMessages(prev =>
                                                                                        prev.map(m =>
                                                                                            m.id === msg.id
                                                                                                ? { ...m, showFullContent: !m.showFullContent }
                                                                                                : m
                                                                                        )
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {msg.showFullContent ? "Thu gọn" : "Xem thêm"}
                                                                            </i>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {pinnedMessages.length > 1 && (
                                                                        <div className="text-end">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary"
                                                                                onClick={() => setShowAllPinned(prev => !prev)}
                                                                            >
                                                                                {showAllPinned ? "Thu gọn" : `+${extraCount} ghim`}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => {
                                                                            MessageService.unpinMessage(msg.id, MyUser?.my_user?.id)
                                                                                .then(() => {
                                                                                    setChatMessages(prev =>
                                                                                        prev.map(m =>
                                                                                            m.id === msg.id ? { ...m, pinned: false } : m
                                                                                        )
                                                                                    );
                                                                                    const notificationMessage = {
                                                                                        id: uuidv4(),
                                                                                        senderID: selectedChat?.type === 'group' ? selectedChat.id : MyUser?.my_user?.id,
                                                                                        receiverID: selectedChat.id,
                                                                                        content: `${MyUser?.my_user?.name} đã bỏ ghim một tin nhắn`,
                                                                                        sendDate: new Date().toISOString(),
                                                                                        isRead: false,
                                                                                        type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                                                                                        status: "Notification",
                                                                                    };
                                                                                    sendMessage(notificationMessage);
                                                                                })
                                                                                .catch((error) => {
                                                                                    console.error("Lỗi khi bỏ ghim tin nhắn:", error);
                                                                                });


                                                                        }}
                                                                    >
                                                                        <i>Bỏ ghim</i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}


                                    <div className="chat-messages">

                                        {chatMessages.length > 0 ? (
                                            chatMessages
                                                .map((msg, index) => {
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
                                                    const isImageMessage = (url) => url?.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/) != null;

                                                    const isVideoMessage = (url) => url?.match(/\.(mp4|wmv|webm|mov)$/i);

                                                    const isAudioMessage = (url) => url?.match(/\.(mp3|wav|ogg)$/i);

                                                    const isDocumentFile = (url) =>
                                                        url?.match(/\.(pdf|doc|docx|ppt|mpp|pptx|xls|xlsx|csv|txt|odt|ods|odp|json|xml|yaml|yml|ini|env|conf|cfg|toml|properties|java|js|ts|jsx|tsx|c|cpp|cs|py|rb|go|php|swift|rs|kt|scala|sh|bat|ipynb|h5|pkl|pb|ckpt|onnx|zip|rar|tar|gz|7z|jar|war|dll|so|deb|rpm|apk|ipa|whl|html|htm|css|scss|sass|vue|md|sql|.mobileprovision)$/i);

                                                    return (
                                                        <div key={msg.id} id={`message-${msg.id}`} style={{ display: "flex", flexDirection: "column" }}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                setShowMenuForMessageId(msg.id);
                                                            }}
                                                            onClick={() => setShowMenuForMessageId(null)}>
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
                                                            {msg.status === "Notification" ? (
                                                                <div className="message-date-center">
                                                                    <p>{msg.content}</p>
                                                                </div>
                                                            ) : (
                                                                <div className={`chat-message ${isSentByMe ? "sent" : "received"}`}>
                                                                    {/* Nếu là tin nhắn nhóm, hiển thị tên và avatar người gửi */}

                                                                    {msg.type === 'group' && (
                                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                                            <img
                                                                                src={msg.senderAvatar || "/default-avatar.jpg"}
                                                                                alt="Avatar"
                                                                                style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "10px" }}
                                                                            />
                                                                            <span style={{ fontWeight: 'bold' }}>{msg.senderName}</span>
                                                                        </div>
                                                                    )}
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
                                                                    {/* Thêm phần Reaction dưới tin nhắn */}
                                                                    <MessageReaction
                                                                        key={msg.id + JSON.stringify(msg.reactions)}  // 👈 ép render lại khi reactions thay đổi
                                                                        messageId={msg.id}
                                                                        userId={MyUser?.my_user?.id}
                                                                        initialReactions={msg.reactions}
                                                                    />

                                                                    {showMenuForMessageId === msg.id && (
                                                                        <MessageOptionsMenu
                                                                            isOwner={msg.senderID === MyUser?.my_user?.id}
                                                                            isMine={msg.senderID === MyUser?.my_user?.id}
                                                                            isRecalled={msg.content === "Tin nhắn đã được thu hồi"}
                                                                            isPinned={msg.pinned}
                                                                            onRecall={async () => {
                                                                                setShowMenuForMessageId(null);
                                                                                try {
                                                                                    await MessageService.recallMessage(msg.id, MyUser?.my_user?.id, selectedChat.id);
                                                                                    setChatMessages((prev) => prev.map((m) =>
                                                                                        m.id === msg.id ? { ...m, content: "Tin nhắn đã được thu hồi" } : m
                                                                                    ));
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
                                                                            onDeleteForMe={async () => {
                                                                                setShowMenuForMessageId(null);
                                                                                try {
                                                                                    await MessageService.deleteSingleMessageForUser(msg.id, MyUser?.my_user?.id);
                                                                                    setChatMessages((prev) => prev.filter(m => m.id !== msg.id));
                                                                                } catch (err) {
                                                                                    console.error("Lỗi khi xóa ở phía tôi:", err);
                                                                                }
                                                                            }}
                                                                            onPinMessage={async () => {
                                                                                setShowMenuForMessageId(null);
                                                                                try {
                                                                                    await MessageService.pinMessage(msg.id, MyUser?.my_user?.id);
                                                                                    setChatMessages((prev) => prev.map((m) =>
                                                                                        m.id === msg.id ? { ...m, pinned: true } : m
                                                                                    ));
                                                                                    const notificationMessage = {
                                                                                        id: uuidv4(),
                                                                                        senderID: selectedChat?.type === 'group' ? selectedChat.id : MyUser?.my_user?.id,
                                                                                        receiverID: selectedChat.id,
                                                                                        content: `${MyUser?.my_user?.name} đã ghim một tin nhắn`,
                                                                                        sendDate: new Date().toISOString(),
                                                                                        isRead: false,
                                                                                        type: selectedChat?.type === 'group' ? 'GROUP_CHAT' : 'PRIVATE_CHAT',
                                                                                        status: "Notification",
                                                                                    };
                                                                                    sendMessage(notificationMessage);

                                                                                } catch (err) {
                                                                                    console.error("Lỗi khi ghim tin nhắn:", err);
                                                                                }
                                                                            }}
                                                                            onClose={() => setShowMenuForMessageId(null)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            <ForwardMessageModal
                                                                isOpen={showForwardModal}
                                                                onClose={() => setShowForwardModal(false)}
                                                                onForward={handleForward}
                                                                friends={friends}
                                                                groups={groupMembers}
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
                                                data-placeholder={`Nhập tin nhắn tới ${selectedChat?.groupName}`}
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
                        )
                        }
                    </div >
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
            // sendMessage(message);

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

    const SESSION_TIMEOUT = 20 * 3 * 3 * 60 * 1000; // 20 phút
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

    const handleClickFriendRequests = () => {
        setActiveSubTab("requests");
        setInvitationCount(0); // Reset badge về 0 khi người dùng đã bấm tab
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
                    {invitationCount > 0 && activeSubTab !== "requests" && (
                        <span className="badge">{invitationCount}</span>
                    )}
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
                            style={{ width: "35px", height: "35px" }}

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
                            <button
                                tabIndex={0}
                                className={`tab ${selectedTab === "all" ? "active" : ""}`}
                                onClick={() => setSelectedTab("all")}
                            >
                                Tất cả
                            </button>
                            <button
                                tabIndex={0}
                                className={`tab ${selectedTab === "unread" ? "active" : ""}`}
                                onClick={() => setSelectedTab("unread")}
                            >
                                Chưa đọc
                            </button>
                            <button
                                tabIndex={0}
                                className={`tab ${selectedTab === "categorized" ? "active" : ""}`}
                                onClick={() => setSelectedTab("categorized")}
                            >
                                Phân loại
                            </button>
                        </div>
                        <div className="message-list">
                            <ul>
                                {searchQuery === "" ? (
                                    // Sắp xếp các message item sao cho các item có unreadCount > 0 sẽ hiển thị đầu tiên
                                    allMessagesAndFriends
                                        .filter((item) => {
                                            if (item.type === "group") {
                                                return MyUser?.my_user?.groupIds?.includes(item.id);
                                            }
                                            return true;
                                        })
                                        .sort((a, b) => b.unreadCount - a.unreadCount) // Sắp xếp các tin nhắn theo unreadCount (tin nhắn chưa đọc lên đầu)
                                        .map((item) => (
                                            <MessageItem
                                                key={item.id}
                                                groupName={item?.groupName}
                                                unreadCount={item.unreadCount}
                                                img={item.img || avatar_default}
                                                onClick={() => handleSelectChat(item)} // Cập nhật selectedChat khi chọn người bạn
                                                onDeleteChat={() => handleDeleteChat(MyUser?.my_user?.id, item.id)}
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
                                        className={`nav-link d-flex align-items-center fs-6 ${activeSubTab === "friends" ? "active text-white bg-primary" : "text-dark"}`}
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
                                        className={`nav-link d-flex align-items-center fs-6 ${activeSubTab === "groups" ? "active text-white bg-primary" : "text-dark"}`}
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
                                        className={`nav-link d-flex align-items-center fs-6 ${activeSubTab === "requests" ? "active text-white bg-primary" : "text-dark"}`}
                                        id="v-pills-friend-tab"
                                        data-bs-toggle="pill"
                                        data-bs-target="#v-pills-friend"
                                        type="button"
                                        role="tab"
                                        aria-controls="v-pills-friend"
                                        aria-selected="false"
                                        onClick={handleClickFriendRequests}
                                    >
                                        <i className="fas fa-user-plus me-2"></i>
                                        Lời mời kết bạn&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                        {invitationCount > 0 && activeSubTab !== "requests" && (
                                            <span className="badge">{invitationCount}</span>
                                        )}
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

            {/* Hiển thị Menu thông tin */}
            {isMenuModalOpen && selectedChat?.type === 'group' && (
                <GroupMenuModal
                    conversation={selectedChat}
                    setSelectedConversation={setSelectedChat}
                    user={MyUser?.my_user}
                    onGroupDeleted={handleGroupDeleted}
                    chatMessages={chatMessages}
                    sendMessage={sendMessage}
                    groupId={selectedChat.id}
                    onClose={() => setIsMenuModalOpen(false)}
                />
            )}

            {/* Hiển thị lại đoạn ghi âm */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Xem lại đoạn ghi âm</h3>
                        <audio controls>
                            <source src={URL.createObjectURL(audioFile)} type="audio/webm" />
                            Your browser does not support the audio element.
                        </audio>
                        <div className="modal-buttons-audio">
                            <button className="btn-audio-confirm" onClick={handleSendRecording}>Gửi</button>
                            <button className="btn-audio-cancel" onClick={handleCancelRecording}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default MainPage;