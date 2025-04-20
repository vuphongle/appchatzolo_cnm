import React, { useEffect, useState } from "react";
import GroupService from "../services/GroupService";
import EditGroupModal from "./EditGroupModal";

const GroupMenuModal = ({ conversation, user, onGroupDeleted, onUpdateGroupInfo, setSelectedConversation }) => {

    useEffect(() => {
        console.log("Updated conversation", conversation);
    }, [conversation]);


    const [showMembers, setShowMembers] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedNewLeader, setSelectedNewLeader] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false); // Trạng thái để mở modal chỉnh sửa

    // Mở modal chỉnh sửa
    const handleEditClick = () => {
        setIsEditingModalOpen(true);
    };

    // Đóng modal chỉnh sửa
    const closeEditModal = () => {
        setIsEditingModalOpen(false); // Đóng modal khi nhấn vào nút đóng
    };

    // Ngừng sự kiện click để không đóng modal khi nhấn vào nội dung modal
    const handleModalClick = (e) => {
        // Ngừng sự kiện nếu nhấn vào nội dung modal
        if (e.target.closest('.modal-dialog')) return;
        closeEditModal(); // Đóng modal khi nhấn ra ngoài
    };


    // Hàm xóa nhóm
    const handleDeleteGroup = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhóm này không?")) {
            try {
                // Gọi API xóa nhóm
                await GroupService.deleteGroup(user?.id, conversation.id);
                alert("Xóa nhóm thành công!");

                // Gọi callback để thông báo cho component cha
                if (onGroupDeleted) {
                    onGroupDeleted(conversation.id);
                }

            } catch (error) {
                console.error("Lỗi khi xóa nhóm:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    };

    // Hàm xóa thành viên
    const handleRemoveMember = async (targetUserId) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm không?`)) {
            try {
                await GroupService.removeMember(conversation.id, targetUserId, user?.id);
                alert("Xóa thành viên thành công!");
                // Cập nhật lại danh sách thành viên trong conversation
                setSelectedConversation((prev) => ({
                    ...prev,
                    userGroups: prev.userGroups.filter((member) => member.userId !== targetUserId),
                }));
            } catch (error) {
                console.error("Lỗi khi xóa thành viên:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    };

    // Hàm rời nhóm
    const handleLeaveGroup = async () => {
        const isLeader = userRole === "LEADER";

        if (!window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?")) return;

        if (isLeader) {
            setShowTransferModal(true); // mở modal chọn người kế nhiệm
        } else {
            try {
                await GroupService.leaveGroup(conversation.id, user?.id, "null");
                alert("Rời nhóm thành công!");
                if (onGroupDeleted) {
                    onGroupDeleted(conversation.id);
                }
            } catch (error) {
                console.error("Lỗi khi rời nhóm:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    };

    useEffect(() => {
        if (conversation.id) {
            // Lấy lại danh sách thành viên từ API khi nhóm được chọn lại
            GroupService.getGroupMembers(conversation.id)
                .then((res) => {
                    const data = res?.data || {};
                    const members = Array.isArray(data) ? data[0]?.userGroups : data.userGroups;
                    setSelectedConversation(prev => ({
                        ...prev,
                        userGroups: members, // Cập nhật lại danh sách thành viên
                    }));
                })
                .catch((err) => console.error("Lỗi khi lấy thành viên nhóm:", err));
        }
    }, [conversation.id, setSelectedConversation]); // Mỗi lần chọn lại nhóm, gọi lại API


    // Kiểm tra quyền của người dùng hiện tại
    const userRole = conversation.userGroups?.find((member) => member.userId === user?.id)?.role;

    return (
        <div className="relative">
            <div className="absolute bg-white shadow-md rounded" style={{
                width: '320px',
                maxHeight: '100vh',
                height: '750px',
                overflowY: 'auto',
                backgroundColor: 'white',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                zIndex: 10,
            }}>
                {/* Tiêu đề */}
                <h4 className="text-center fw-semibold border-bottom p-2 pt-4 pb-3" style={{ fontWeight: 'bold' }}>Thông tin nhóm</h4>

                {/* Ảnh nhóm + Tên nhóm */}
                <div className="d-flex flex-column align-items-center mt-3">
                    <img
                        src={conversation.img}
                        alt="Avatar"
                        className="rounded-circle border object-fit-cover"
                        style={{ width: "50px", height: "50px" }}
                    />
                    <div className="d-flex align-items-center justify-content-center mt-2 gap-2">
                        <p className="fw-medium mb-0 text-center">{conversation.groupName}</p>
                        <i
                            className="fas fa-pen text-secondary"
                            style={{
                                border: '2px solid #ccc',
                                backgroundColor: 'transparent',
                                padding: '10px',
                                borderRadius: '50%',
                                transition: 'background-color 0.3s ease, border-color 0.3s ease',
                                color: '#007bff',
                                width: '30px',
                                height: '30px',
                                fontSize: '10px',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f0f0f0';
                                e.target.style.borderColor = '#007bff';
                                e.target.style.color = '#0056b3';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#ccc';
                                e.target.style.color = '#007bff';
                            }}
                            onClick={handleEditClick}
                        ></i>
                    </div>

                </div>

                {/* Hành động nhóm */}
                <div className="row text-center text-muted border-bottom py-3">
                    <div className="col">
                        <i className="fas fa-user-plus"></i>
                        <div className="small">Thêm thành viên</div>
                    </div>
                    <div className="col">
                        <i className="fas fa-cog"></i>
                        <div className="small">Quản lý nhóm</div>
                    </div>
                </div>

                {/* Thành viên nhóm */}
                <div className="d-flex justify-content-between align-items-center border-bottom py-2 px-2 pt-4 pb-4" onClick={() => setShowMembers(!showMembers)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-users text-secondary"></i>
                        <span className="small">Thành viên nhóm</span>
                    </div>
                    <span className="small text-muted">{conversation.userGroups?.length} thành viên</span>

                    <style>
                        {`
                            .d-flex:hover {
                            background-color: #f0f0f0;
                            }
                        `}
                    </style>
                </div>

                {showMembers && (
                    <div className="px-3">
                        {conversation.userGroups?.map((member, index) => (
                            <div key={index} className="d-flex align-items-center gap-3 border-bottom py-2" style={{ cursor: 'pointer' }}>
                                <img
                                    src={member.avatar}
                                    alt={member.userName}
                                    className="rounded-circle"
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                                <div>
                                    <div className="fw-medium">{member.userName}</div>
                                    <div className="text-muted small">
                                        {member.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
                                    </div>
                                </div>
                                {/* Nút xóa thành viên */}
                                {(userRole === 'LEADER' || (userRole === 'CO_LEADER' && member.role === 'MEMBER')) && member.userId !== user?.id && (
                                    <i
                                        className="btn btn-danger btn-sm ms-auto"
                                        onClick={() => handleRemoveMember(member.userId)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </i>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Gạch ngang */}
                <div className="my-2" style={{ height: '8px', backgroundColor: '#ebecf0' }}></div>

                {/* Ảnh/Video */}
                <div className="px-2 py-2 pb-3">
                    <div className="fw-semibold mb-2" style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>Ảnh/Video</div>
                    <div className="d-flex gap-2 overflow-auto">
                        {conversation.media?.length > 0 ? (
                            conversation.media.map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt={`media-${index}`}
                                    className="rounded"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                />
                            ))
                        ) : (
                            <div
                                style={{
                                    textAlign: 'center', paddingLeft: '10px', paddingRight: '10px'
                                }}>
                                Chưa có Ảnh/video được chia sẻ trong nhóm này
                            </div>
                        )}
                    </div>
                </div>

                {/* Gạch ngang */}
                <div className="my-2" style={{ height: '8px', backgroundColor: '#ebecf0' }}></div>

                {/* File */}
                <div className="px-2 py-2 pb-3">
                    <div className="fw-semibold mb-2" style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>File</div>
                    <div className="d-flex gap-2 overflow-auto">
                        {conversation.file?.length > 0 ? (
                            conversation.file.map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt={`file-${index}`}
                                    className="rounded"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                />
                            ))
                        ) : (
                            <div
                                style={{
                                    textAlign: 'center', paddingLeft: '10px', paddingRight: '10px'
                                }}>
                                Chưa có File được chia sẻ trong nhóm này
                            </div>
                        )}
                    </div>
                </div>


                {/* Gạch ngang */}
                <div className="my-2" style={{ height: '8px', backgroundColor: '#ebecf0' }}></div>

                {/* Các hành động */}
                <div className="py-3 px-2 small">
                    <div className="d-flex align-items-center text-danger gap-2 pb-3 pt-3"
                        style={{ cursor: 'pointer' }}
                        onClick={handleLeaveGroup}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Rời nhóm</span>
                    </div>

                    {/* Chỉ hiển thị nếu user là người tạo nhóm */}
                    {userRole === 'LEADER' && (
                        <div className="d-flex align-items-center text-danger gap-2 mb-2 pb-3 pt-3"
                            style={{ cursor: 'pointer' }}
                            onClick={handleDeleteGroup}
                        >
                            <i className="fas fa-users-slash"></i>
                            <span>Giải tán nhóm</span>
                        </div>
                    )}
                </div>
                {showTransferModal && (
                    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content" style={{ width: "500px", maxHeight: "90vh", overflow: "hidden" }}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Chọn trưởng nhóm mới trước khi rời nhóm</h5>
                                    <i className="fas fa-times" onClick={() => setShowTransferModal(false)} style={{ cursor: "pointer" }}></i>
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
                                    {conversation.userGroups
                                        .filter(member => member.userId !== user?.id)
                                        .filter(member =>
                                            member.userName.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((member) => (
                                            <div
                                                key={member.userId}
                                                className="d-flex align-items-center gap-3 py-2 px-2"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNewLeader === member.userId}
                                                    onChange={() => setSelectedNewLeader(member.userId)}
                                                    className="form-check-input me-2 rounded-pill"
                                                />
                                                <img
                                                    src={member.avatar}
                                                    alt={member.userName}
                                                    className="rounded-circle"
                                                    style={{ width: 40, height: 40 }}
                                                />
                                                <span>{member.userName}</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>Hủy</button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!selectedNewLeader}
                                        onClick={async () => {
                                            try {
                                                await GroupService.leaveGroup(conversation.id, user?.id, selectedNewLeader);
                                                alert("Rời nhóm và chuyển quyền trưởng nhóm thành công!");
                                                setShowTransferModal(false);
                                                if (onGroupDeleted) onGroupDeleted(conversation.id);
                                            } catch (error) {
                                                console.error("Lỗi khi rời nhóm:", error);
                                                alert(error?.message || "Đã có lỗi xảy ra.");
                                            }
                                        }}
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Modal chỉnh sửa nhóm */}
            {isEditingModalOpen && (
                <div className="modal show d-flex align-items-center justify-content-center" onClick={handleModalClick}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <EditGroupModal
                            conversation={conversation}
                            onClose={closeEditModal}
                            onUpdateGroupInfo={onUpdateGroupInfo}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// // Modal chỉnh sửa nhóm
// const EditGroupModal = ({ conversation, onClose, onUpdateGroupInfo }) => {
//     const [groupName, setGroupName] = useState(conversation.groupName);
//     const [groupAvatar, setGroupAvatar] = useState(conversation.img);

//     const handleGroupNameChange = (e) => {
//         setGroupName(e.target.value);
//     };

//     const handleAvatarChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             const url = URL.createObjectURL(file);
//             setGroupAvatar(url);
//         }
//     };

//     const handleSaveChanges = () => {
//         // Cập nhật thông tin nhóm
//         onUpdateGroupInfo(groupName, groupAvatar);
//         onClose();
//     };

//     return (
//         <div className="modal show d-flex align-items-center justify-content-center" onClick={onClose}>
//             <div className="modal-dialog modal-dialog-centered">
//                 <div className="modal-content" style={{ width: "400px" }}>
//                     <div className="modal-header">
//                         <h5 className="modal-title">Chỉnh sửa thông tin nhóm</h5>
//                         <button type="button" className="close" onClick={onClose}>×</button>
//                     </div>
//                     <div className="modal-body">
//                         <div className="d-flex flex-column align-items-center">
//                             {/* Hiển thị avatar */}
//                             <img
//                                 src={groupAvatar}
//                                 alt="Avatar"
//                                 className="rounded-circle"
//                                 style={{ width: "80px", height: "80px", objectFit: "cover" }}
//                             />
//                             <input
//                                 type="file"
//                                 accept="image/*"
//                                 onChange={handleAvatarChange}
//                                 className="mt-2 mb-3"
//                             />
//                             <input
//                                 type="text"
//                                 value={groupName}
//                                 onChange={handleGroupNameChange}
//                                 className="form-control mb-2"
//                                 placeholder="Tên nhóm"
//                             />
//                         </div>
//                     </div>
//                     <div className="modal-footer">
//                         <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
//                         <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>Lưu thay đổi</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

export default GroupMenuModal;