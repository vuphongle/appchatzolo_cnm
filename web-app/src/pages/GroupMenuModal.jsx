import React, { useState } from "react";

const GroupMenuModal = ({ conversation, user }) => {

    console.log("Group info", conversation);

    return (
        <div className="relative">
            <div className="absolute bg-white shadow-md rounded" style={{
                width: '320px',
                maxHeight: '100vh',
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
                        {/* <button className="btn btn-light btn-sm rounded-circle p-1"> */}
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
                        ></i>
                        {/* </button> */}
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
                <div className="d-flex justify-content-between align-items-center border-bottom py-2 px-2 pt-4 pb-4">
                    <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-users text-secondary"></i>
                        <span className="small">Thành viên nhóm</span>
                    </div>
                    <span className="small text-muted">3 thành viên</span>
                </div>

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
                    <div className="d-flex align-items-center text-danger gap-2 mb-3 cursor-pointer">
                        <i className="fas fa-trash"></i>
                        <span>Xoá lịch sử trò chuyện</span>
                    </div>

                    <div className="d-flex align-items-center text-danger gap-2 mb-3 cursor-pointer">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Rời nhóm</span>
                    </div>

                    {/* Chỉ hiển thị nếu user là người tạo nhóm */}
                    {user.id === conversation.creatorId && (
                        <div className="d-flex align-items-center text-danger gap-2 mb-1 cursor-pointer">
                            <i className="fas fa-users-slash"></i>
                            <span>Giải tán nhóm</span>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default GroupMenuModal;
