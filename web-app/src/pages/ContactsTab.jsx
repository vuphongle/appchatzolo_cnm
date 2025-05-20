import React from "react";
import { useState, useEffect, useMemo } from "react";
import MessageService from "../services/MessageService";
import avatar_default from '../image/avatar_user.jpg';
import UserService from "../services/UserService";
import { useAuth } from "../context/AuthContext"; // Import custom hook để sử dụng context
import FriendRequestsTab from "./ListFriend_RequestTab";
import FriendInfoModal from "./FriendInfoModal";
import showToast from "../utils/AppUtils";
import GroupService from "../services/GroupService";

const FriendItem = ({
    userId,
    friendId,
    avatar,
    name,
    phoneNumber,
    dob,
    onFriendRemoved,
    user,
    onSelectChat,
    avatar_default,
    MyUser,
    handleUserInfoModalOpen,
    isFriendRequestSent,
    isFriendRequestModalOpen,
    messageContent,
    setMessageContent,
    sendFriendRequest,
    setIsFriendRequestModalOpen,
}) => {
    const [showModalFriend, setShowModalFriend] = useState(false); // Trạng thái riêng cho mỗi FriendItem
    user = { id: friendId, avatar, name, phoneNumber, dob };

    const { updateUserInfo } = useAuth(); // Sử dụng custom hook để lấy hàm updateUserInfo từ context
    const [friendList, setFriendList] = useState([]);

    const removeFriendFromList = (friendId) => {
        const friendIds = Array.isArray(MyUser?.my_user?.friendIds) ? MyUser.my_user.friendIds : [];

        setFriendList((prevList) => prevList.filter((id) => id !== friendId));

        const updatedUserData = {
            ...MyUser,
            my_user: {
                ...MyUser.my_user,
                friendIds: friendIds.filter((id) => id !== friendId),
            },
        };

        updateUserInfo(updatedUserData);
    };

    const handleRemoveFriend = async () => {
        try {
            await UserService.delete(`/${userId}/removeFriend/${friendId}`);
            showToast("Xóa bạn bè thành công!", "success");

            if (onFriendRemoved) {
                onFriendRemoved(friendId);
            }
            // Cập nhật lại danh sách bạn bè trong context
            removeFriendFromList(friendId);

        } catch (error) {
            showToast("Xóa bạn bè thất bại!", "error");
        }
    };

    return (
        <>
            <div
                className="d-flex align-items-center justify-content-between p-2 border-bottom mb-3"
                style={{ transition: "background-color 0.3s ease", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                onClick={() => onSelectChat(user)}
            >
                <div className="d-flex align-items-center ms-3">
                    <img
                        src={avatar}
                        alt="Avatar"
                        className="rounded-circle border"
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                    />
                    <h5 className="mb-0 ms-2">{name}</h5>
                </div>
                <div className="dropdown">
                    <button
                        className="btn btn-light border-0 p-2"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-ellipsis-h"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                            <a
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModalFriend(true); document.body.click();// Mở modal riêng cho FriendItem này
                                }}
                            >
                                Xem thông tin
                            </a>
                        </li>
                        <li>
                            <a className="dropdown-item" onClick={(e) => { e.stopPropagation(); document.body.click(); }}>
                                Đặt tên gợi nhớ
                            </a>
                        </li>
                        <li>
                            <a className="dropdown-item" onClick={(e) => { e.stopPropagation(); document.body.click(); }}>
                                Chặn người này
                            </a>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <a
                                className="dropdown-item text-danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFriend();
                                    document.body.click();
                                }}
                            >
                                Xóa bạn
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {showModalFriend && (
                <FriendInfoModal
                    user={user}
                    avatar_default={avatar_default}
                    MyUser={MyUser}
                    isUserInfoModalOpen={showModalFriend}
                    setIsUserInfoModalOpen={setShowModalFriend}
                    closeAllModal={() => setShowModalFriend(false)}
                    handleUserInfoModalOpen={handleUserInfoModalOpen}
                    isFriendRequestSent={isFriendRequestSent}
                    isFriendRequestModalOpen={isFriendRequestModalOpen}
                    messageContent={messageContent}
                    setMessageContent={setMessageContent}
                    sendFriendRequest={sendFriendRequest}
                    setIsFriendRequestModalOpen={setIsFriendRequestModalOpen}
                />
            )}
        </>
    );
};

