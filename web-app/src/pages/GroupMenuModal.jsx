import React, { useState, useEffect, use } from "react";
import GroupService from "../services/GroupService";
import EditGroupModal from "./EditGroupModal";
import showToast from "../utils/AppUtils";
import axios from 'axios';
import AddMemberModal from "./AddMemberModal";
import { v4 as uuidv4 } from 'uuid';

const GroupMenuModal = ({ conversation, user, onGroupDeleted, setSelectedConversation, chatMessages, sendMessage, groupId }) => {

    // console.log("Group info", conversation);

    const [showMembers, setShowMembers] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedNewLeader, setSelectedNewLeader] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false); // Trạng thái để mở modal chỉnh sửa
    const [showGroupManagementModal, setShowGroupManagementModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [imageInfo, setImageInfo] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalMemberOpen, setIsModalMemberOpen] = useState(false);
    const handleCloseMemberModal = () => {
        setIsModalMemberOpen(false);
    };


    // State để lưu trạng thái checkbox đã chọn
    const [checkboxState, setCheckboxState] = useState({
        changeGroupName: false,
        pinMessage: false,
        createPost: false
    });

    // Mở modal chỉnh sửa
    const handleEditClick = () => {
        setIsEditingModalOpen(true);
    };

    // Đóng modal chỉnh sửa
    const closeEditModal = () => {
        setIsEditingModalOpen(false); // Đóng modal khi nhấn vào nút đóng
    };

    // Hàm mở modal quản lý nhóm
    const handleGroupManagementClick = () => {
        setShowGroupManagementModal(true);
    };

    // Hàm đóng modal quản lý nhóm
    const closeGroupManagementModal = () => {
        setShowGroupManagementModal(false);
    };

    // Ngừng sự kiện click để không đóng modal khi nhấn vào nội dung modal
    const handleModalClick = (e) => {
        // Ngừng sự kiện nếu nhấn vào nội dung modal
        if (e.target.closest('.modal-dialog')) return;
        closeEditModal(); // Đóng modal khi nhấn ra ngoài
    };

    // Hàm xử lý sự kiện khi thay đổi checkbox
    const handleCheckboxChange = (event) => {
        const { id, checked } = event.target;
        setCheckboxState(prevState => ({
            ...prevState,
            [id]: checked // Cập nhật trạng thái của checkbox
        }));
    };

    const handleSave = async () => {
        closeGroupManagementModal()
    }


    // Hàm lấy media và file từ chatMessages
    const getMediaFromMessages = () => {
        const media = [];
        const files = [];
        chatMessages.forEach((msg) => {
            // Kiểm tra nếu tin nhắn là ảnh, video, hoặc file
            if (msg.content?.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$/i)) {
                media.push(msg.content);
            } else if (msg.content?.match(/\.(mp4|wmv)$/i)) {
                media.push(msg.content);
            } else if (msg.content?.match(/\.(mov|webm|mp3|wav|ogg|ppdf|doc|docx|ppt|mpp|pptx|xls|xlsx|csv|txt|odt|ods|odp|json|xml|yaml|yml|ini|env|conf|cfg|toml|properties|java|js|ts|jsx|tsx|c|cpp|cs|py|rb|go|php|swift|rs|kt|scala|sh|bat|ipynb|h5|pkl|pb|ckpt|onnx|zip|rar|tar|gz|7z|jar|war|dll|so|deb|rpm|apk|ipa|whl|html|htm|css|scss|sass|vue|md|sql|.mobileprovision)$/i)) {
                files.push(msg.content);
            }
        });
        return { media, files };
    };

    const { media, files } = getMediaFromMessages();
    // Hàm cắt bỏ phần trước dấu _ đầu tiên trong tên file
    const getFileNameWithoutPrefix = (filePath) => {
        // Tìm chỉ số của dấu _
        const firstUnderscoreIndex = filePath.indexOf('_');
        if (firstUnderscoreIndex === -1) {
            // Nếu không có dấu _ trong tên, trả về tên file nguyên gốc
            return filePath;
        }
        // Cắt chuỗi từ sau dấu _ đầu tiên
        return filePath.slice(firstUnderscoreIndex + 1);
    };

    // Hàm mở modal và hiển thị ảnh
    const handleImageClick = (src, message) => {
        setSelectedImage(src);
        setImageInfo({
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            sendDate: message.sendDate,
        });
        setShowModal(true);
    };

    // Hàm đóng modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedImage(null);
        setImageInfo(null);
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
                // Cập nhật lại danh sách thành viên trong conversation

                setSelectedConversation((prev) => ({
                    ...prev,
                    userGroups: prev.userGroups.filter((member) => member.userId !== targetUserId),
                }));
                const removedUser = conversation.userGroups.find(member => member.userId === targetUserId);
                const removedUserName = removedUser?.userName || "Một thành viên";

                const notificationMessage = {
                    id: uuidv4(),
                    senderID: groupId,
                    receiverID: groupId,
                    content: `${removedUserName} đã bị xóa khỏi nhóm`,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                    type: "GROUP_CHAT",
                    status: "Notification",
                };
                sendMessage(notificationMessage);
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
                const notificationMessage = {
                    id: uuidv4(),
                    senderID: groupId,
                    receiverID: groupId,
                    content: `${user.name} đã rời khỏi nhóm`,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                    type: "GROUP_CHAT",
                    status: "Notification",
                };
                sendMessage(notificationMessage);
            } catch (error) {
                console.error("Lỗi khi rời nhóm:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    };

    // Hàm thêm phó nhóm
    const handleAddCoLeader = async (targetUserId) => {
        if (window.confirm(`Bạn có chắc chắn muốn thêm thành viên này làm phó nhóm không?`)) {
            ;
            try {
                const data = {
                    groupId: conversation.id,
                    targetUserId: targetUserId,
                    promoterId: user?.id
                };

                const promotedUser = conversation.userGroups.find(member => member.userId === targetUserId);
                const promotedUserName = promotedUser?.userName || "Một thành viên";

                await GroupService.promoteToCoLeader(data);
                const notificationMessage = {
                    id: uuidv4(),
                    senderID: groupId,
                    receiverID: groupId,
                    content: `${promotedUserName} đã được thăng cấp lên phó nhóm`,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                    type: "GROUP_CHAT",
                    status: "Notification",
                };
                sendMessage(notificationMessage);
            } catch (error) {
                console.error("Lỗi khi cấp quyền phó nhóm:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    }

    // Hàm giáng trưởng nhóm xuống thành viên
    const handleRemoveCoLeader = async (targetUserId) => {
        if (window.confirm(`Bạn có chắc chắn muốn gỡ phó nhóm này không?`)) {
            try {
                const data = {
                    groupId: conversation.id,
                    targetUserId: targetUserId,
                    promoterId: user?.id
                };

                await GroupService.demoteToMember(data);
                const demotedUser = conversation.userGroups.find(member => member.userId === targetUserId);
                const demotedUserName = demotedUser?.userName || "Một thành viên";
                const notificationMessage = {
                    id: uuidv4(),
                    senderID: groupId,
                    receiverID: groupId,
                    content: `${demotedUserName} đã bị hạ cấp thành viên`,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                    type: "GROUP_CHAT",
                    status: "Notification",
                };
                sendMessage(notificationMessage);
            } catch (error) {
                console.error("Lỗi khi gỡ phó nhóm:", error);
                alert(error?.message || "Đã có lỗi xảy ra.");
            }
        }
    };

    // Hàm bổ nhiệm trưởng nhóm mới
    const handlePromoteToLeader = async (targetUserId) => {
        if (window.confirm(`Bạn có chắc chắn muốn bổ nhiệm thành viên này làm trưởng nhóm không?`)) {
            try {
                const data = {
                    groupId: conversation.id,
                    targetUserId: targetUserId,
                    promoterId: user?.id
                };
                await GroupService.promoteToLeader(data);
                const promotedUser = conversation.userGroups.find(member => member.userId === targetUserId);
                const promotedUserName = promotedUser?.userName || "Một thành viên";
                const notificationMessage = {
                    id: uuidv4(),
                    senderID: groupId,
                    receiverID: groupId,
                    content: `${promotedUserName} đã được thăng cấp lên trưởng nhóm`,
                    sendDate: new Date().toISOString(),
                    isRead: false,
                    type: "GROUP_CHAT",
                    status: "Notification",
                };
                sendMessage(notificationMessage);
            } catch (error) {
                console.error("Lỗi khi bổ nhiệm trưởng nhóm:", error);
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
    const userRole = conversation.userGroups.find((member) => member.userId === user?.id)?.role;

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
                    <div className="col" onClick={() => setIsModalMemberOpen(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-user-plus"></i>
                        <div className="small">Thêm thành viên</div>
                    </div>
                    {isModalMemberOpen && (
                        <AddMemberModal
                            onClose={handleCloseMemberModal}
                            groupId={conversation.id}
                            setSelectedConversation={setSelectedConversation}
                            conversation={conversation}
                        />
                    )}
                    <div className="col" onClick={handleGroupManagementClick} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-cog"></i>
                        <div className="small">Quản lý nhóm</div>
                    </div>
                </div>

                {/* Modal quản lý nhóm */}
                {showGroupManagementModal && (
                    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="modal-dialog">
                            <div className="modal-content" style={{ width: "550px", top: '150px', maxHeight: "90vh", overflow: "hidden" }}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Quản lý nhóm</h5>
                                    <i className="fas fa-times" onClick={closeGroupManagementModal} style={{ cursor: "pointer" }}></i>
                                </div>
                                <div className="modal-body">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="changeGroupName"
                                            checked={checkboxState.changeGroupName}
                                            onChange={handleCheckboxChange}
                                            disabled={userRole !== 'LEADER'} // Chỉ cho LEADER được tick
                                        />
                                        <label className="form-check-label" htmlFor="changeGroupName" style={{ textAlign: 'left' }}>
                                            &nbsp;&nbsp;Chỉ nhóm trưởng có thể thay đổi thông tin nhóm
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="pinMessage"
                                            checked={checkboxState.pinMessage}
                                            onChange={handleCheckboxChange}
                                            disabled={userRole !== 'LEADER'} // Chỉ cho LEADER được tick
                                        />
                                        <label className="form-check-label" htmlFor="pinMessage" style={{ textAlign: 'left' }}>
                                            &nbsp;&nbsp;Chỉ nhóm trưởng được thêm thành viên
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="createPost"
                                            checked={checkboxState.createPost}
                                            onChange={handleCheckboxChange}
                                            disabled={userRole !== 'LEADER'} // Chỉ cho LEADER được tick
                                        />
                                        <label className="form-check-label" htmlFor="createPost" style={{ textAlign: 'left' }}>
                                            &nbsp;&nbsp;Nhóm phó được xóa thành viên
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={closeGroupManagementModal}>Hủy</button>
                                    <button className="btn btn-primary" onClick={handleSave}>Lưu</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Thành viên nhóm */}
                <div className="d-flex justify-content-between align-items-center border-bottom py-2 px-2 pt-4 pb-4" onClick={() => setShowMembers(!showMembers)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-users text-secondary"></i>
                        <span className="small">Thành viên nhóm</span>
                    </div>
                    <span className="small text-muted">{conversation.userGroups.length} thành viên</span>

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
                                        {member.role === 'LEADER'
                                            ? 'Trưởng nhóm'
                                            : member.role === 'CO_LEADER'
                                                ? 'Phó nhóm'
                                                : 'Thành viên'}
                                    </div>
                                </div>

                                {/* Nút ba chấm */}
                                {(userRole === 'LEADER' || userRole === 'CO_LEADER') && member.userId !== user?.id && member.role !== 'LEADER' && (
                                    <div className="ms-auto">
                                        <button
                                            className="btn btn-light btn-sm"
                                            style={{ cursor: 'pointer', width: '30px' }}
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            <i className="fas fa-ellipsis-h" style={{ marginRight: '20px' }}></i> {/* Icon ba chấm */}
                                        </button>
                                        <ul className="dropdown-menu">
                                            {userRole === 'LEADER' && (
                                                <li>
                                                    <a className="dropdown-item" href="#" onClick={() => handlePromoteToLeader(member.userId)}>
                                                        Bổ nhiệm nhóm trưởng
                                                    </a>
                                                </li>
                                            )}

                                            {/* Nếu member là 'MEMBER', hiển thị 'Thêm phó nhóm' */}
                                            {(member.role === 'MEMBER' && userRole === 'LEADER') && (
                                                <li>
                                                    <a className="dropdown-item" href="#" onClick={() => handleAddCoLeader(member.userId)}>
                                                        Thêm phó nhóm
                                                    </a>
                                                </li>
                                            )}

                                            {/* Nếu member là 'CO_LEADER', hiển thị 'Gỡ phó nhóm' */}
                                            {(member.role === 'CO_LEADER' && userRole === 'LEADER') && (
                                                <li>
                                                    <a className="dropdown-item text-danger" href="#" onClick={() => handleRemoveCoLeader(member.userId)}>
                                                        Gỡ phó nhóm
                                                    </a>
                                                </li>
                                            )}

                                            {/* Thêm nút xóa thành viên */}
                                            {(userRole === 'LEADER' || userRole === 'CO_LEADER') && (
                                                <li>
                                                    <a className="dropdown-item text-danger" href="#" onClick={() => handleRemoveMember(member.userId)}>
                                                        Xóa thành viên
                                                    </a>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}


                            </div>
                        ))}

                    </div>
                )}

                {/* Gạch ngang */}
                <div className="my-2" style={{ height: '8px', backgroundColor: '#ebecf0' }}></div>

                {/* Ảnh/Video */}
                {/* Ảnh/Video */}
                <div className="px-2 py-2 pb-3">
                    <div className="fw-semibold mb-2" style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>Ảnh/Video</div>
                    <div className="d-flex gap-2 overflow-auto">
                        {media?.length > 0 ? (
                            media.map((src, index) => {
                                // Tìm message tương ứng với ảnh (Giả sử src là message content)
                                const message = chatMessages.find(msg => msg.content === src);
                                return (
                                    <img
                                        key={index}
                                        src={src}
                                        alt={`media-${index}`}
                                        className="rounded"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            cursor: 'pointer', // Hiện con trỏ pointer khi di chuột vào ảnh
                                        }}
                                        onClick={() => handleImageClick(src, message)} // Click vào ảnh để mở modal
                                    />
                                );
                            })
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

                {/* Modal xem ảnh */}
                {showModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }} onClick={closeModal}>
                        <div className="modal-content" style={{
                            backgroundColor: 'white', padding: '20px', borderRadius: '10px', maxWidth: '80%', textAlign: 'center'
                        }} onClick={e => e.stopPropagation()}>
                            <img src={selectedImage} alt="large-view" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                            <div style={{ marginTop: '15px' }}>
                                <img src={imageInfo?.senderAvatar} alt="avatar" className="rounded-circle" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                                <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{imageInfo?.senderName}</span>
                                <div style={{ fontSize: '12px', color: '#555' }}>{new Date(imageInfo?.sendDate).toLocaleString()}</div>
                            </div>
                            <button onClick={closeModal} style={{
                                marginTop: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
                            }}>Đóng</button>
                        </div>
                    </div>
                )}

                {/* Gạch ngang */}
                <div className="my-2" style={{ height: '8px', backgroundColor: '#ebecf0' }}></div>

                {/* File */}
                <div className="px-2 py-2 pb-3">
                    <div className="fw-semibold mb-2" style={{ color: 'black', fontSize: '18px', fontWeight: 'bold' }}>File</div>
                    <div className="d-flex flex-column gap-2 overflow-y-auto no-hover" style={{ maxHeight: '150px', height: '150px', overflowY: 'auto', }}>
                        {files?.length > 0 ? (
                            files.map((src, index) => (
                                <div key={index} className="d-flex align-items-center justify-content-between file-message">
                                    <div className="d-flex align-items-center">
                                        <span className="file-icon">
                                            <i className="fa fa-file-alt"></i>
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: '10px',
                                                maxWidth: '160px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {getFileNameWithoutPrefix(src.split('/').pop())}
                                        </span>
                                    </div>

                                    {/* Nút tải xuống */}
                                    <div className="d-flex justify-content-end">
                                        <a href={src} download className="btn btn-blue">
                                            <button className="download-btn" style={{ marginLeft: 'auto', padding: '3px 5px', fontSize: '12px', height: '30px' }}>Tải xuống</button>
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', paddingLeft: '10px', paddingRight: '10px', top: '30px', justifyContent: 'center', alignItems: 'center', display: 'flex', height: '100%' }}>
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
                    {userRole == 'LEADER' && (
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
                <div className="modal-overlay show" onClick={handleModalClick}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <EditGroupModal
                            conversation={conversation}
                            onClose={closeEditModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupMenuModal;