package vn.edu.iuh.fit.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

import java.util.List;

@DynamoDbBean
public class User {
    private String id;
    private String name;
    private String avatar;
    private String phoneNumber;
    private String date; // ISO format
    private String passWord; // Hash
    private List<String> friendIds; // Danh sách bạn bè (Denormalization)
    private List<String> groupIds; // Danh sách nhóm tham gia (Denormalization)

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @DynamoDbAttribute("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @DynamoDbAttribute("avatar")
    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    @DynamoDbAttribute("phoneNumber")
    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    @DynamoDbAttribute("date")
    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    @DynamoDbAttribute("passWord")
    public String getPassWord() {
        return passWord;
    }

    public void setPassWord(String passWord) {
        this.passWord = passWord;
    }

    @DynamoDbAttribute("friendIds")
    public List<String> getFriendIds() {
        return friendIds;
    }

    public void setFriendIds(List<String> friendIds) {
        this.friendIds = friendIds;
    }

    @DynamoDbAttribute("groupIds")
    public List<String> getGroupIds() {
        return groupIds;
    }

    public void setGroupIds(List<String> groupIds) {
        this.groupIds = groupIds;
    }
}
