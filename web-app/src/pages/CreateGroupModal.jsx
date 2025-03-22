import { useState, useEffect } from "react";
import UserService from "../services/UserService";
import { useAuth } from "../context/AuthContext";


const CreateGroupModal = ({ onClose }) => {
    const { MyUser } = useAuth();
    const userId = MyUser?.my_user?.id;
    const [friends, setFriends] = useState([
        { id: 1, name: "Nguyễn Văn A", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
        { id: 2, name: "Trần Thị B", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
        { id: 3, name: "Phạm Văn C", avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
        { id: 4, name: "Lê Hoàng D", avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
        { id: 5, name: "Đặng Thị E", avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
        { id: 6, name: "Bùi Văn F", avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
        { id: 7, name: "Lý Thanh G", avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
        { id: 8, name: "Vũ Thị H", avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
        { id: 9, name: "Ngô Minh I", avatar: "https://randomuser.me/api/portraits/men/9.jpg" },
        { id: 10, name: "Trịnh Thị J", avatar: "https://randomuser.me/api/portraits/women/10.jpg" },
        { id: 11, name: "Đỗ Quốc K", avatar: "https://randomuser.me/api/portraits/men/11.jpg" },
        { id: 12, name: "Hoàng Yến L", avatar: "https://randomuser.me/api/portraits/women/12.jpg" },
        { id: 13, name: "Lâm Tuấn M", avatar: "https://randomuser.me/api/portraits/men/13.jpg" },
        { id: 14, name: "Phan Mỹ N", avatar: "https://randomuser.me/api/portraits/women/14.jpg" },
        { id: 15, name: "Trương Đức O", avatar: "https://randomuser.me/api/portraits/men/15.jpg" }
    ]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // useEffect(() => {
    //     if (userId) {
    //         UserService.getFriends(userId)
    //             .then((data) => {
    //                 setFriends(Array.isArray(data) ? data : []);
    //             })
    //             .catch((err) => {
    //                 console.error("Error fetching friends:", err);
    //             });
    //     }
    // }, [userId]);

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
                        <button className="btn btn-primary" disabled={selectedFriends.length < 2}>Tạo nhóm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;

// {Object.entries(filteredFriends.reduce((acc, friend) => {
//     const firstLetter = friend.name[0].toUpperCase();
//     if (!acc[firstLetter]) acc[firstLetter] = [];
//     acc[firstLetter].push(friend);
//     return acc;
// }, {})).map(([letter, friends]) => (
//     <div key={letter}>
//         <h6 className="fw-bold mt-3">{letter}</h6>
//         {friends.map(friend => (
//             <div key={friend.id} className="d-flex align-items-center py-2 border-bottom">
//                 <input
//                     type="checkbox"
//                     checked={selectedFriends.includes(friend.id)}
//                     onChange={() => toggleSelect(friend.id)}
//                     className="form-check-input me-2 ms-2 rounded-pill"
//                 />
//                 <img
//                     src={friend.avatar || "default-avatar.png"}
//                     alt={friend.name}
//                     className="rounded-circle me-2 ms-2"
//                     style={{ width: "40px", height: "40px", objectFit: "cover" }}
//                 />
//                 <span className="fw-semibold">{friend.name}</span>
//             </div>
//         ))}
//     </div>
// ))}
