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

    //tín làm find id userr để chat message
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
}
