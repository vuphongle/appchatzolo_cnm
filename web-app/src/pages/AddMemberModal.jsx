import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import UserService from "../services/UserService";
import GroupService from "../services/GroupService";
import { formatPhoneNumber } from "../utils/formatPhoneNumber";
import { v4 as uuidv4 } from 'uuid';
const AddMemberModal = ({ onClose, groupId, sendMessage }) => {
    const { MyUser } = useAuth();
    const userId = MyUser?.my_user?.id;
    const [friends, setFriends] = useState([]);
    const [searchedUsers, setSearchedUsers] = useState([]); // Danh sách người dùng tìm được bằng số điện thoại
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Lấy danh sách bạn bè
    useEffect(() => {
        if (userId) {
            UserService.getFriends(userId)
                .then((data) => {
                    setFriends(Array.isArray(data) ? data : []);
                })
                .catch((err) => {
                    console.error("Error fetching friends:", err);
                });
        }
    }, [userId]);

    // Lấy danh sách thành viên nhóm
    useEffect(() => {
        if (groupId) {
            GroupService.getGroupMembers(groupId)
                .then((res) => {
                    const data = res?.data || {};
                    const members = Array.isArray(data) ? data[0]?.userGroups : data.userGroups;

                    if (members) {
                        setGroupMembers(members.map(member => member.userId));
                    } else {
                        setGroupMembers([]);
                    }
                })
                .catch((err) => console.error("Error fetching group members:", err));
        }
    }, [groupId]);

    // Tìm kiếm người dùng bằng số điện thoại khi searchTerm thay đổi
    useEffect(() => {
        const formattedPhoneNumber = formatPhoneNumber(searchTerm);
        UserService.findByPhoneNumber(formattedPhoneNumber)
            .then((data) => {
                const users = Array.isArray(data) ? data : [data];
                setSearchedUsers(users);
            })
            .catch((err) => {
                console.error("Error searching by phone number:", err);
                setSearchedUsers([]);
            });
    }, [searchTerm]);

    const memberIdSet = new Set(groupMembers.map(id => String(id)));

    const toggleSelect = (id) => {
        setSelectedFriends((prev) =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleAddMember = async () => {
        try {
            const data = {
                id: groupId,
                memberIds: selectedFriends,
            };

            await GroupService.addMember(data);
            const addedMembers = combinedList.filter(user => selectedFriends.includes(user.id));
            const memberNames = addedMembers.map(user => user.name).join(", ");
            const notificationMessage = {
                id: uuidv4(),
                senderID: groupId,
                receiverID: groupId,
                content: `Thêm thành viên ${memberNames} vào nhóm`,
                sendDate: new Date().toISOString(),
                isRead: false,
                type: "GROUP_CHAT",
                status: "Notification",
            };
            sendMessage(notificationMessage);
            alert("Thêm thành viên thành công!");
            onClose();
        } catch (error) {
            console.error("Lỗi khi thêm thành viên:", error);
            alert(error?.message || "Đã có lỗi xảy ra.");
        }
    };

    // Lọc danh sách bạn bè dựa trên tên
    const filteredFriends = friends.filter(friend => {
        const friendName = friend.name.toLowerCase();
        const searchQuery = searchTerm.toLowerCase();
        return friendName.includes(searchQuery);
    });

    // Kết hợp danh sách bạn bè và người dùng tìm được
    const combinedList = [
        ...filteredFriends,
        ...searchedUsers.filter(user => !friends.some(friend => friend.id === user.id)), // Loại bỏ trùng lặp
    ];

    return (
        <div
            className="modal show"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 1050,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}
            tabIndex="-1"
        >
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content" style={{ width: "500px", maxHeight: "90vh", overflow: "hidden" }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Thêm thành viên mới</h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control rounded-pill"
                                    placeholder="Nhập tên hoặc số điện thoại"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <hr />
                        <div className="friend-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {combinedList.length > 0 ? (
                                combinedList.map(user => {
                                    friends.some(friend => friend.id === user.id);
                                    const isMember = memberIdSet.has(String(user.id));
                                    const isSelected = isMember || selectedFriends.includes(user.id);

                                    return (
                                        <div key={user.id} className="form-check mb-3 me-3 d-flex align-items-center">
                                            <input
                                                className="form-check-input me-2 rounded-pill"
                                                type="checkbox"
                                                value={user.id}
                                                checked={isSelected}
                                                disabled={isMember}
                                                onChange={() => toggleSelect(user.id)}
                                                id={`user-${user.id}`}
                                            />
                                            <label className="form-check-label d-flex align-items-center" htmlFor={`user-${user.id}`}>
                                                <img
                                                    src={user.avatar || "default-avatar.png"}
                                                    alt={user.name}
                                                    className="rounded-circle me-2 ms-2"
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        objectFit: "cover",
                                                        filter: isMember ? "grayscale(100%)" : "none",
                                                        opacity: isMember ? 0.6 : 1
                                                    }}
                                                />
                                                <span>
                                                    {user.name}
                                                </span>
                                            </label>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted text-center">Không tìm thấy người dùng</div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button type="button" className="btn btn-primary" onClick={handleAddMember} disabled={selectedFriends.length < 1}>Thêm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;