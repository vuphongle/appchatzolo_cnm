import React from "react";
import { useState, useEffect, useMemo } from "react";
import MessageService from "../services/MessageService";
import UserService from "../services/UserService";
import { useAuth } from "../context/AuthContext"; // Import custom hook để sử dụng context
import FriendRequestsTab from "./ListFriend_RequestTab";

const FriendItem = ({ avatar, name }) => (
    <button type="button" className="btn btn-outline-secondary" style={{ outline: "none", border: "none" }}>
        <div className="friend-item d-flex align-items-center mb-3">
            <img src={avatar} alt="Avatar" className="avatar me-3" style={{ width: 50, height: 50, borderRadius: "50%" }} />
            <h4>{name}</h4>
            <i className="fas fa-ellipsis-h ms-auto" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"></i>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><a className="dropdown-item" href="#">Xem thông tin</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Đặt tên gợi nhớ</a></li>
                <li><a className="dropdown-item" href="#">Chặn người này</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-danger" href="#">Xóa bạn</a></li>
            </ul>
        </div>
    </button>
);

const groupList = [
    { id: 1, groupName: "IUH - DHKTPM17A - CT7", member: 86, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
    { id: 2, groupName: "Team Ổn CN Mới", member: 6, img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg" },
    { id: 3, groupName: "Team Ổn", member: 20, img: "https://cdn.mhnse.com/news/photo/202105/74850_47849_2150.jpg" },
    { id: 4, groupName: "Nhóm 4 PTUD JAVA", member: 30, img: "https://cdn.idntimes.com/content-images/community/2024/04/img-4316-f6d361070de3766c8e441e12129828b1-3d6a4e7ff5fede70fceb066160f52e37.jpeg" },
];

const GroupItem = ({ img, groupName, member }) => (
    <button type="button" className="btn btn-outline-secondary" style={{ outline: "none", border: "none" }}>
        <div className="group-item d-flex align-items-center mb-3">
            <img
                src={img}
                alt="Group Avatar"
                className="avatar me-3"
                style={{ width: 50, height: 50, borderRadius: "50%" }}
            />
            <div className="d-flex flex-column align-items-start">
                <h4 className="mb-0 text-dark fw-bold">{groupName}</h4>
                <small className="text-muted">{member} thành viên</small>
            </div>
            <i
                className="fas fa-ellipsis-h ms-auto"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false">
            </i>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><a className="dropdown-item" href="#">Xem thông tin</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-danger" href="#">Rời nhóm</a></li>
            </ul>
        </div>
    </button>
);


// Hàm nhóm bạn bè theo chữ cái đầu
const groupFriendsByLetter = (friends) => {
    return friends.reduce((groups, friend) => {
        const firstLetter = friend.name.charAt(0).toUpperCase(); // Lấy chữ cái đầu tiên
        if (!groups[firstLetter]) {
            groups[firstLetter] = [];
        }
        groups[firstLetter].push(friend);
        return groups;
    }, {});
};

function ContactsTab() {
    const { MyUser } = useAuth(); // Lấy thông tin người dùng từ context
    const userId = MyUser?.my_user?.id; // Lấy id người dùng
    const [friends, setFriends] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(""); // Giá trị nhập vào ô tìm kiếm
    const [searchResults, setSearchResults] = useState([]); // Kết quả tìm kiếm
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy danh sách bạn bè từ backend
    useEffect(() => {
        if (userId) {
            UserService.getFriends(userId)
                .then((data) => {
                    setFriends(data); // Cập nhật danh sách bạn bè
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

    // Gọi API tìm kiếm khi searchTerm thay đổi
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]); // Nếu ô tìm kiếm trống, hiển thị danh sách bạn bè ban đầu
            return;
        }
    
        UserService.searchUserByName(searchTerm)
            .then((data) => {
                // Loại bỏ chính mình bằng cách so sánh ID người dùng
                const filteredResults = data.filter(user => user.id !== userId);
                setSearchResults(filteredResults); 
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm:", err);
                setSearchResults([]); // Nếu lỗi, đặt danh sách tìm kiếm về rỗng
            });
    }, [searchTerm, userId]); 
    
    
    const groupedFriends = useMemo(() => {
    const friendsToGroup = searchTerm.trim() ? searchResults : friends;
    return groupFriendsByLetter(friendsToGroup);
}, [friends, searchResults, searchTerm]);

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
                    <div className="vh-100">
                        <h6 >Bạn bè ({searchTerm.trim() ? searchResults.length : friends.length})</h6>
                        <div className="search-bar d-flex align-items-center mb-3">
                            <input 
                                type="text" 
                                className="form-control me-2" 
                                placeholder="Tìm bạn"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <select className="form-select">
                                <option value="name-asc">Tên (A-Z)</option>
                                <option value="name-desc">Tên (Z-A)</option>
                            </select>
                        </div>

                        {/* Hiển thị danh sách tìm kiếm nếu có, nếu không thì hiển thị bạn bè */}
                        <div>
                            {Object.keys(groupedFriends).length === 0 ? (
                                <p>Không tìm thấy người dùng nào.</p>
                            ) : (
                                Object.keys(groupedFriends)
                                    .sort()
                                    .map((letter) => (
                                        <div key={letter}>
                                            <h4>{letter}</h4>
                                            {groupedFriends[letter].map((friend) => (
                                                <FriendItem key={friend.id} avatar={friend.avatar} name={friend.name} />
                                            ))}
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab danh sách nhóm */}
                <div className="tab-pane fade" id="v-pills-grouplist" role="tabpanel" aria-labelledby="v-pills-grouplist-tab">
                    <div className="header d-flex align-items-center">
                        <i className="fas fa-users me-3"></i>
                        <h4 className="mb-0">Danh sách nhóm</h4>
                    </div>
                    <hr />
                    <div className="vh-100">
                        <h6>Nhóm ({groupList.length})</h6>
                        <div className="search-bar d-flex align-items-center mb-3">
                            <input type="text" className="form-control me-2" placeholder="Tìm kiếm..." />
                            <select className="form-select">
                                <option value="name-asc">Tên (A-Z)</option>
                                <option value="name-desc">Tên (Z-A)</option>
                                <option value="name-desc">Hoạt động (mới - cũ)</option>
                                <option value="name-desc">Hoạt động (cũ - mới)</option>
                            </select>
                        </div>
                        {groupList.map((group) => (
                            <GroupItem
                                key={group.id}
                                img={group.img}
                                groupName={group.groupName}
                                member={group.member}
                            />
                        ))}
                    </div>
                </div>

                {/* Tab lời mời kết bạn */}
                <div className="tab-pane fade" id="v-pills-friend" role="tabpanel" aria-labelledby="v-pills-messages-friend">
                    <FriendRequestsTab userId={userId} /> {/* Gọi FriendRequestsTab */}
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
