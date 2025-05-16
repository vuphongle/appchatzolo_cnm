import React, { useState } from "react";
import AuthService from "../services/AuthService";
import showToast from "../utils/AppUtils";

const ChangePasswordModal = ({ user, onClose, logout }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const validatePassword = (pass) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(pass);
    };


    const handleChangePassword = () => {
        setError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!");
            return;
        }

        if (!validatePassword(newPassword)) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
            return;
        }

        AuthService.post('/change-password', {
            username: user.phoneNumber,
            currentPassword,
            newPassword
        })
            .then(response => {
                console.log("Password changed successfully:", response.data);
                showToast("Đổi mật khẩu thành công!", "success");
                onClose();
                logout();
            })
            .catch(error => {
                console.error("Error changing password:", error);
                setError("Mật khẩu hiện tại không chính xác!");
            });
    };

    return (
        <div>
            <div className="modal show d-flex align-items-center justify-content-center" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content" style={{ width: "500px", maxHeight: "90vh", overflow: "hidden" }}>
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Đổi mật khẩu</h5>
                            <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                        </div>
                        <div className="modal-body text-start">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="currentPassword" className="form-label">Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </form>
                            {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={handleChangePassword}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
