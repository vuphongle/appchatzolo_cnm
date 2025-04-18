package vn.edu.iuh.fit.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.handler.MyWebSocketHandler;
import vn.edu.iuh.fit.model.DTO.request.GroupRequest;
import vn.edu.iuh.fit.model.DTO.request.MessageRequest;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.DTO.response.UserGroupResponse;
import vn.edu.iuh.fit.model.*;
import vn.edu.iuh.fit.repository.GroupRepository;
import vn.edu.iuh.fit.repository.MessageRepository;
import vn.edu.iuh.fit.repository.UserRepository;
import vn.edu.iuh.fit.service.GroupService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ObjectProvider<MyWebSocketHandler> myWebSocketHandlerProvider;

    private final GroupRepository groupRepository;

    @Autowired
    public GroupServiceImpl(UserRepository userRepository,
                            GroupRepository groupRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    //Tạo nhóm
    @Override
    public GroupResponse createGroup(GroupRequest group) throws GroupException {
        Group newGroup = new Group();
        newGroup.setId(java.util.UUID.randomUUID().toString());
        newGroup.setGroupName(group.getGroupName());
        newGroup.setImage(group.getImage());
        newGroup.setCreatorId(group.getCreatorId());
        newGroup.setCreatedAt(java.time.LocalDate.now().toString());
        //lưu id nhóm trưởng vào bảng user
        User memberUserLead = userRepository.findById(group.getCreatorId());
        if (memberUserLead != null) {
            // Cập nhật groupIds của nhóm trưởng
            if (memberUserLead.getGroupIds() == null) {
                memberUserLead.setGroupIds(new ArrayList<>());
            }
            memberUserLead.getGroupIds().add(newGroup.getId());  // Thêm ID nhóm vào groupIds của nhóm trưởng
            userRepository.save(memberUserLead);  // Cập nhật lại người dùng
        }

        groupRepository.saveGroup(newGroup);


        // Gán creator làm LEADER trong UserGroup
        if(group.getCreatorId() == null) {
            throw new GroupException("Người tạo nhóm không hợp lệ.");
        }
        String creatorId = group.getCreatorId();
        UserGroup userGroup = new UserGroup();
        userGroup.setUserId(creatorId);
        userGroup.setGroupId(newGroup.getId());
        userGroup.setRole(GroupRole.LEADER.name());
        userGroup.setJoinDate(java.time.LocalDate.now().toString());
        groupRepository.addUserToGroup(userGroup);

        // Gán các thành viên khác vào nhóm
        List<String> memberIds = group.getMemberIds();

        if(memberIds == null || memberIds.size() < 2) {
            throw new GroupException("Danh sách thành viên không hợp lệ.");
        }


        for(String memberId : memberIds) {
            User memberUser = userRepository.findById(memberId);
            if (memberUser != null) {
                // Cập nhật groupIds của thành viên
                if (memberUser.getGroupIds() == null) {
                    memberUser.setGroupIds(new ArrayList<>());
                }
                memberUser.getGroupIds().add(newGroup.getId());  // Thêm ID nhóm vào groupIds của thành viên
                userRepository.save(memberUser);  // Cập nhật lại người dùng
            }
            UserGroup memberGroup = new UserGroup();
            memberGroup.setUserId(memberId);
            memberGroup.setGroupId(newGroup.getId());
            memberGroup.setRole(GroupRole.MEMBER.name());
            memberGroup.setJoinDate(java.time.LocalDate.now().toString());
            groupRepository.addUserToGroup(memberGroup);
        }

        groupRepository.addUserToGroup(userGroup);

        return GroupResponse.builder()
                .id(newGroup.getId())
                .groupName(newGroup.getGroupName())
                .image(newGroup.getImage())
                .creatorId(newGroup.getCreatorId())
                .createdAt(newGroup.getCreatedAt())
                .build();
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
    public void deleteGroup(String userId, String groupId) throws GroupException {
        // 1. Kiểm tra xem requester có phải là nhóm trưởng không
        GroupRole role = getUserRole(groupId, userId);
        if (role == null) {
            throw new GroupException("Người dùng không phải là thành viên của nhóm.");
        }

        if (role != GroupRole.LEADER) {
            throw new GroupException("Chỉ nhóm trưởng mới có quyền xoá nhóm.");
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
    public GroupResponse addMember(GroupRequest group) throws GroupException {
        String groupId = group.getId();
        Group groupToUpdate = groupRepository.getGroupById(groupId);
        if (groupToUpdate == null) {
            throw new GroupException("Nhóm không tồn tại.");
        }

        // Lấy danh sách thành viên hiện tại của nhóm
        List<UserGroup> currentMembers = groupRepository.getMembersOfGroup(groupId);
        List<String> currentMemberIds = currentMembers.stream()
                .map(UserGroup::getUserId)
                .toList();

        List<String> memberIds = group.getMemberIds();

        for (String memberId : memberIds) {
            User user = userRepository.findById(memberId);
            if (user == null) {
                throw new GroupException("Người dùng không tồn tại.");
            }
            if (user.getId() == null) {
                throw new GroupException("Người dùng không hợp lệ.");
            }
            // Kiểm tra xem người dùng đã là thành viên của nhóm chưa
            UserGroup existingUserGroup = groupRepository.getUserGroup(memberId, groupId);
            if (existingUserGroup != null) {
                throw new GroupException("Người dùng đã là thành viên của nhóm.");
            }
            // Nếu chưa, thêm người dùng vào nhóm
            UserGroup userGroup = new UserGroup();
            userGroup.setUserId(memberId);
            userGroup.setGroupId(groupId);
            userGroup.setRole(GroupRole.MEMBER.name());
            userGroup.setJoinDate(java.time.LocalDate.now().toString());
            groupRepository.addUserToGroup(userGroup);

            if (user.getGroupIds() == null) {
                user.setGroupIds(new ArrayList<>());
            }
            if (!user.getGroupIds().contains(groupId)) {
                user.getGroupIds().add(groupId);
            }
            userRepository.save(user);
        }
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                // Thông báo cho các thành viên mới (người vừa được thêm)
                for (String newMemberId : memberIds) {
                    myWebSocketHandler.sendAddToGroupNotification(newMemberId, groupId);
                }
                // Thông báo cho các thành viên hiện tại của nhóm (người đã có trong nhóm)
                for (String existingMemberId : currentMemberIds) {
                    myWebSocketHandler.sendGroupUpdateNotification(existingMemberId, groupId);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending WebSocket notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }

        return GroupResponse.builder()
                .id(group.getId())
                .groupName(group.getGroupName())
                .image(group.getImage())
                .creatorId(group.getCreatorId())
                .createdAt(java.time.LocalDate.now().toString())
                .build();
    }


    //Xoá thành viên (chỉ LEADER hoặc CO_LEADER mới có quyền, và CO_LEADER không được xoá LEADER)
    @Override
    public void removeMember(String groupId, String targetUserId, String actorUserId) throws GroupException {
        GroupRole actorRole = getUserRole(groupId, actorUserId);
        GroupRole targetRole = getUserRole(groupId, targetUserId);

        if (actorRole == null) {
            throw new GroupException("Người thực hiện không phải thành viên nhóm.");
        }

        if (targetRole == null) {
            throw new GroupException("Người bị xóa không phải thành viên nhóm.");
        }

        if (actorRole == GroupRole.LEADER || (actorRole == GroupRole.CO_LEADER && targetRole == GroupRole.MEMBER)) {
            groupRepository.removeUserFromGroup(targetUserId, groupId);
        } else {
            throw new GroupException("Bạn không có quyền xoá người dùng này.");
        }
    }


    // Thăng cấp nhóm phó
    @Override
    public void promoteToCoLeader(String groupId, String targetUserId, String promoterId) throws GroupException{
        GroupRole promoterRole = getUserRole(groupId, promoterId);
        if (promoterRole != GroupRole.LEADER)
            throw new GroupException("Chỉ nhóm trưởng mới có quyền.");

        UserGroup ug = groupRepository.getUserGroup(targetUserId, groupId);
        if (ug != null) {
            ug.setRole(GroupRole.CO_LEADER.name());
            groupRepository.addUserToGroup(ug);
        }
    }


    // Giáng xuống thành viên
    @Override
    public void demoteToMember(String groupId, String targetUserId, String promoterId)throws GroupException {
        GroupRole promoterRole = getUserRole(groupId, promoterId);
        if (promoterRole != GroupRole.LEADER)
            throw new GroupException("Chỉ nhóm trưởng mới có quyền.");

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

    @Override
    public GroupResponse getGroupMembers(String groupId) throws GroupException {
        // Kiểm tra xem nhóm có tồn tại hay không
        Group group = groupRepository.getGroupById(groupId);
        if (group == null) {
            throw new GroupException("Nhóm không tồn tại.");
        }

        // Lấy danh sách UserGroup của nhóm
        List<UserGroup> memberLinks = groupRepository.getMembersOfGroup(groupId);
        if (memberLinks.isEmpty()) {
            throw new GroupException("Nhóm này không có thành viên.");
        }

        // Lấy thông tin người dùng từ bảng UserGroup và map sang UserGroupResponse
        List<UserGroupResponse> userGroupsResponse = memberLinks.stream()
                .map(userGroup -> {
                    User user = userRepository.findById(userGroup.getUserId()); // Lấy thông tin người dùng từ userId
                    if (user != null) {
                        return UserGroupResponse.builder()
                                .userId(user.getId())
                                .groupId(groupId)
                                .joinDate(userGroup.getJoinDate())
                                .role(userGroup.getRole()) // Vai trò trong nhóm
                                .userName(user.getName())
                                .avatar(user.getAvatar())
                                .phoneNumber(user.getPhoneNumber())
                                .gender(user.getGender())
                                .isOnline(user.isOnline())
                                .build();
                    }
                    return null;
                })
                .filter(Objects::nonNull)  // Lọc ra những UserGroup hợp lệ
                .collect(Collectors.toList());

        // Tạo và trả về GroupResponse với thông tin nhóm và danh sách thành viên
        return GroupResponse.builder()
                .id(group.getId())
                .groupName(group.getGroupName())
                .image(group.getImage())
                .creatorId(group.getCreatorId())
                .createdAt(group.getCreatedAt())
                .userGroups(userGroupsResponse)  // Gán danh sách UserGroupResponse đã được cập nhật thông tin người dùng
                .build();
    }


    // Lấy nhóm theo ID
    @Override
    public Group getGroupById(String groupId) {
        return groupRepository.getGroupById(groupId);
    }

    @Override
    public GroupResponse updateGroup(GroupRequest group) throws GroupException {
        Group existingGroup = groupRepository.getGroupById(group.getId());
        if (existingGroup == null) {
            throw new GroupException("Nhóm không tồn tại.");
        }
        existingGroup.setGroupName(group.getGroupName());
        existingGroup.setImage(group.getImage());
        groupRepository.saveGroup(existingGroup);

        return GroupResponse.builder()
                .id(existingGroup.getId())
                .groupName(existingGroup.getGroupName())
                .image(existingGroup.getImage())
                .creatorId(existingGroup.getCreatorId())
                .createdAt(existingGroup.getCreatedAt())
                .build();
    }

    @Override
    public void sendMessageToGroup(MessageRequest request) throws GroupException {
        Group group = groupRepository.getGroupById(request.getReceiverID());
        if (group == null) {
            throw new GroupException("Nhóm không tồn tại.");
        }

        // Kiểm tra xem người gửi có phải là thành viên của nhóm không
        UserGroup userGroup = groupRepository.getUserGroup(request.getSenderID(), request.getReceiverID());
        if (userGroup == null) {
            throw new GroupException("Người gửi không phải là thành viên của nhóm.");
        }
        Message message = new Message();
        message.setId(java.util.UUID.randomUUID().toString());
        message.setSenderID(request.getSenderID());
        message.setReceiverID(request.getReceiverID());
        message.setContent(request.getContent());
        message.setSendDate(LocalDateTime.now());
        message.setIsRead(false);
        message.setStatus("sent");
        message.setType(request.getType());
        message.setMedia(request.getMedia());
        message.setDeletedBySender(false);
        message.setDeletedByReceiver(false);
        messageRepository.save(message);
    }
}
