package vn.edu.iuh.fit.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import vn.edu.iuh.fit.model.Group;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.model.UserGroup;
import vn.edu.iuh.fit.repository.GroupRepository;
import vn.edu.iuh.fit.repository.UserRepository;
import vn.edu.iuh.fit.service.GroupService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DynamoDbEnhancedClient dynamoDbClient;


    private final GroupRepository groupRepository;

    @Autowired
    public GroupServiceImpl(UserRepository userRepository,
                            GroupRepository groupRepository,
                            DynamoDbEnhancedClient dynamoDbClient) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.dynamoDbClient = dynamoDbClient;
    }

    //Tạo nhóm
    @Override
    public void createGroup(Group group, String creatorId) {
        group.setId(java.util.UUID.randomUUID().toString());
        groupRepository.saveGroup(group);

        // Gán creator làm LEADER trong UserGroup
        UserGroup userGroup = new UserGroup();
        userGroup.setUserId(creatorId);
        userGroup.setGroupId(group.getId());
        userGroup.setRole(GroupRole.LEADER.name());
        userGroup.setJoinDate(java.time.LocalDate.now().toString());

        groupRepository.addUserToGroup(userGroup);
    }

    // Cập nhật tên/ảnh nhóm
    @Override
    public void updateGroupInfo(String groupId, String newName, String newImage) {
        Group group = groupRepository.getGroupById(groupId);
        if (group == null) return;

        group.setGroupName(newName);
        group.setImage(newImage);

        groupRepository.saveGroup(group);
    }

    @Override
    public void deleteGroup(String userId, String groupId) {
        // 1. Kiểm tra xem requester có phải là nhóm trưởng không
        GroupRole role = getUserRole(groupId, userId);
        if (role != GroupRole.LEADER) {
            throw new RuntimeException("Chỉ nhóm trưởng mới có quyền xoá nhóm.");
        }

        // 2. Xoá tất cả UserGroup liên quan đến group
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        for (UserGroup member : members) {
            groupRepository.removeUserFromGroup(member.getUserId(), groupId);
        }
        //xóa thành viên nhóm trước khi xóa nhóm
        groupRepository.deleteAllUserGroupsByGroupId(groupId);
        // 3. Xoá nhóm
        groupRepository.deleteGroup(groupId);

    }

    //Thêm thành viên (LEADER hoặc CO_LEADER mới có quyền gọi hàm này)
    @Override
    public void addMember(String groupId, String userId) {
        UserGroup userGroup = new UserGroup();
        userGroup.setUserId(userId);
        userGroup.setGroupId(groupId);
        userGroup.setRole(GroupRole.MEMBER.name());
        userGroup.setJoinDate(java.time.LocalDate.now().toString());

        groupRepository.addUserToGroup(userGroup);

    }


    //Xoá thành viên (chỉ LEADER hoặc CO_LEADER mới có quyền, và CO_LEADER không được xoá LEADER)
    @Override
    public void removeMember(String groupId, String targetUserId, String actorUserId) {
        GroupRole actorRole = getUserRole(groupId, actorUserId);
        GroupRole targetRole = getUserRole(groupId, targetUserId);

        if (actorRole == GroupRole.LEADER || (actorRole == GroupRole.CO_LEADER && targetRole == GroupRole.MEMBER)) {
            groupRepository.removeUserFromGroup(targetUserId, groupId);
        } else {
            throw new RuntimeException("Bạn không có quyền xoá người dùng này.");
        }
    }


    // Thăng cấp nhóm phó
    @Override
    public void promoteToCoLeader(String groupId, String targetUserId, String promoterId) {
        GroupRole promoterRole = getUserRole(groupId, promoterId);
        if (promoterRole != GroupRole.LEADER)
            throw new RuntimeException("Chỉ nhóm trưởng mới có quyền.");

        UserGroup ug = groupRepository.getUserGroup(targetUserId, groupId);
        if (ug != null) {
            ug.setRole(GroupRole.CO_LEADER.name());
            groupRepository.addUserToGroup(ug);
        }
    }


    // Giáng xuống thành viên
    @Override
    public void demoteToMember(String groupId, String targetUserId, String promoterId) {
        GroupRole promoterRole = getUserRole(groupId, promoterId);
        if (promoterRole != GroupRole.LEADER)
            throw new RuntimeException("Chỉ nhóm trưởng mới có quyền.");

        UserGroup ug = groupRepository.getUserGroup(targetUserId, groupId);
        if (ug != null) {
            ug.setRole(GroupRole.MEMBER.name());
            groupRepository.addUserToGroup(ug);
        }
    }


    //Lấy role của người dùng trong nhóm
    @Override
    public GroupRole getUserRole(String groupId, String userId) {
        UserGroup ug = groupRepository.getUserGroup(userId, groupId);
        return ug == null ? null : GroupRole.valueOf(ug.getRole());
    }

    // Kiểm tra nhóm trưởng
    @Override
    public boolean isLeader(String groupId, String userId) {
        return getUserRole(groupId, userId) == GroupRole.LEADER;
    }

    //Lấy danh sách thành viên group
    @Override
    public List<User> getGroupMembers(String groupId) {
        List<UserGroup> memberLinks = groupRepository.getMembersOfGroup(groupId);
        return memberLinks.stream()
                .map(link -> groupRepository.getUserById(link.getUserId()))
                .collect(Collectors.toList());
    }


    // Lấy nhóm theo ID
    @Override
    public Group getGroupById(String groupId) {
        return groupRepository.getGroupById(groupId);
    }
}
