package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupRequest;
import vn.edu.iuh.fit.model.DTO.request.MessageRequest;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.Group;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.model.UserGroup;

import java.util.List;

public interface GroupService {
    GroupResponse createGroup(GroupRequest group) throws GroupException;

    // Lấy danh sách nhóm của 1 người dùng trong UserGroup
    List<GroupResponse> getGroupsByUserId(String userId);

    void updateGroupInfo(String groupId, String newName, String newImage);
    void deleteGroup(String userId, String groupId) throws GroupException;

    GroupResponse addMember(GroupRequest group) throws GroupException;
    void removeMember(String groupId, String targetUserId, String actorUserId) throws GroupException;
    void promoteToCoLeader(String groupId, String targetUserId, String promoterId)throws GroupException;
    void demoteToMember(String groupId, String targetUserId, String promoterId)throws GroupException;

    GroupRole getUserRole(String groupId, String userId);
    boolean isLeader(String groupId, String userId);
    List<UserGroup> getGroupMembers(String groupId) throws GroupException;
    Group getGroupById(String groupId);
    GroupResponse updateGroup(GroupRequest group) throws GroupException;
    void sendMessageToGroup (MessageRequest request) throws GroupException;

}
