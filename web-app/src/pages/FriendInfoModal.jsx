import React from "react";
import { useWebSocket } from "../context/WebSocket";

const FriendInfoModal = ({
    user,
    avatar_default,
    MyUser,
    isUserInfoModalOpen,
    setIsUserInfoModalOpen,
    closeAllModal,
    handleUserInfoModalOpen,
    isFriendRequestSent,
    isFriendRequestModalOpen,
    messageContent,
    setMessageContent,
    sendFriendRequest,
    setIsFriendRequestModalOpen,
    openChat,
}) => {


    if (!isUserInfoModalOpen || !user) return null;
    const handleMessageClick = () => {
        openChat(user); // Gọi hàm mở chat và truyền thông tin bạn bè
        setIsUserInfoModalOpen(false); // Đóng modal thông tin
    };

    const friendIds = Array.isArray(MyUser?.my_user?.friendIds) ? MyUser.my_user.friendIds : [];

    console.log("friendIds", friendIds);
    console.log("user", user.id);

    return (
        <div className="overlay" onClick={closeAllModal}>
            <div className="modal-e" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content user-info-modal">
                    <div className="modal-header">
                        <i className="fas fa-chevron-left" onClick={() => setIsUserInfoModalOpen(false)}></i>
                        <h2>Thông tin tài khoản</h2>
                        <i className="fas fa-times" onClick={closeAllModal}></i>
                    </div>
                    <div className="modal-body">
                        <div>
                            <img src={user.avatar || avatar_default} alt="Avatar" />
                            <h3>{user.name}</h3>
                        </div>

                        <div className="action-buttons">
                            {!friendIds.includes(user.id) && (
                                <button onClick={handleUserInfoModalOpen}>
                                    {isFriendRequestSent ? 'Hủy lời mời' : 'Kết bạn'}
                                </button>
                            )}
                            <button className="message-button" onClick={handleMessageClick}>Nhắn tin</button>
                        </div>

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
                            <p>Giới tính: {user.gender}</p>
                            <p>Ngày sinh: {user.dob}</p>
                            <p>Điện thoại: {user.phoneNumber}</p>
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
                            <div
                                className={`list-item ${friendIds.includes(user.id) ? "" : "disabled"}`}
                                style={{
                                    color: friendIds.includes(user.id) ? "black" : "gray",
                                    cursor: friendIds.includes(user.id) ? "pointer" : "not-allowed",
                                    opacity: friendIds.includes(user.id) ? 1 : 0.5,
                                    pointerEvents: friendIds.includes(user.id) ? "auto" : "none"
                                }}
                            >
                                <i className="fas fa-trash-alt me-2"></i>
                                <span>Xóa khỏi danh sách bạn bè</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendInfoModal;
