import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import UserService from "../services/UserService";
import GroupService from "../services/GroupService";

const AddMemberModal = ({ onClose, groupId }) => {
    const { MyUser } = useAuth();
    const userId = MyUser?.my_user?.id;
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

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

    useEffect(() => {
        if (groupId) {
            GroupService.getGroupMembers(groupId)
                .then((res) => {
                    const data = res?.data || {};
                    const members =
                        Array.isArray(data)
                            ? data[0]?.userGroups
                            : data.userGroups;

                    if (members) {
                        setGroupMembers(members.map(member => member.userId));
                    } else {
                        setGroupMembers([]);
                    }
                })
                .catch((err) => console.error("Error fetching group members:", err));
        }
    }, [groupId]);

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

            alert("Thêm thành viên thành công!");
            onClose();
        } catch (error) {
            console.error("Lỗi khi thêm thành viên:", error);
            alert(error?.message || "Đã có lỗi xảy ra.");
        }
    };

    const filteredFriends = friends.filter(friend => {
        const friendName = friend.name.toLowerCase();
        const friendPhone = friend.phoneNumber ? friend.phoneNumber.toLowerCase() : ""; // Nếu có số điện thoại
        const searchQuery = searchTerm.toLowerCase();
        return friendName.includes(searchQuery) || friendPhone.includes(searchQuery);
    });

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
                                    className="form-control rounded-pill "
                                    placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <hr />
                        <div className="friend-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {filteredFriends.map(friend => {
                                const isMember = memberIdSet.has(String(friend.id));
                                const isSelected = isMember || selectedFriends.includes(friend.id);

                                return (
                                    <div key={friend.id} className="form-check mb-3 me-3 d-flex align-items-center">
                                        <input
                                            className="form-check-input me-2 rounded-pill"
                                            type="checkbox"
                                            value={friend.id}
                                            checked={isSelected}
                                            disabled={isMember}
                                            onChange={() => toggleSelect(friend.id)}
                                            id={`friend-${friend.id}`}
                                        />

                                        <label className="form-check-label d-flex align-items-center" htmlFor={`friend-${friend.id}`}>
                                            <img
                                                src={friend.avatar}
                                                alt={friend.name}
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
                                                {friend.name}
                                            </span>
                                        </label>
                                    </div>
                                );
                            })}
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
