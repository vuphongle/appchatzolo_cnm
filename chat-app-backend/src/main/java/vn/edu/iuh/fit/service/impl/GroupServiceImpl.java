package vn.edu.iuh.fit.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;
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

        // Gửi thông báo WebSocket đến tất cả thành viên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        List<UserGroup> userGroups = groupRepository.getMembersOfGroup(newGroup.getId());
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendCreateGroupNotification(memberId, newGroup, userGroups);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending GROUP_CREATED notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }

        return GroupResponse.builder()
                .id(newGroup.getId())
                .groupName(newGroup.getGroupName())
                .image(newGroup.getImage())
                .creatorId(newGroup.getCreatorId())
                .createdAt(newGroup.getCreatedAt())
                .build();
    }

    // Lấy danh sách nhóm của 1 người dùng trong UserGroup
    @Override
    public List<GroupResponse> getGroupsByUserId(String userId) {
        List<UserGroup> userGroups = groupRepository.getGroupsOfUser(userId);
        List<GroupResponse> groupResponses = new ArrayList<>();

        for (UserGroup userGroup : userGroups) {
            Group group = groupRepository.getGroupById(userGroup.getGroupId());
            if (group != null) {
                GroupResponse groupResponse = GroupResponse.builder()
                        .id(group.getId())
                        .groupName(group.getGroupName())
                        .image(group.getImage())
                        .creatorId(group.getCreatorId())
                        .createdAt(group.getCreatedAt())
                        .build();
                groupResponses.add(groupResponse);
            }
        }
        return groupResponses;
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
            throw new GroupException("Chỉ nhóm trưởng mới có quyền xóa nhóm.");
        }

        // 2. Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        List<String> memberIds = members.stream()
                .map(UserGroup::getUserId)
                .toList();

        // 3. Xóa tất cả UserGroup liên quan đến nhóm
        groupRepository.deleteAllUserGroupsByGroupId(groupId);

        // 4. Xóa nhóm
        groupRepository.deleteGroup(groupId);

        // 5. Cập nhật groupIds của tất cả thành viên
        for (String memberId : memberIds) {
            User user = userRepository.findById(memberId);
            if (user != null && user.getGroupIds() != null) {
                user.getGroupIds().remove(groupId);
                userRepository.save(user);
            }
        }
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        // 6. Gửi thông báo WebSocket đến tất cả thành viên
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendGroupDeletedNotification(memberId, groupId);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending GROUP_DELETED notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }
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
                // Gửi thông báo WebSocket đến tất cả thành viên
                List<String> allMemberIds = new ArrayList<>(currentMemberIds);
                allMemberIds.addAll(memberIds);

                for (String newMemberId : memberIds) {
                    for (String receiverId : allMemberIds) {
                        myWebSocketHandler.sendAddToGroupNotification(receiverId, groupId, newMemberId);
                    }
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
        // 1. Kiểm tra quyền của người thực hiện
        GroupRole actorRole = getUserRole(groupId, actorUserId);
        GroupRole targetRole = getUserRole(groupId, targetUserId);

        if (actorRole == null) {
            throw new GroupException("Người thực hiện không phải thành viên nhóm.");
        }

        if (targetRole == null) {
            throw new GroupException("Người bị xóa không phải thành viên nhóm.");
        }

        // Chỉ LEADER hoặc CO_LEADER được xóa thành viên, và CO_LEADER không được xóa LEADER
        if (actorRole == GroupRole.LEADER || (actorRole == GroupRole.CO_LEADER && targetRole == GroupRole.MEMBER)) {
            // 2. Xóa thành viên khỏi nhóm
            groupRepository.removeUserFromGroup(targetUserId, groupId);

            // 3. Cập nhật groupIds của người bị xóa
            User targetUser = userRepository.findById(targetUserId);
            if (targetUser != null && targetUser.getGroupIds() != null) {
                targetUser.getGroupIds().remove(groupId);
                userRepository.save(targetUser);
            }   

            // 4. Lấy danh sách thành viên trong nhóm để gửi thông báo
            List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
            List<String> memberIds = members.stream()
                    .map(UserGroup::getUserId)
                    .collect(Collectors.toCollection(ArrayList::new));

            // Thêm targetUserId vào danh sách để thông báo cho cả người bị xóa
            if (!memberIds.contains(targetUserId)) {
                memberIds.add(targetUserId);
            }
            MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
            // 5. Gửi thông báo WebSocket đến tất cả thành viên
            if (myWebSocketHandler != null) {
                try {
                    for (String memberId : memberIds) {
                        myWebSocketHandler.sendMemberRemovedNotification(memberId, groupId, targetUserId);
                    }
                } catch (JsonProcessingException e) {
                    System.err.println("Error sending MEMBER_REMOVED notification: " + e.getMessage());
                }
            } else {
                System.err.println("WebSocketHandler is not available. Cannot send notifications.");
            }
        } else {
            throw new GroupException("Bạn không có quyền xóa người dùng này.");
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

        // Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        List<String> memberIds = members.stream()
                .map(UserGroup::getUserId)
                .toList();

        // Gửi thông báo WebSocket đến tất cả thành viên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendPromoteToCoLeader(memberId, groupId, targetUserId);
                }
                // Thông báo cho các thành viên hiện tại của nhóm (người đã có trong nhóm)
                for (String existingMemberId : memberIds) {
                    myWebSocketHandler.sendGroupUpdateNotification(existingMemberId, groupId);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending CO_LEADER notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
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

        // Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        List<String> memberIds = members.stream()
                .map(UserGroup::getUserId)
                .toList();

        // Gửi thông báo WebSocket đến tất cả thành viên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendDemoteToMember(memberId, groupId, targetUserId);
                }
                // Thông báo cho các thành viên hiện tại của nhóm (người đã có trong nhóm)
                for (String existingMemberId : memberIds) {
                    myWebSocketHandler.sendGroupUpdateNotification(existingMemberId, groupId);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending demoteToMember notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }
    }

    // Rời nhóm
    @Override
    public void leaveGroup(String groupId, String currentLeaderId, String newLeaderId) throws GroupException {
        // Kiểm tra người dùng có phải là thành viên của nhóm không
        UserGroup currentLeader = groupRepository.getUserGroup(currentLeaderId, groupId);
        if (currentLeader == null) {
            throw new GroupException("Người dùng không phải là thành viên của nhóm.");
        }

        // Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        if (members == null || members.isEmpty()) {
            throw new GroupException("Nhóm không tồn tại hoặc không có thành viên.");
        }
        String leaverName = userRepository.findById(currentLeaderId).getName();
        // Xử lý trường hợp người dùng là nhóm trưởng
        if (currentLeader.getRole().equals(GroupRole.LEADER.name())) {
            if (members.size() <= 1) {
                // Nếu chỉ có nhóm trưởng trong nhóm, giải tán nhóm
                groupRepository.deleteGroup(groupId);
                System.out.println("Nhóm " + groupId + " đã được giải tán vì không còn thành viên nào.");

                // Cập nhật groupIds của người dùng
                User user = userRepository.findById(currentLeaderId);
                if (user != null && user.getGroupIds() != null) {
                    user.getGroupIds().remove(groupId);
                    userRepository.save(user);
                    System.out.println("Đã xóa groupId " + groupId + " khỏi danh sách groupIds của người dùng " + currentLeaderId);
                }

                // Gửi thông báo LEAVE_GROUP tới người dùng
                MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
                if (myWebSocketHandler != null) {
                    try {
                        myWebSocketHandler.sendLeaveGroupNotification(currentLeaderId, groupId, leaverName);
                        System.out.println("Đã gửi thông báo LEAVE_GROUP tới người dùng " + currentLeaderId + " cho nhóm " + groupId);
                    } catch (JsonProcessingException e) {
                        System.err.println("Lỗi khi gửi thông báo LEAVE_GROUP tới người dùng " + currentLeaderId + ": " + e.getMessage());
                    }
                } else {
                    System.err.println("WebSocketHandler không khả dụng. Không thể gửi thông báo LEAVE_GROUP.");
                }
                return;
            }

            // Kiểm tra và chuyển vai trò nhóm trưởng
            if (newLeaderId == null || newLeaderId.isEmpty() || newLeaderId.equals("null")) {
                throw new GroupException("Vui lòng chọn thành viên khác làm nhóm trưởng trước khi rời nhóm.");
            }

            UserGroup newLeader = groupRepository.getUserGroup(newLeaderId, groupId);
            if (newLeader == null) {
                throw new GroupException("Người được chọn không phải là thành viên của nhóm.");
            }

            newLeader.setRole(GroupRole.LEADER.name());
            groupRepository.addUserToGroup(newLeader);
            System.out.println("Đã chuyển vai trò nhóm trưởng cho người dùng " + newLeaderId + " trong nhóm " + groupId);
        }

        // Xóa người dùng khỏi nhóm
        groupRepository.removeUserFromGroup(currentLeaderId, groupId);
        System.out.println("Đã xóa người dùng " + currentLeaderId + " khỏi nhóm " + groupId);

        // Cập nhật groupIds của người dùng
        User user = userRepository.findById(currentLeaderId);
        if (user != null && user.getGroupIds() != null) {
            user.getGroupIds().remove(groupId);
            userRepository.save(user);
            System.out.println("Đã xóa groupId " + groupId + " khỏi danh sách groupIds của người dùng " + currentLeaderId);
        }

        // Gửi thông báo LEAVE_GROUP và GROUP_UPDATE
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                // Gửi thông báo LEAVE_GROUP tới tất cả thành viên (bao gồm cả người rời nhóm)


                for (UserGroup member : members) {
                    myWebSocketHandler.sendLeaveGroupNotification(member.getUserId(), groupId, leaverName);
                    System.out.println("Đã gửi thông báo LEAVE_GROUP tới người dùng " + member.getUserId() + " cho nhóm " + groupId);
                }


                // Gửi thông báo GROUP_UPDATE tới tất cả thành viên còn lại trong nhóm
