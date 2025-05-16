import React, { useState, useMemo, useEffect } from "react";
import UserService from "../services/UserService";
import S3Service from "../services/S3Service";
import { useAuth } from "../context/AuthContext";
import showToast from "../utils/AppUtils";

const UserInfoModal = ({ user: initialUser, onClose }) => {
    const { MyUser, setMyUser, updateUserInfo } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatar, setAvatar] = useState(MyUser?.avatar || initialUser?.avatar || null);
    const [file, setFile] = useState(null);
    const [originalAvatar, setOriginalAvatar] = useState(MyUser?.avatar || MyUser?.my_user.avatar || initialUser?.avatar || null);
    const [name, setName] = useState(MyUser?.my_user?.name || MyUser?.name || initialUser?.name || "");
    const [showModal, setShowModal] = useState(false);
    const [dob, setDob] = useState(
        MyUser?.dob || initialUser?.dob || MyUser?.my_user?.dob
            ? new Date(MyUser?.dob || initialUser?.dob || MyUser?.my_user?.dob).toISOString().split("T")[0]
            : ""
    );
    const [gender, setGender] = useState(MyUser?.gender || initialUser?.gender || "");


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
            setGender(currentUser.gender || currentUser.my_user?.gender || "");
        }
    }, [MyUser, initialUser]);

    // Kiểm tra dữ liệu có thay đổi không
    const isChanged = useMemo(
        () =>
            name !== (MyUser?.name || initialUser?.name || "") ||
            dob !==
            ((MyUser?.dob || initialUser?.dob)
                ? new Date(MyUser?.dob || initialUser?.dob).toISOString().split("T")[0]
                : "") ||
            gender !== (MyUser?.gender || initialUser?.gender || ""),
        [name, dob, gender, MyUser, initialUser]
    );


    const handleUpdateInfo = async () => {
        try {
            if (!MyUser?.my_user?.id) {
                throw new Error("User ID is missing");
            }

            const userId = MyUser.my_user.id;

            // Gọi API cập nhật thông tin user
            await UserService.updateUserInfo(userId, { name, dob, gender });

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

            showToast("Cập nhật thông tin thành công!", "success");

            setIsEditing(false);
            // onClose();
        } catch (error) {
            console.error("Lỗi khi cập nhật user:", error);
            showToast("Cập nhật thông tin thất bại! " + (error.message || JSON.stringify(error)), "error");
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
        setShowModal(false);
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
            const userId = MyUser?.my_user?.id;
            if (!userId) throw new Error("User ID is missing");

            const url = await S3Service.uploadAvatar(file, userId);

            await UserService.updateUserInfo(userId, { avatar: url });

            const updatedUser = { ...MyUser, my_user: { ...MyUser.my_user, avatar: url } };
            setMyUser(updatedUser);
            localStorage.setItem("my_user", JSON.stringify(updatedUser));

            setAvatar(url);
            setFile(null); // Reset file sau khi upload
            setIsUploading(false);
            setShowModal(false);

            // Reset trạng thái isChanged vì ảnh đã được cập nhật
            setOriginalAvatar(url);

            showToast("Cập nhật ảnh đại diện thành công!", "success");
        } catch (error) {
            console.error("Lỗi khi upload ảnh đại diện:", error);
            showToast("Cập nhật ảnh đại diện thất bại! " + (error.message || JSON.stringify(error)), "error");
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

    const handleModalClick = (e) => {
        // Ngăn không cho đóng modal khi click vào trong nội dung modal
        if (e.target.closest('.modal-dialog')) return;
        onClose();
    };

    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0'); // cộng 1 vì getMonth() từ 0-11
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${day}, tháng ${month}, ${year}`;
    };

    console.log("MyUser:", MyUser.dob, "initialUser:", initialUser.dob);


    return (
        <div className="modal show d-block d-flex align-items-center justify-content-center" onClick={handleModalClick} tabIndex="-1">
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
                            <label className="btn btn-outline-secondary d-flex align-items-center justify-content-center mx-auto" style={{ border: "2px dashed #ccc", padding: "10px", cursor: "pointer", width: "250px" }}>
                                <i className="fas fa-upload me-2"></i> Tải ảnh lên
                                <input type="file" className="d-none" accept=".jpg, .jpeg, .png" onChange={handleFileChange} />
                            </label>

                            <h6 className="mt-3">Ảnh đại diện của tôi</h6>
                            <div className="d-flex justify-content-center">
                                {avatar ? (
                                    <div className="position-relative" style={{ width: "120px", height: "120px" }}>
                                        <img
                                            src={avatar}
                                            alt="Avatar"
                                            className="rounded-circle border border-3 shadow-sm"
                                            style={{ width: "120px", height: "120px", objectFit: "cover" }}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-muted">Chưa có ảnh đại diện</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {!isEditing && (
                                <div className="d-flex align-items-center p-3 border-bottom">
                                    <div
                                        className="position-relative"
                                        style={{ width: "80px", height: "80px", cursor: "pointer" }}
                                        onClick={() => setShowModal(true)}
                                    >
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt="Avatar"
                                                className="rounded-circle border border-2 shadow-sm"
                                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center"
                                                style={{ width: "80px", height: "80px", fontSize: "28px", fontWeight: "bold" }}
                                            >
                                                {name?.split(" ").map((word) => word[0]).join("") || "?"}
                                            </div>
                                        )}
                                        <label
                                            className="position-absolute bottom-0 end-0 bg-light rounded-circle shadow-sm d-flex justify-content-center align-items-center"
                                            style={{ width: "28px", height: "28px", cursor: "pointer", border: "1px solid #ddd" }}
                                            onClick={startUploading}
                                        >
                                            <i className="fas fa-camera text-secondary" style={{ fontSize: "14px" }}></i>
                                        </label>
                                    </div>
                                    <p className="ms-3 fw-bold mb-0">
                                        {name}
                                        <i
                                            className="fas fa-pencil-alt ms-2 text-primary"
                                            style={{ cursor: "pointer", fontSize: "14px" }}
                                            onClick={() => setIsEditing(true)}
                                        ></i>
                                    </p>
                                </div>
                            )}

                            {showModal && !isUploading && (
                                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}>
                                    <div className="d-flex justify-content-end p-3">
                                        <i className="fas fa-times" onClick={() => setShowModal(false)} style={{ cursor: "pointer" }}></i>
                                    </div>
                                    {/* Body */}
                                    <div className="modal-body d-flex justify-content-center align-items-center">
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt="Avatar"
                                                className="img-fluid"
                                                style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }}
                                            />
                                        ) : (
                                            <p className="text-muted">Chưa có ảnh đại diện</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="modal-body">
                                {isEditing ? (
                                    <div className="modal-body text-start">
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
                                            <div className="d-flex align-items-center">
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        id="nam"
                                                        value="Nam"
                                                        checked={gender === "Nam"}
                                                        className="form-check-input"
                                                        onChange={(e) => setGender(e.target.value)}
                                                    />
                                                    <label className="form-check-label ms-2" htmlFor="nam">Nam</label>
                                                </div>
                                                <div className="form-check me-3 d-flex align-items-center">
                                                    <input
                                                        type="radio"
                                                        id="nu"
                                                        value="Nữ"
                                                        checked={gender === "Nữ"}
                                                        className="form-check-input"
                                                        onChange={(e) => setGender(e.target.value)}
                                                    />
                                                    <label className="form-check-label ms-2" htmlFor="nu">Nữ</label>
                                                </div>
                                            </div>
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
                                    <div className="modal-body text-start">
                                        <p><strong>Giới tính:</strong> {(MyUser?.gender || initialUser?.gender) || "Chưa cập nhật"}</p>
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
                                <button type="button" className="btn btn-primary" onClick={uploadAvatar} disabled={!file}>
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