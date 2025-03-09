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

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
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
                .filter(message ->
                        message.getReceiverID() != null &&
                                message.getStatus() != null &&
                                message.getReceiverID().equals(senderID) &&
                                message.getStatus().equals("Chờ đồng ý")
                )
                .collect(Collectors.toList());
    }



    //Tìm danh sách các lời mời đã gửi đi
    public List<Message> findSentInvitationsBySenderId(String receiverID) {
        return table.scan().items().stream()
                .filter(message ->
                        message.getSenderID() != null &&
                                message.getStatus() != null &&
                                message.getSenderID().equals(receiverID) &&
                                message.getStatus().equals("Chờ đồng ý")
                )
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

    // Lấy tất cả tin nhắn giữa người gửi và người nhận
    public List<Message> findMessagesBetweenUsers(String senderID, String receiverID) {
        return table.scan().items().stream()
                .filter(message ->
                        (message.getSenderID().equals(senderID) && message.getReceiverID().equals(receiverID)) ||
                                (message.getSenderID().equals(receiverID) && message.getReceiverID().equals(senderID)))
                .collect(Collectors.toList());
    }


    //hàm tăng tốc độ lấy tin nhắn
    public List<Message> findUnreadMessages(String receiverID, String senderID) {
        Key key = Key.builder().partitionValue(receiverID).build(); // Chỉ truy vấn tin nhắn đến receiverID

        return table.query(r -> r.queryConditional(
                        QueryConditional.keyEqualTo(key) // Điều kiện chính: receiverID là partition key
                ))
                .items()
                .stream()
                .filter(message ->
                        message.getSenderID().equals(senderID) && !message.getIsRead() // Chỉ lấy tin chưa đọc
                )
                .collect(Collectors.toList());
    }

    // 🔹 Thêm phương thức lưu tất cả tin nhắn đã đọc
    public void saveReadMess(List<Message> messages) {
        for (Message message : messages) {
            table.putItem(message);
        }
    }
    public Message findLatestMessageBetweenUsers(String senderID, String receiverID) {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh"); // Chuyển đổi về múi giờ Việt Nam

        return table.scan().items().stream()
                .filter(message ->
                        (message.getSenderID().equals(senderID) && message.getReceiverID().equals(receiverID)) ||
                                (message.getSenderID().equals(receiverID) && message.getReceiverID().equals(senderID)))
                .max(Comparator.comparing(m -> m.getSendDate().atZone(zoneId).toInstant())) // So sánh theo múi giờ Việt Nam
                .orElse(null);
    }

    public int getUnreadMessagesCount(String receiverID, String senderID) {
        List<Message> unreadMessages = table.scan().items().stream()
                .filter(message -> message.getReceiverID().equals(receiverID)
                        && message.getSenderID().equals(senderID)
                        && !message.getIsRead())
                .collect(Collectors.toList());
        return unreadMessages.size();
    }


    public List<String> getFriendsList(String receiverID) {
        User user = userTable.getItem(Key.builder().partitionValue(receiverID).build());
        return user.getFriendIds();
    }
}
