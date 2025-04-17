import { useState, useEffect } from "react";
import UserService from "../services/UserService";
import { useAuth } from "../context/AuthContext";
import GroupService from "../services/GroupService";


const CreateGroupModal = ({ onClose }) => {
    const { MyUser } = useAuth();
    const userId = MyUser?.my_user?.id;
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
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

    const toggleSelect = (id) => {
        setSelectedFriends((prev) =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleModalClick = (e) => {
        // Ngăn không cho đóng modal khi click vào trong nội dung modal
        if (e.target.closest('.modal-dialog')) return;
        onClose();
    };

    const handlerCreateGroup = async () => {
        const groupName = document.querySelector('input[placeholder="Nhập tên nhóm..."]').value.trim();

        if (!groupName) {
            alert("Vui lòng nhập tên nhóm.");
            return;
        }

        if (selectedFriends.length < 2) {
            alert("Vui lòng chọn ít nhất 2 bạn bè để tạo nhóm.");
            return;
        }

        const defaultImage = "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"; // ảnh mặc định

        const requestBody = {
            groupName: groupName,
            image: defaultImage,
            creatorId: userId,
            memberIds: selectedFriends
        };

        try {
            const response = await GroupService.post("/create", requestBody);
            console.log("Nhóm được tạo:", response);
            // Cập nhật danh sách nhóm trong context hoặc state nếu cần


            alert("Tạo nhóm thành công");
            onClose(); // Đóng modal sau khi tạo
        } catch (err) {
            console.error("Lỗi khi tạo nhóm:", err);
            alert("Có lỗi xảy ra khi tạo nhóm");
        }
    };


    return (
        <div className="modal show d-flex align-items-center justify-content-center" onClick={handleModalClick} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content" style={{ width: "500px", maxHeight: "90vh", overflow: "hidden" }}>
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Tạo nhóm</h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>
                    <div className="modal-body" style={{ flexGrow: 1, overflowY: "auto" }}>
                        <div className="mb-3">
                            <div className="d-flex align-items-center">
                                <div
                                    className="bg-light rounded-circle shadow-sm d-flex justify-content-center align-items-center me-2"
                                    style={{ width: "50px", height: "50px", cursor: "pointer", border: "1px solid #ddd" }}
                                >
                                    <i className="fas fa-camera text-secondary" style={{ fontSize: "24px" }}></i>
                                </div>
                                <input
                                    type="text"
                                    className="form-control border-0 border-bottom"
                                    placeholder="Nhập tên nhóm..."
                                    style={{ borderRadius: "0", outline: "none", fontSize: "18px" }}
                                />
                            </div>
                        </div>
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
                            {filteredFriends.map(friend => (
                                <div key={friend.id} className="d-flex align-items-center py-2 border-bottom">
                                    <input
                                        type="checkbox"
                                        checked={selectedFriends.includes(friend.id)}
                                        onChange={() => toggleSelect(friend.id)}
                                        className="form-check-input me-2 ms-2 rounded-pill"
                                    />
                                    <img
                                        src={friend.avatar}
                                        alt={friend.name}
                                        className="rounded-circle me-2 ms-2"
                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                    />
                                    <span className="fw-semibold">{friend.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button className="btn btn-primary" disabled={selectedFriends.length < 2} onClick={handlerCreateGroup}>Tạo nhóm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