//                members = groupRepository.getMembersOfGroup(groupId); // Lấy lại danh sách thành viên sau khi xóa
                    for (UserGroup member : members) {
                        if (!member.getUserId().equals(currentLeaderId)) { // Không gửi lại cho người đã rời
                            myWebSocketHandler.sendGroupUpdateNotification(member.getUserId(), groupId);
                            System.out.println("Đã gửi thông báo GROUP_UPDATE tới người dùng " + member.getUserId() + " cho nhóm " + groupId);
                        }
                    }
            } catch (JsonProcessingException e) {
                System.err.println("Lỗi khi gửi thông báo WebSocket: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler không khả dụng. Không thể gửi thông báo.");
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
    public GroupResponse getGroupById(String groupId) throws GroupException {
        // Kiểm tra xem nhóm có tồn tại hay không
        Group group = groupRepository.getGroupById(groupId);
        if (group == null) {
            throw new GroupException("Nhóm không tồn tại.");
        }
        return GroupResponse.builder()
                .id(group.getId())
                .groupName(group.getGroupName())
                .image(group.getImage())
                .creatorId(group.getCreatorId())
                .createdAt(group.getCreatedAt())
                .build();
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

        // Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(group.getId());
        List<String> memberIds = members.stream()
                .map(UserGroup::getUserId)
                .toList();

        // Gửi thông báo WebSocket đến tất cả thành viên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendGroupUpdateInfoNotification(memberId, group.getId(), group.getGroupName(), group.getImage());
                }
                // Thông báo cho các thành viên hiện tại của nhóm (người đã có trong nhóm)
                for (String existingMemberId : memberIds) {
                    myWebSocketHandler.sendGroupUpdateNotification(existingMemberId, group.getId());
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending GROUP_UPDATE notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }

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


        // Sau khi lưu tin nhắn, gọi WebSocket để gửi tin nhắn đến tất cả thành viên trong nhóm
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                myWebSocketHandler.sendGroupChatMessage(request.getReceiverID(), message); // Gửi tin nhắn nhóm
            } catch (GroupException e) {
                System.err.println("Error sending group chat message: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available.");
        }
    }

    @Override
    public GroupResponse promoteToLeader(String groupId, String targetUserId, String actorUserId) throws GroupException {
        // Kiểm tra quyền của người thực hiện
        GroupRole actorRole = getUserRole(groupId, actorUserId);
        if (actorRole == null) {
            throw new GroupException("Người thực hiện không phải thành viên nhóm.");
        }
        if (actorRole != GroupRole.LEADER) {
            throw new GroupException("Chỉ nhóm trưởng mới có quyền thăng chức.");
        }
        // Kiểm tra xem người được thăng chức có phải là thành viên của nhóm không
        GroupRole targetRole = getUserRole(groupId, targetUserId);
        if (targetRole == null) {
            throw new GroupException("Người được thăng chức không phải thành viên nhóm.");
        }
        if (targetRole == GroupRole.LEADER) {
            throw new GroupException("Người được thăng chức đã là nhóm trưởng.");
        }
        // Thăng chức người dùng
        UserGroup ug = groupRepository.getUserGroup(targetUserId, groupId);
        if (ug != null) {
            ug.setRole(GroupRole.LEADER.name());
            groupRepository.addUserToGroup(ug);
        }
        // Hạ quyền người dùng cũ xuống phó nhóm
        UserGroup oldLeader = groupRepository.getUserGroup(actorUserId, groupId);
        if (oldLeader != null) {
            oldLeader.setRole(GroupRole.CO_LEADER.name());
            groupRepository.addUserToGroup(oldLeader);
        }

        // Lấy danh sách thành viên của nhóm
        List<UserGroup> members = groupRepository.getMembersOfGroup(groupId);
        List<String> memberIds = members.stream()
                .map(UserGroup::getUserId)
                .toList();
        // Gửi thông báo WebSocket đến tất cả thành viên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                for (String memberId : memberIds) {
                    myWebSocketHandler.sendPromoteToLeader(memberId, groupId, targetUserId);
                }
                // Thông báo cho các thành viên hiện tại của nhóm (người đã có trong nhóm)
                for (String existingMemberId : memberIds) {
                    myWebSocketHandler.sendGroupUpdateNotification(existingMemberId, groupId);
                }
            } catch (JsonProcessingException e) {
                System.err.println("Error sending promoteToLeader notification: " + e.getMessage());
            }
        } else {
            System.err.println("WebSocketHandler is not available. Cannot send notifications.");
        }

        return GroupResponse.builder()
                .id(groupId)
                .groupName(groupRepository.getGroupById(groupId).getGroupName())
                .image(groupRepository.getGroupById(groupId).getImage())
                .creatorId(groupRepository.getGroupById(groupId).getCreatorId())
                .createdAt(java.time.LocalDate.now().toString())
                .build();
    }
}
