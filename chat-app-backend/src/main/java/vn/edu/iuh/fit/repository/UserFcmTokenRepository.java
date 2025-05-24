package vn.edu.iuh.fit.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import vn.edu.iuh.fit.model.UserFcmToken;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserFcmTokenRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    private DynamoDbTable<UserFcmToken> getTable() {
        return enhancedClient.table("UserFcmToken", TableSchema.fromBean(UserFcmToken.class));
    }

    public Optional<UserFcmToken> findByUserId(String userId) {
        UserFcmToken item = getTable().getItem(r -> r.key(k -> k.partitionValue(userId)));
        return Optional.ofNullable(item);
    }

    public void save(UserFcmToken userFcmToken) {
        getTable().putItem(userFcmToken);
    }

    public void deleteByUserId(String userId) {
        getTable().deleteItem(r -> r.key(k -> k.partitionValue(userId)));
    }
}
