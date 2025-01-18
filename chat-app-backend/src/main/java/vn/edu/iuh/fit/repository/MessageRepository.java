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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class MessageRepository {

    private final DynamoDbTable<Message> table;
    private final DynamoDbTable<User> userTable; // Bảng User

    @Autowired
    public MessageRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table("Message", TableSchema.fromBean(Message.class));
        this.userTable = enhancedClient.table("User", TableSchema.fromBean(User.class));
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

    // Xóa lời mời kết bạn theo senderID và receiverID
    public void deleteInvitation(String senderID, String receiverID) {
        // Sử dụng scan để tìm tất cả các item phù hợp
        List<Message> messagesToDelete = table.scan().items().stream()
                .filter(message -> message.getSenderID().equals(senderID) && message.getReceiverID().equals(receiverID) && message.getStatus().equals("Chờ đồng ý"))
                .collect(Collectors.toList());

        for (Message message : messagesToDelete) {
            try {
                Key key = Key.builder().partitionValue(message.getId()).build();

                table.deleteItem(key);  // Xóa item
                System.out.println("Deleted message: " + message);
            } catch (Exception e) {
                System.err.println("Error deleting message: " + e.getMessage());
            }
        }
    }

    // Cập nhật trạng thái của lời mời kết bạn thành "Đã kết bạn"
    public void updateInvitationStatus(String senderID, String receiverID, String newStatus) {
        List<Message> messagesInvitationUpdate = table.scan().items().stream()
                .filter(message -> message.getSenderID().equals(senderID) && message.getReceiverID().equals(receiverID))
                .collect(Collectors.toList());

        for (Message message : messagesInvitationUpdate) {
            message.setStatus(newStatus);  // Cập nhật trạng thái lời mời

            Key key = Key.builder().partitionValue(message.getId()).build();
            table.putItem(message);  // Lưu lại bản ghi đã cập nhật
            System.out.println("Updated message: " + message);
        }
    }

    // Cập nhật friendIds của người gửi và người nhận
    public void submitFriend(String senderID, String receiverID) {
        // Tìm user gửi và nhận
        User sender = userTable.getItem(Key.builder().partitionValue(senderID).build());
        User receiver = userTable.getItem(Key.builder().partitionValue(receiverID).build());

        if (sender == null || receiver == null) {
            System.out.println("User not found");
            return;
        }

        // Thêm ID người nhận vào danh sách bạn bè của người gửi
        if (sender.getFriendIds() == null) {
            sender.setFriendIds(new ArrayList<>());
        }
        sender.getFriendIds().add(receiverID);

        // Thêm ID người gửi vào danh sách bạn bè của người nhận
        if (receiver.getFriendIds() == null) {
            receiver.setFriendIds(new ArrayList<>());
        }
        receiver.getFriendIds().add(senderID);

        // Cập nhật lại thông tin của người gửi và người nhận trong DynamoDB
        userTable.putItem(sender);
        userTable.putItem(receiver);

        System.out.println("Added friend relationship between: " + senderID + " and " + receiverID);
    }
}
