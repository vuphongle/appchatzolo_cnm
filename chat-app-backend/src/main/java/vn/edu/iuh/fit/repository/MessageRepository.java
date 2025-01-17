package vn.edu.iuh.fit.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.model.User;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class MessageRepository {

    private final DynamoDbTable<Message> table;

    @Autowired
    public MessageRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table("Message", TableSchema.fromBean(Message.class));
    }

    public void save(Message message) {
        System.out.println("Saving message to DynamoDB: " + message);
        table.putItem(message);
    }


    //Tìm danh sách lời mời kết bạn
    public List<Message> findInvitationsByReceiverId(String senderID) {
        return table.scan().items().stream()
                .filter(message -> message.getReceiverID().equals(senderID) && message.getStatus().equals("Chờ đồng ý"))
                .collect(Collectors.toList());
    }

    //Tìm danh sách các lời mời đã gửi đi
    public List<Message> findSentInvitationsBySenderId(String receiverID) {
        return table.scan().items().stream()
                .filter(message -> message.getSenderID().equals(receiverID) && message.getStatus().equals("Chờ đồng ý"))
                .collect(Collectors.toList());
    }

}