const GroupItem = ({ img, groupName, member }) => {

    return (
        <>
            <div
                className="d-flex align-items-center justify-content-between p-2 border-bottom mb-3"
                style={{ transition: "background-color 0.3s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
                <div className="d-flex align-items-center ms-3 me-2">
                    <img
                        src={img}
                        alt="Avatar"
                        className="rounded-circle border"
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                    />
                    {/* <h5 className="mb-0 ms-2">{groupName}</h5> */}
                    <div className="d-flex flex-column align-items-start mb-0 ms-3">
                        <h4 className="mb-0 text-dark fw-bold">{groupName}</h4>
                        {/* <small className="text-muted">{member} thành viên</small> */}
                    </div>
                </div>
                <div className="dropdown">
                    <button
                        className="btn btn-light border-0 p-2"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-ellipsis-h"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                            <a className="dropdown-item text-danger">Rời nhóm</a>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
};

function ContactsTab({ userId,
    friendRequests,
    onSelectChat,
    user,
    avatar_default,
    MyUser,
    isUserInfoModalOpen,
    setIsUserInfoModalOpen,
    closeAllModal,
    handleUserInfoModalOpen,
    isFriendRequestSent,
    isFriendRequestModalOpen, messageContent, setMessageContent, sendFriendRequest, setIsFriendRequestModalOpen }) {
    // const { MyUser } = useAuth();
    // const userId = MyUser?.my_user?.id;
    const [friends, setFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState("name-asc");
    const [groupList, setGroupList] = useState([]);


    useEffect(() => {
        if (userId) {
            UserService.getFriends(userId)
                .then((data) => {
                    setFriends(Array.isArray(data) ? data : []);
                })
                .catch((err) => {
                    console.error("Error fetching friends:", err);
                    setError("Không thể tải danh sách bạn bè.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [userId]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        UserService.searchUserByName(searchTerm, userId)
            .then((data) => {
                setSearchResults(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm:", err);
                setSearchResults([]);
            });
    }, [searchTerm, userId]);

    // sort theo tên
    const sortedFriends = useMemo(() => {
        const friendsToSort = searchTerm.trim() ? searchResults : friends;
        if (!Array.isArray(friendsToSort) || friendsToSort.length === 0) {
            return [];
        }
        const sorted = [...friendsToSort].sort((a, b) => {
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();
            const comparison = nameA.localeCompare(nameB);
            return sortOrder === "name-asc" ? comparison : -comparison;
        });
        return sorted;
    }, [friends, searchResults, searchTerm, sortOrder]);

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    // Hàm render danh sách với nhóm chữ cái
    const renderGroupedFriends = () => {
        let lastLetter = null;
        return sortedFriends.map((friend) => {
            const firstLetter = friend.name.charAt(0).toUpperCase();
            const showLetter = firstLetter !== lastLetter;
            lastLetter = firstLetter;
            return (
                <React.Fragment key={friend.id}>
                    {showLetter && <h4>{firstLetter}</h4>}
                    <FriendItem userId={userId}
                        friendId={friend.id}
                        avatar={friend.avatar}
                        name={friend.name}
                        dob={friend.dob}
                        phoneNumber={friend.phoneNumber}
                        onFriendRemoved={handleFriendRemoved}
                        user={friend}
                        onSelectChat={onSelectChat}
                        avatar_default={avatar_default}
                        MyUser={MyUser}
                        isUserInfoModalOpen={isUserInfoModalOpen}
                        setIsUserInfoModalOpen={setIsUserInfoModalOpen}
                        closeAllModal={closeAllModal}
                        handleUserInfoModalOpen={handleUserInfoModalOpen}
                        isFriendRequestSent={isFriendRequestSent}
                        isFriendRequestModalOpen={isFriendRequestModalOpen}
                        messageContent={messageContent}
                        setMessageContent={setMessageContent}
                        sendFriendRequest={sendFriendRequest}
                        setIsFriendRequestModalOpen={setIsFriendRequestModalOpen} />
                </React.Fragment>
            );
        });
    };

    const handleFriendRemoved = (removedFriendId) => {
        setFriends((prevFriends) => prevFriends.filter(friend => friend.id !== removedFriendId));
    };

    const groupIds = Array.isArray(MyUser?.my_user?.groupIds) ? MyUser.my_user.groupIds : [];
    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (groupIds.length > 0) {
                try {
                    const memberPromises = groupIds.map(async (groupId) => {
                        const response = await GroupService.getGroupMembers(groupId);
                        return response.data;
                    });

                    const allMembers = await Promise.all(memberPromises);
                    setGroupList(allMembers.flat());  // Flat để gộp tất cả thành viên lại
                } catch (error) {
                    console.error("Lỗi khi lấy thành viên nhóm:", error);

                }
            }
        };

        fetchGroupMembers();
    }, [groupIds]);
    const filteredGroups = groupList.filter(group =>
        group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div>
            <div className="tab-content" id="v-pills-tabContent">
                {/* Tab danh sách bạn bè */}
                <div className="tab-pane fade show active" id="v-pills-friendlist" role="tabpanel" aria-labelledby="v-pills-friendlist-tab">
                    <div className="header d-flex align-items-center">
                        <i className="fas fa-user-friends me-3"></i>
                        <h4 className="mb-0">Danh sách bạn bè</h4>
                    </div>
                    <hr />
                    <div className="vh-100 container">
                        <h6>Bạn bè ({searchTerm.trim() ? searchResults.length : friends.length})</h6>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <input
                                type="text"
                                className="form-control w-50"
                                placeholder="Tìm bạn"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="form-select w-50"
                                value={sortOrder}
                                onChange={(e) => {
                                    handleSortChange(e);
                                }}
                            >
                                <option value="name-asc">Tên (A-Z)</option>
                                <option value="name-desc">Tên (Z-A)</option>
                            </select>
                        </div>
                        {loading ? (
                            <p>Đang tải...</p>
                        ) : error ? (
                            <p>{error}</p>
                        ) : sortedFriends.length === 0 ? (
                            <p>Không tìm thấy người dùng nào.</p>
                        ) : (
                            renderGroupedFriends()
                        )}
                    </div>
                </div>

                {/* Tab danh sách nhóm */}
                <div className="tab-pane fade" id="v-pills-grouplist" role="tabpanel" aria-labelledby="v-pills-grouplist-tab">
                    <div className="header d-flex align-items-center">
                        <i className="fas fa-users me-3"></i>
                        <h4 className="mb-0">Danh sách nhóm</h4>
                    </div>
                    <hr />
                    <div className="vh-100 container">
                        <h6>Nhóm ({filteredGroups.length})</h6>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <input type="text" className="form-control me-2" placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} />
                            <select className="form-select">
                                <option value="name-asc">Tên (A-Z)</option>
                                <option value="name-desc">Tên (Z-A)</option>
                                <option value="name-desc">Hoạt động (mới - cũ)</option>
                                <option value="name-desc">Hoạt động (cũ - mới)</option>
                            </select>
                        </div>
                        {filteredGroups.map((group) => (
                            <GroupItem
                                key={group.id}
                                img={group.image || avatar_default}
                                groupName={group.groupName}
                                member={group.member}
                            />
                        ))}
                    </div>
                </div>

                {/* Tab lời mời kết bạn */}
                <div className="tab-pane fade" id="v-pills-friend" role="tabpanel" aria-labelledby="v-pills-messages-friend">
                    <FriendRequestsTab key={userId} userId={userId} friendRequests={friendRequests} onSelectChat={onSelectChat} /> {/* Gọi FriendRequestsTab */}
                </div>

                {/* Tab lời mời vào nhóm */}
                <div className="tab-pane fade" id="v-pills-group" role="tabpanel" aria-labelledby="v-pills-group-tab">

                    <div className="header d-flex align-items-center">
                        <i className="fas fa-users me-3"></i>
                        <h4 className="mb-0">Lời mời vào nhóm</h4>
                    </div>
                    <hr />
                    <div className="text-center py-5 ">
                        <div className="icon-placeholder mb-3">
                            <i className="fas fa-file-alt fa-3x text-muted"></i>
                        </div>
                        <h5 className="text-muted">Không có lời mời vào nhóm</h5>
                        <p className="text-muted">
                            Khi nào tôi nhận được lời mời?{' '}
                            <a href="#" className="text-decoration-none">Tìm hiểu thêm</a>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ContactsTab;
