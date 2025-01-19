import React, { useState, useEffect } from "react";
import MessageService from "../services/MessageService";
import avatar_default from '../image/avatar_user.jpg';
import './ListFriend_RequestTab.css';

const FriendRequestsTab = ({ userId }) => {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);  // Thêm trạng thái loading
    const [error, setError] = useState(null);      // Thêm trạng thái lỗi

    // Hàm chuyển đổi timestamp thành ngày tháng, chỉ đến giây
    const formatDate = (timestampArray) => {
        // Kiểm tra mảng đầu vào
        if (!Array.isArray(timestampArray) || timestampArray.length !== 7) {
            return 'Ngày không hợp lệ';
        }

        // Lấy các phần tử từ mảng timestamp
        const [year, month, day, hour, minute, second] = timestampArray;

        // Lưu ý tháng trong JavaScript bắt đầu từ 0 (tháng 1 là 0, tháng 12 là 11)
        const date = new Date(year, month - 1, day, hour + 7, minute, second);

        // Kiểm tra nếu ngày không hợp lệ
        if (isNaN(date)) {
            return 'Ngày không hợp lệ';
        }

        // Định dạng ngày giờ (chỉ đến giây)
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Hiển thị danh sách lời mời đã nhận và đã gửi
    useEffect(() => {
        if (!userId) {
            setError('User ID is missing!');
            setLoading(false);
            return;
        }

        // Lấy lời mời kết bạn đã nhận
        MessageService.get(`/invitations/received/${userId}`)
            .then((data) => {
                console.log('Dữ liệu lời mời nhận được:', data);
                setReceivedRequests(data);
            })
            .catch((error) => {
                console.error('Lỗi khi lấy dữ liệu lời mời đã nhận:', error);
                setError('Lỗi khi lấy dữ liệu lời mời đã nhận');
            });

        // Lấy lời mời kết bạn đã gửi
        MessageService.get(`/invitations/sent/${userId}`)
            .then((data) => {
                console.log('Dữ liệu lời mời đã gửi:', data);
                setSentRequests(data);
            })
            .catch((error) => {
                console.error('Lỗi khi lấy lời mời đã gửi:', error);
                setError('Lỗi khi lấy lời mời đã gửi');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId]);

    // const fetchRequests = () => {
    //     // Gọi lại các API để tải lại danh sách lời mời
    //     MessageService.get(`/invitations/received/${userId}`)
    //         .then((data) => {
    //             setReceivedRequests(data);
    //         })
    //         .catch((error) => {
    //             setError('Lỗi khi lấy dữ liệu lời mời đã nhận');
    //         });

    //     MessageService.get(`/invitations/sent/${userId}`)
    //         .then((data) => {
    //             setSentRequests(data);
    //         })
    //         .catch((error) => {
    //             setError('Lỗi khi lấy lời mời đã gửi');
    //         });
    // };

    // Hàm xử lý xóa, thu hồi lời mời kết bạn
    const handleDeleteInvitation = (senderID, receiverID) => {
        MessageService.deleteInvitation(senderID, receiverID)
            .then(() => {
                // Cập nhật lại trạng thái sau khi xóa thành công
                setReceivedRequests((prevRequests) => prevRequests.filter((request) => request.senderID !== senderID || request.receiverID !== receiverID));
                setSentRequests((prevRequests) => prevRequests.filter((request) => request.senderID !== senderID || request.receiverID !== receiverID));
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
                //fetchRequests();
            })
            .catch((error) => {
                console.error('Lỗi khi đồng ý kết bạn:', error.response || error);
                alert(`Có lỗi xảy ra khi đồng ý kết bạn: ${error.response ? error.response.data : error.message}`);
            });
    };


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
