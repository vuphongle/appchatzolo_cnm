package vn.edu.iuh.fit.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import vn.edu.iuh.fit.model.User;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class UserRepository {
    private final DynamoDbTable<User> table;

    @Autowired
    public UserRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table("User", TableSchema.fromBean(User.class));
    }

    public void save(User user) {
        System.out.println("Saving user to DynamoDB: " + user);
        table.putItem(user);
    }

    public User findById(String id) {
        Key key = software.amazon.awssdk.enhanced.dynamodb.Key.builder().partitionValue(id).build();

        return table.query(r -> r.queryConditional(QueryConditional.keyEqualTo(key)))
                .items()
                .stream()
                .findFirst()
                .orElse(null);
    }

    //Find id userr để chat message
    public User findById_ttt(String id) {
        Key key = Key.builder().partitionValue(id).build();
        return table.getItem(key); // Sử dụng getItem thay vì query
    }

    public User findByPhoneNumber(String phoneNumber) {
        return table.scan().items().stream()
                .filter(user -> user.getPhoneNumber().equals(phoneNumber))
                .findFirst()
                .orElse(null);
    }

    public List<User> findAllUsers() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    public List<User> findByNameContainingIgnoreCase(String name, String userId) {
        List<User> friends = findFriendsByUserId(userId);

        return friends.stream()
                .filter(user -> user.getName().toLowerCase().contains(name.toLowerCase()))
                .collect(Collectors.toList());
    }

    public List<User> findFriendsByUserId(String userId) {
        User user = findById(userId);
        if (user == null || user.getFriendIds() == null) return List.of();

        // Lọc danh sách bạn bè từ danh sách user
        return table.scan().items().stream()
                .filter(u -> user.getFriendIds().contains(u.getId()))
                .collect(Collectors.toList());
    }

    public boolean removeFriend(String userId, String friendId) {
        User user = findById_ttt(userId);
        User friend = findById_ttt(friendId);

        if (user == null || friend == null || user.getFriendIds() == null || friend.getFriendIds() == null) {
            return false; // Nếu không tìm thấy user hoặc friend, hoặc không có danh sách bạn bè
        }

        boolean removedFromUser = user.getFriendIds().remove(friendId);
        boolean removedFromFriend = friend.getFriendIds().remove(userId);

        if (removedFromUser || removedFromFriend) {
            save(user);
            save(friend);
            return true;
        }
        return false;
    }

}
