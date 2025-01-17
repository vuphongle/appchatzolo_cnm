import React, { useState, useEffect } from "react";
import MessageService from "../services/MessageService";
import avatar_default from '../image/avatar_user.jpg';
import './ListFriend_RequestTab.css';
import { format } from 'date-fns';

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
        const [year, month, day, hour, minute, second, nano] = timestampArray;
    
        // Lưu ý tháng trong JavaScript bắt đầu từ 0 (tháng 1 là 0, tháng 12 là 11)
        const date = new Date(year, month - 1, day, hour, minute, second);
    
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
                                <button className="request-button-ok">Đồng ý</button>
                                <button className="request-button">Từ chối</button>
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
                                <button className="request-button">Thu hồi lời mời</button>
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
