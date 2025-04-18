package vn.edu.iuh.fit.repository;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import vn.edu.iuh.fit.model.Group;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.model.UserGroup;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class GroupRepository {
    private final DynamoDbTable<Group> groupTable;
    private final DynamoDbTable<UserGroup> userGroupTable;
    private final DynamoDbTable<User> userTable;

    @Autowired
    public GroupRepository(DynamoDbEnhancedClient enhancedClient) {
        this.groupTable = enhancedClient.table("Group", TableSchema.fromBean(Group.class));
        this.userGroupTable = enhancedClient.table("UserGroup", TableSchema.fromBean(UserGroup.class));
        this.userTable = enhancedClient.table("User", TableSchema.fromBean(User.class));
    }

    // ====================== CRUD CHO GROUP =========================
    public void saveGroup(Group group) {
        groupTable.putItem(group);
    }

    public Group getGroupById(String groupId) {


        return groupTable.getItem(Key.builder().partitionValue(groupId).build());
    }

    public void deleteGroup(String groupId) {
        groupTable.deleteItem(Key.builder().partitionValue(groupId).build());
    }

    public void deleteAllUserGroupsByGroupId(String groupId) {
        List<UserGroup> userGroups = getMembersOfGroup(groupId);
        for (UserGroup ug : userGroups) {
            removeUserFromGroup(ug.getUserId(), groupId);
        }
    }



    // ===================== CRUD CHO UserGroup ======================
    //chỉnh sửa reolo cho thành viên  - Tín
    public void addUserToGroup(UserGroup userGroup) {
        userGroupTable.putItem(userGroup);
    }

    public void removeUserFromGroup(String userId, String groupId) {
        userGroupTable.deleteItem(Key.builder()
                .partitionValue(userId)
                .sortValue(groupId)
                .build());
    }

    public UserGroup getUserGroup(String userId, String groupId) {
        return userGroupTable.getItem(Key.builder()
                .partitionValue(userId)
                .sortValue(groupId)
                .build());
    }

    public List<UserGroup> getMembersOfGroup(String groupId) {
        return userGroupTable.scan().items().stream()
                .filter(item -> item.getGroupId().equals(groupId))
                .collect(Collectors.toList());
    }

    public List<UserGroup> getGroupsOfUser(String userId) {
        return userGroupTable.scan().items().stream()
                .filter(item -> item.getUserId().equals(userId))
                .collect(Collectors.toList());
    }

    // ===================== CRUD CHO User (liên quan group) ==========
    public User getUserById(String userId) {
        return userTable.getItem(Key.builder().partitionValue(userId).build());
    }

    public void updateUser(User user) {
        userTable.putItem(user);
    }
}
