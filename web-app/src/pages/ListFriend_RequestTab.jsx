import React, { useState, useEffect } from "react";
import MessageService from "../services/MessageService";
import avatar_default from '../image/avatar_user.jpg';
import './ListFriend_RequestTab.css';
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocket";
import UserService from "../services/UserService";

const FriendRequestsTab = ({ userId, friendRequests }) => {
    const { MyUser, updateUserInfo } = useAuth();
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { sendMessage, onMessage } = useWebSocket();

    // Hàm chuyển đổi timestamp thành ngày tháng, chỉ đến giây
    const formatDate = (timestampArray) => {
        // Chuyển đổi thành đối tượng Date
        let date = new Date(timestampArray);

        // Cộng 7 giờ vào thời gian nhận từ DynamoDB để chuyển về múi giờ của bạn
        date.setHours(date.getHours() + 7);

        // Trả về định dạng ngày giờ theo múi giờ của bạn
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const fetchRequests = () => {
        setLoading(true);

        // Lấy lời mời kết bạn đã nhận
        MessageService.get(`/invitations/received/${userId}`)
            .then((data) => {
                setReceivedRequests(data);
            })
            .catch((error) => {
                setError('Lỗi khi lấy dữ liệu lời mời đã nhận');
            });

        // Lấy lời mời kết bạn đã gửi
        MessageService.get(`/invitations/sent/${userId}`)
            .then((data) => {
                setSentRequests(data);
            })
            .catch((error) => {
                setError('Lỗi khi lấy lời mời đã gửi');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRequests();
    }, [friendRequests]);

    // Hàm xử lý xóa, thu hồi lời mời kết bạn
    const handleDeleteInvitation = (senderID, receiverID) => {
        MessageService.deleteInvitation(senderID, receiverID)
            .then(() => {
                fetchRequests();  // Cập nhật lại danh sách sau khi xóa
                alert("Lời mời đã bị thu hồi hoặc từ chối.");
            })
            .catch((error) => {
                console.error("Lỗi khi xóa lời mời:", error);
                alert("Đã xảy ra lỗi khi xóa lời mời.");
            });
    };

    // Hàm xử lý chấp nhận lời mời kết bạn
    const handleAcceptRequest = (senderId, receiverId) => {
        MessageService.post(`/acceptFriendRequest/${senderId}/${receiverId}`)
            .then((response) => {
                alert(response);
                fetchRequests();

                const updatedUserData_receiver = {
                    ...MyUser,
                    my_user: {
                        ...MyUser.my_user,
                        friendIds: [...MyUser.my_user.friendIds, senderId],
                    },
                };
                updateUserInfo(updatedUserData_receiver);

                const message = {
                    id: new Date().getTime().toString(),
                    senderID: receiverId,
                    receiverID: senderId,
                    content: "Tôi đã chấp nhận lời mời kết bạn của bạn.",
                    sendDate: new Date().toISOString(),
                    isRead: false,
                };

                // Gửi thông báo qua WebSocket đến bên A về việc đồng ý kết bạn
                sendMessage(message);

            })
            .catch((error) => {
                console.error('Lỗi khi đồng ý kết bạn:', error.response || error);
                alert(`Có lỗi xảy ra khi đồng ý kết bạn: ${error.response ? error.response.data : error.message}`);
            });
    };

    // Kiểm tra nếu đang tải dữ liệu hoặc có lỗi
    if (loading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="friend-requests-container">
            {/* Danh sách lời mời đã nhận */}
            <h5 className="friend-request-header">Lời mời kết bạn đã nhận</h5>
            <div className="request-list">
                {receivedRequests.length > 0 ? (
                    receivedRequests.map((request) => (
                        <div key={request.id} className="request-item">
                            <div>
                                <img src={request.avatar || avatar_default} alt="Avatar" />
                                <span>{request.name}</span>
                                <span>{formatDate(request.sendDate)}</span>
                            </div>
                            <div className="request-content">
                                <span>{request.content}</span>
                            </div>
                            <div className="list-request-buttons-recieve">
                                <button className="request-button-ok" onClick={() => handleAcceptRequest(request.senderID, userId)}>Đồng ý</button>
                                <button className="request-button" onClick={() => handleDeleteInvitation(request.senderID, request.receiverID)} >Từ chối</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không có lời mời kết bạn mới.</p>
                )}
            </div>

            {/* Danh sách lời mời đã gửi */}
            <h5 className="friend-request-header" style={{ marginTop: "10px" }}>Lời mời kết bạn đã gửi</h5>
            <div className="request-list">
                {sentRequests.length > 0 ? (
                    sentRequests.map((sentRequest) => (
                        <div key={sentRequest.id} className="request-item">
                            <div>
                                <img src={sentRequest.avatar || avatar_default} alt="Avatar" />
                                <span>{sentRequest.name}</span>
                                <span>{formatDate(sentRequest.sendDate)}</span>
                            </div>
                            <div className="request-content">
                                <span>{sentRequest.content}</span>
                            </div>
                            <div className="list-request-buttons-sent">
                                <button className="request-button" onClick={() => handleDeleteInvitation(sentRequest.senderID, sentRequest.receiverID)}>Thu hồi lời mời</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không có lời mời kết bạn đã gửi.</p>
                )}
            </div>
        </div>
    );
};

export default FriendRequestsTab;
