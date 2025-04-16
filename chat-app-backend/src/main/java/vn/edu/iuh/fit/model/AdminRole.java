package vn.edu.iuh.fit.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

@DynamoDbBean
public class AdminRole {
    // loại bo entity này vi khong can thiet nữa /// tín làm
    private String roleName;
    private String permissions;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("roleName")
    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    @DynamoDbAttribute("permissions")
    public String getPermissions() {
        return permissions;
    }

    public void setPermissions(String permissions) {
        this.permissions = permissions;
    }
}
