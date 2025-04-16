package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.request.GroupResquest;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.Group;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.User;

import java.util.List;

public interface GroupService {
    GroupResponse createGroup(GroupResquest group) throws GroupException;
    void updateGroupInfo(String groupId, String newName, String newImage);
    void deleteGroup(String userId, String groupId) throws GroupException;

    GroupResponse addMember(GroupResquest group) throws GroupException;
    void removeMember(String groupId, String targetUserId, String actorUserId);
    void promoteToCoLeader(String groupId, String targetUserId, String promoterId)throws GroupException;
    void demoteToMember(String groupId, String targetUserId, String promoterId)throws GroupException;

    GroupRole getUserRole(String groupId, String userId);
    boolean isLeader(String groupId, String userId);
    List<User> getGroupMembers(String groupId);
    Group getGroupById(String groupId);
    GroupResponse updateGroup(GroupResquest group) throws GroupException;

}
