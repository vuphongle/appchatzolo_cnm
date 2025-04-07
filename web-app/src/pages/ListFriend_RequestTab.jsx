import React, { useState, useEffect } from "react";
import MessageService from "../services/MessageService";
import avatar_default from '../image/avatar_user.jpg';
import './ListFriend_RequestTab.css';
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocket";
import UserService from "../services/UserService";

const FriendRequestsTab = ({ userId, friendRequests, onSelectChat }) => {
    const { MyUser, updateUserInfo } = useAuth();
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const { sendMessage, onMessage } = useWebSocket();
    const [userInfoMap, setUserInfoMap] = useState({});
    const [data, setData] = useState([]);
    const [lastFetched, setLastFetched] = useState(null); // Lưu thời gian lấy dữ liệu

    const { sendMessage, onMessage } = useWebSocket();

    // Lắng nghe khi có lời mời kết bạn mới
    useEffect(() => {
        const unsubscribe = onMessage((message) => {

            if (message.type === "WAITING_APPROVED") {
                setReceivedRequests((prev) => [...prev, message]);
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    // Lắng nghe tín hiệu thu hồi/từ chối lời mời kết bạn
    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            console.log("invitaiton message:", message);
            if (message.type === "INVITATION_REVOKE") {
                // Xử lý khi nhận thông báo xóa lời mời
                setReceivedRequests((prev) =>
                    prev.filter(
                        (request) =>
                            request.senderID !== message.senderID ||
                            request.receiverID !== message.receiverID
                    )
                );
                setSentRequests((prev) =>
                    prev.filter(
                        (request) =>
                            request.senderID !== message.senderID ||
                            request.receiverID !== message.receiverID
                    )
                );
            }

            if (message.type === "INVITATION_REFUSE") {
                setReceivedRequests((prev) =>
                    prev.filter(
                        (request) =>
                            request.senderID !== message.receiverID &&
                            request.receiverID !== message.senderID
                    )
                );

                setSentRequests((prev) =>
                    prev.filter(
                        (request) =>
                            request.senderID !== message.receiverID ||
                            request.receiverID !== message.senderID
                    )
                );
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    // Hàm chuyển đổi timestamp thành ngày tháng, chỉ đến phút
    const formatDate = (timestampArray) => {
        if (Array.isArray(timestampArray)) {
            let date = new Date(
                timestampArray[0],
                timestampArray[1] - 1,
                timestampArray[2],
                timestampArray[3],
                timestampArray[4],
                timestampArray[5],
                timestampArray[6] / 1000000
            );

            date.setHours(date.getHours() + 7);

            return date.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } else {
            // Nếu là chuỗi ISO, trả về trực tiếp
            let date = new Date(timestampArray);
            date.setHours(date.getHours() + 7);
            return date.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
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

    // Hàm xử lý từ chối lời mời kết bạn
    const handleDeleteInvitation_refuse = (senderID, receiverID) => {
        MessageService.deleteInvitation(senderID, receiverID)
            .then(() => {
                fetchRequests();  // Cập nhật lại danh sách sau khi xóa
                alert("Lời mời đã bị từ chối.");

                // Gửi thông báo qua WebSocket cho bên A
                sendMessage({
                    type: "INVITATION_REFUSE",
                    senderID: receiverID,
                    receiverID: senderID,
                });
            })
            .catch((error) => {
                console.error("Lỗi khi xóa lời mời:", error);
                alert("Đã xảy ra lỗi khi xóa lời mời.");
            });
    };

    // Hàm xử lý thu hồi lời mời kết bạn
    const handleDeleteInvitation_revoke = (senderID, receiverID) => {
        MessageService.deleteInvitation(senderID, receiverID)
            .then(() => {
                fetchRequests();  // Cập nhật lại danh sách sau khi xóa
                alert("Lời mời đã bị thu hồi.");

                // Gửi thông báo qua WebSocket cho bên B
                sendMessage({
                    type: "INVITATION_REVOKE",
                    senderID,
                    receiverID,
                });
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
                    type: "SUBMIT_FRIEND_REQUEST",
                };

                //Gửi thông báo qua WebSocket đến bên A về việc đồng ý kết bạn
                sendMessage(message);

                const sender = userInfoMap[senderId]
                onSelectChat(sender); // Chuyển đến cuộc trò chuyện với người bạn mới

            })
            .catch((error) => {
                console.error('Lỗi khi đồng ý kết bạn:', error.response || error);
                alert(`Có lỗi xảy ra khi đồng ý kết bạn: ${error.response ? error.response.data : error.message}`);
            });
    };


    const getUserInfoById = async (userId) => {
        setLoading(true);
        try {
            const user = await UserService.getUserById(userId);
            setUserInfoMap(prev => ({ ...prev, [userId]: user })); // Cập nhật thông tin người dùng vào map
        } catch (error) {
            console.error("Error fetching user info:", error);
            setUserInfoMap(prev => ({ ...prev, [userId]: { name: "Người dùng không xác định", avatar: avatar_default } }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        sentRequests.forEach(request => {
            if (!userInfoMap[request.receiverID]) {
                getUserInfoById(request.receiverID);
            }
        });
    }, [sentRequests, userInfoMap]);

    // console.log("sentRequests Requests:", sentRequests);

    useEffect(() => {
        receivedRequests.forEach(request => {
            if (!userInfoMap[request.senderID]) {
                getUserInfoById(request.senderID);
            }
        });
    }, [receivedRequests, userInfoMap]);

    // useEffect(() => {
    //     const unsubscribe = onMessage((message) => {
    //         console.log("Received message3:", message);
    //         if (message.type !== "FRIEND_REQUEST") {
    //             setReceivedRequests((prev) => {
    //                 const exists = prev.some(req => req.id === message.id);
    //                 return exists ? prev : [...prev, message];
    //             });

    //             // 🔁 Gọi fetch user info ngay khi nhận message
    //             if (!userInfoMap[message.senderID]) {
    //                 getUserInfoById(message.senderID);
    //             }
    //         }
    //     });

    //     return () => unsubscribe();
    // }, [onMessage, userInfoMap]);

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
                    receivedRequests.map((request) => {
                        const sender = userInfoMap[request.senderID] || { name: "Đang tải...", avatar: avatar_default }; // Lấy thông tin người gửi từ map
                        return (
                            <div key={request.id} className="request-item">
                                <div>
                                    <img src={sender.avatar || avatar_default} alt="Avatar" />
                                    <span>Từ: {sender.name}</span>
                                    <span>{formatDate(request.sendDate)}</span>
                                </div>
                                <div className="request-content">
                                    <span>{request.content}</span>
                                </div>
                                <div className="list-request-buttons-recieve">
                                    <button className="request-button-ok" onClick={() => handleAcceptRequest(request.senderID, userId)}>Đồng ý</button>
                                    <button className="request-button" onClick={() => handleDeleteInvitation_refuse(request.senderID, request.receiverID)}>Từ chối</button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>Không có lời mời kết bạn mới.</p>
                )}
            </div>

            {/* Danh sách lời mời đã gửi */}
            <h5 className="friend-request-header" style={{ marginTop: "10px" }}>Lời mời kết bạn đã gửi</h5>
            <div className="request-list">
                {sentRequests.length > 0 ? (
                    sentRequests.map((sentRequest) => {
                        const receiver = userInfoMap[sentRequest.receiverID] || { name: "Đang tải...", avatar: avatar_default };
                        return (
                            <div key={sentRequest.id} className="request-item">
                                <div>
                                    <img src={receiver.avatar || avatar_default} alt="Avatar" />
                                    <span>{receiver.name}</span>
                                    <span>{formatDate(sentRequest.sendDate)}</span>
                                </div>
                                <div className="request-content" style={{ backgroundColor: "#f0f0f0", padding: "5px", borderRadius: "5px" }}>
                                    <span>{sentRequest.content}</span>
                                </div>
                                <div className="list-request-buttons-sent">
                                    <button className="request-button" onClick={() => handleDeleteInvitation_revoke(sentRequest.senderID, sentRequest.receiverID)}>Thu hồi lời mời</button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>Không có lời mời kết bạn đã gửi.</p>
                )}
            </div>
        </div>
    );
};

export default FriendRequestsTab;
