package vn.edu.iuh.fit.model.DTO.response;

import lombok.*;
import vn.edu.iuh.fit.model.GroupRole;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class UserGroupResponse {
    private String userId;
    private String groupId;
    private String joinDate; // ISO format
    private String role; // trưởng nhóm || phó nhóm|| thành viên

    // Các trường thông tin người dùng
    private String userName;  // Tên người dùng
    private String avatar;    // Avatar người dùng
    private String phoneNumber; // Số điện thoại
    private String gender;     // Giới tính
    private boolean isOnline;  // Trạng thái online

}
