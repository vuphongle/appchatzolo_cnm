import React, { useState } from "react";
import '../css/EditGroupModal.css'; // Import CSS file for styling
import S3Service from "../services/S3Service";
import GroupService from "../services/GroupService";

const EditGroupModal = ({ conversation, onClose }) => {
    const [groupName, setGroupName] = useState(conversation.groupName);
    const [groupAvatar, setGroupAvatar] = useState(conversation.img);
    const [groupImage, setGroupImage] = useState(null);

    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setGroupAvatar(url); // Cập nhật avatar mới
            setGroupImage(file);
        }
    };

    const handleSaveChanges = async () => {
        let imageUrl = groupAvatar;
        if (groupAvatar !== conversation.img) {
            try {
                imageUrl = await S3Service.uploadImage(groupImage);
            } catch (error) {
                alert("Có lỗi khi tải ảnh lên.");
                return;
            }
        }
        try {
            // Gọi API cập nhật nhóm
            const group = {
                id: conversation.id,
                groupName: groupName,
                image: imageUrl,
                creatorId: conversation.creatorId,
            }
            await GroupService.updateGroup(group);

        } catch (error) {
            console.error("Lỗi khi cập nhật nhóm:", error);
            alert(error?.message || "Đã có lỗi xảy ra.");
        }
        onClose(); // Đóng modal sau khi lưu thay đổi
    };

    return (
        <div className="modal-overlay" >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Chỉnh sửa thông tin nhóm</h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>
                    <div className="modal-body">
                        <div className="d-flex flex-column align-items-center p-2">
                            <img
                                src={groupAvatar}
                                alt="Avatar"
                                className="rounded-circle"
                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="mt-2 mb-3"
                            />
                            <input
                                type="text"
                                value={groupName}
                                onChange={handleGroupNameChange}
                                className="form-control mb-2"
                                placeholder="Tên nhóm"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>Lưu thay đổi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditGroupModal;
