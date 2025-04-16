package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.model.Group;
import vn.edu.iuh.fit.model.GroupRole;
import vn.edu.iuh.fit.model.User;

import java.util.List;

public interface GroupService {
    void createGroup(Group group, String creatorId);
    void updateGroupInfo(String groupId, String newName, String newImage);
    void deleteGroup(String userId, String groupId);

    void addMember(String groupId, String userId);
    void removeMember(String groupId, String targetUserId, String actorUserId);
    void promoteToCoLeader(String groupId, String targetUserId, String promoterId);
    void demoteToMember(String groupId, String targetUserId, String promoterId);

    GroupRole getUserRole(String groupId, String userId);
    boolean isLeader(String groupId, String userId);
    List<User> getGroupMembers(String groupId);
    Group getGroupById(String groupId);

}
