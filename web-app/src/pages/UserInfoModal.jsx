import React, { useState, useMemo, useEffect } from "react";
import UserService from "../services/UserService";
import S3Service from "../services/S3Service";
import { useAuth } from "../context/AuthContext";

const UserInfoModal = ({ user: initialUser, onClose }) => {
    const { MyUser, setMyUser, updateUserInfo } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatar, setAvatar] = useState(MyUser?.avatar || initialUser?.avatar || null);
    const [file, setFile] = useState(null);
    const [originalAvatar, setOriginalAvatar] = useState(MyUser?.avatar || initialUser?.avatar || null);
    const [name, setName] = useState(MyUser?.my_user?.name || MyUser?.name || initialUser?.name || "");
    const [dob, setDob] = useState(
        MyUser?.dob || initialUser?.dob || MyUser?.my_user?.dob
            ? new Date(MyUser?.dob || initialUser?.dob || MyUser?.my_user?.dob).toISOString().split("T")[0]
            : ""
    );

    useEffect(() => {
        const currentUser = MyUser || initialUser;
        if (currentUser) {
            setAvatar(currentUser.avatar || currentUser.my_user?.avatar || null);
            setName(currentUser.name || currentUser.my_user?.name || "");
            setDob(
                currentUser.dob || currentUser.my_user?.dob
                    ? new Date(currentUser.dob || currentUser.my_user?.dob).toISOString().split("T")[0]
                    : ""
            );
        }
    }, [MyUser, initialUser]);

    // Kiểm tra dữ liệu có thay đổi không
    const isChanged = useMemo(
        () =>
            name !== (MyUser?.name || initialUser?.name || "") ||
            dob !==
            ((MyUser?.dob || initialUser?.dob)
                ? new Date(MyUser?.dob || initialUser?.dob).toISOString().split("T")[0]
                : ""),
        [name, dob, MyUser, initialUser]
    );

    const handleUpdateInfo = async () => {
        try {
            if (!MyUser?.my_user?.id) {
                throw new Error("User ID is missing");
            }

            const userId = MyUser.my_user.id;

            // Gọi API cập nhật thông tin user
            await UserService.updateUserInfo(userId, { name, dob });

            // Lấy dữ liệu mới nhất từ DB
            const updatedUserFromServer = await UserService.getUserById(userId);

            console.log("updatedUserFromServer:", updatedUserFromServer);

            // Cập nhật MyUser và localStorage ngay lập tức
            const newUserData = {
                ...MyUser,
                my_user: {
                    ...MyUser.my_user,
                    ...updatedUserFromServer,
                },
            };

            setMyUser(newUserData);
            localStorage.setItem("my_user", JSON.stringify(newUserData)); // Cập nhật ngay

            alert("Cập nhật thông tin thành công!");
            onClose();
        } catch (error) {
            console.error("Lỗi khi cập nhật user:", error);
            alert("Cập nhật thất bại! " + (error.message || JSON.stringify(error)));
        }
    };

    const startUploading = () => {
        setOriginalAvatar(avatar);
        setIsUploading(true);
    };

    const cancelUpload = () => {
        setAvatar(originalAvatar);
        setFile(null);
        setIsUploading(false);
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (!validTypes.includes(selectedFile.type)) {
                alert("Chỉ chấp nhận file (.jpg, .jpeg, .png)");
                return;
            }
            setFile(selectedFile);
            setAvatar(URL.createObjectURL(selectedFile));
        }
    };

    const uploadAvatar = async () => {
        if (!file) return;

        try {
            const url = await S3Service.uploadAvatar(file);
            setAvatar(url);

            // Cập nhật avatar vào MyUser
            updateUserInfo({ avatar: url });

            setIsUploading(false);
            alert("Cập nhật avatar thành công!");
        } catch (error) {
            alert("Upload thất bại!");
        }
    };

    if (!MyUser && !initialUser) {
        return (
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Thông tin tài khoản</h5>
                            <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                        </div>
                        <div className="modal-body text-center">
                            <p>Không có thông tin người dùng để hiển thị.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            {isUploading
                                ? "Cập nhật ảnh đại diện"
                                : isEditing
                                    ? "Cập nhật thông tin cá nhân"
                                    : "Thông tin tài khoản"}
                        </h5>
                        <i className="fas fa-times" onClick={onClose} style={{ cursor: "pointer" }}></i>
                    </div>

                    {isUploading ? (
                        <div className="modal-body text-center">
                            <label
                                className="btn btn-light d-flex align-items-center mx-auto"
                                style={{ border: "1px solid #ddd", cursor: "pointer" }}
                            >
                                <i className="fas fa-upload me-2"></i> Tải lên từ máy tính
                                <input
                                    type="file"
                                    className="d-none"
                                    accept=".jpg, .jpeg, .png"
                                    onChange={handleFileChange}
                                />
                            </label>
                            <h6 className="mt-3">Ảnh đại diện của tôi</h6>
                            <div
                                className="mb-3 d-flex justify-content-center align-items-center"
                                style={{ height: "100px" }}
                            >
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt="Avatar"
                                        className="rounded-circle mt-2"
                                        style={{ width: "80px", height: "100px" }}
                                    />
                                ) : (
                                    <p className="text-muted">Chưa có ảnh đại diện</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {!isEditing && (
                                <div className="d-flex align-items-center p-3 border-bottom">
                                    <div className="position-relative" style={{ width: "60px", height: "60px" }}>
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt="Avatar"
                                                className="rounded-circle shadow-sm"
                                                style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center"
                                                style={{ width: "60px", height: "60px", fontSize: "24px" }}
                                            >
                                                {name?.split(" ").map((word) => word[0]).join("") || "?"}
                                            </div>
                                        )}
                                        <label
                                            className="position-absolute bottom-0 end-0 bg-light rounded-circle shadow-sm d-flex justify-content-center align-items-center"
                                            style={{ width: "24px", height: "24px", cursor: "pointer" }}
                                            onClick={startUploading}
                                        >
                                            <i className="fas fa-camera" style={{ fontSize: "12px" }}></i>
                                        </label>
                                    </div>
                                    <p className="ms-3 fw-bold mb-0">
                                        {name}
                                        <i
                                            className="fas fa-pencil-alt ms-2"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setIsEditing(true)}
                                        ></i>
                                    </p>
                                </div>
                            )}

                            <div className="modal-body">
                                {isEditing ? (
                                    <div>
                                        <div className="mb-3">
                                            <h6 className="form-label">Tên hiển thị</h6>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3 mt-4">
                                            <h5 className="form-label fw-bold">Thông tin cá nhân</h5>
                                            {/* <div className="d-flex align-items-center">
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        value="Nam"
                                                        checked={(MyUser?.sex || initialUser?.sex) === "Nam"}
                                                        className="form-check-input"
                                                    />
                                                    <label className="form-check-label ms-2">Nam</label>
                                                </div>
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        value="Nữ"
                                                        checked={(MyUser?.sex || initialUser?.sex) === "Nữ"}
                                                        className="form-check-input"
                                                    />
                                                    <label className="form-check-label ms-2">Nữ</label>
                                                </div>
                                            </div> */}
                                        </div>
                                        <div className="mb-3">
                                            <h6 className="form-label">Ngày sinh</h6>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p><strong>Giới tính:</strong> {(MyUser?.sex || initialUser?.sex) || "Chưa cập nhật"}</p>
                                        <p><strong>Ngày sinh:</strong> {(MyUser?.dob || initialUser?.dob) || "Chưa cập nhật"}</p>
                                        <p><strong>Điện thoại:</strong> {(MyUser?.phoneNumber || initialUser?.phoneNumber) || "Chưa cập nhật"}</p>
                                        <p className="text-muted small">
                                            Chỉ bạn bè có lưu số của bạn trong danh bạ mới xem được số này
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="modal-footer">
                        {isUploading ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={cancelUpload}>
                                    Hủy
                                </button>
                                <button type="button" className="btn btn-primary" onClick={uploadAvatar}>
                                    Cập nhật ảnh
                                </button>
                            </>
                        ) : isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!isChanged}
                                    onClick={handleUpdateInfo}
                                >
                                    Cập nhật
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                Cập nhật
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoModal;