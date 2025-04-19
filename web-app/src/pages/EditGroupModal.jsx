import React, { useState } from "react";

const EditGroupModal = ({ conversation, onClose, onUpdateGroupInfo }) => {
    const [groupName, setGroupName] = useState(conversation.groupName);
    const [groupAvatar, setGroupAvatar] = useState(conversation.img);

    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setGroupAvatar(url); // Cập nhật avatar mới
        }
    };

    const handleSaveChanges = () => {
        onUpdateGroupInfo(conversation.id, groupName, groupAvatar); // Cập nhật thông tin nhóm
        onClose(); // Đóng modal sau khi lưu thay đổi
    };

    return (
        <div className="modal-content">
            <div className="modal-header text-center">
                <h5 className="modal-title">Chỉnh sửa thông tin nhóm</h5>
            </div>
            <div className="modal-body">
                <div className="d-flex flex-column align-items-center">
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
    );
};

export default EditGroupModal;
