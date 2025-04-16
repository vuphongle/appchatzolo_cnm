package vn.edu.iuh.fit.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

@DynamoDbBean
public class UserGroup {
    private String userId;
    private String groupId;
    private String joinDate; // ISO format
    private GroupRole role; // trưởng nhóm || phó nhóm|| thành viên

    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("groupId")
    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    @DynamoDbAttribute("joinDate")
    public String getJoinDate() {
        return joinDate;
    }

    public void setJoinDate(String joinDate) {
        this.joinDate = joinDate;
    }

    @DynamoDbAttribute("role")
    public String getRole() {
        return role != null ? role.name() : null;
    }

    public void setRole(String role) {
        this.role = role != null ? GroupRole.valueOf(role) : null;
    }
}
