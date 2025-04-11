package vn.edu.iuh.fit.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.model.DTO.ForwardRequest;
import vn.edu.iuh.fit.model.DTO.UnreadMessagesCountDTO;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.service.MessageService;
import vn.edu.iuh.fit.service.impl.MessageServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;
    private final MessageServiceImpl messageServiceImpl;


    @Autowired
    public MessageController(MessageService service, MessageServiceImpl messageServiceImpl) {
        this.service = service;
        this.messageServiceImpl = messageServiceImpl;
    }

    //Gửi lời mời kết bạn và lưu tin nhắn người dùng gửi
    @PostMapping("/addFriend")
    public void sendMessage(@RequestBody Message message) throws JsonProcessingException {
        System.out.println("Received message: " + message);
        service.sendMessage(message);
    }

    //Tìm danh sách lời mời kết bạn
    @GetMapping("/invitations/received/{receiverId}")
    public ResponseEntity<List<Message>> getReceivedInvitations(@PathVariable String receiverId) {
        List<Message> invitations = service.getInvitationsByReceiverId(receiverId);
        return ResponseEntity.ok(invitations);
    }

    //Tìm danh sách các lời mời đã gửi đi
    @GetMapping("/invitations/sent/{senderId}")
    public ResponseEntity<List<Message>> getSentInvitations(@PathVariable String senderId) {
        List<Message> sentInvitations = service.getSentInvitationsBySenderId(senderId);
        return ResponseEntity.ok(sentInvitations);
    }

    // Xóa lời mời kết bạn (thu hồi hoặc từ chối)
    @DeleteMapping("/invitations/{senderId}/{receiverId}")
    public ResponseEntity<String> deleteInvitation(@PathVariable String senderId, @PathVariable String receiverId) throws JsonProcessingException {
        service.deleteInvitation(senderId, receiverId);
        return ResponseEntity.ok("Lời mời đã bị xóa thành công.");
    }

    //Đếm số lời mời kết bạn
    @GetMapping("/invitations/count/{senderId}/{receiverId}")
    public ResponseEntity<Integer> countInvitation(@PathVariable String senderId, @PathVariable String receiverId) {
        int count = service.countInvitation(senderId, receiverId);
        return ResponseEntity.ok(count);
    }

    // Xử lý đồng ý kết bạn
    @PostMapping("/acceptFriendRequest/{senderId}/{receiverId}")
    public ResponseEntity<String> acceptFriendRequest(
            @PathVariable String senderId,
            @PathVariable String receiverId) {
        try {
            // Gọi service để đồng ý kết bạn
            boolean isAccepted = service.acceptFriendRequest(senderId, receiverId);

            if (isAccepted) {
                return ResponseEntity.ok("Lời mời kết bạn đã được chấp nhận!");
            } else {
                return ResponseEntity.status(400).body("Lỗi khi đồng ý kết bạn!");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Có lỗi xảy ra: " + e.getMessage());
        }
    }

    // lấy lịch sử tin nhắn giữa hai người.
    @GetMapping("/messages")
    public ResponseEntity<List<Message>> getMessages(
            @RequestParam String senderID,
            @RequestParam String receiverID) {
        List<Message> messages = service.getMessagesBetweenUsers(senderID, receiverID);
        return ResponseEntity.ok(messages);
    }

    //trạng thái đã xem / chưa xem message
    @GetMapping("/messages/unread/{receiverID}/{senderID}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable String receiverID, @PathVariable String senderID) {
        List<Message> unreadMessages = service.findUnreadMessages(receiverID, senderID);
        return ResponseEntity.ok(unreadMessages);
    }
    // trạng thái đọc tin nhắn
    @PutMapping("/messages/read/{receiverID}/{senderID}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable String receiverID, @PathVariable String senderID) {
        List<Message> messages = service.getMessagesBetweenUsers(receiverID, senderID);

        for (Message message : messages) {
            if (!message.getIsRead()) {
                message.setIsRead(true); // Đánh dấu là đã đọc
            }
        }
        System.out.println("Marked messages as read: " + messages);
        service.saveReadMess(messages); // 🔹 Lưu trạng thái vào DB

        return ResponseEntity.ok("Messages marked as read");
    }
    // tin nhăn mới nhất
    @GetMapping("/latest-message")
    public ResponseEntity<Message> getLatestMessage(
            @RequestParam String senderID,
            @RequestParam String receiverID) {
        Message latestMessage = service.getLatestMessageBetweenUsers(senderID, receiverID);
        return latestMessage != null ? ResponseEntity.ok(latestMessage) : ResponseEntity.noContent().build();
    }

    //lấy tin nhắn chưa đọc từ các bạn bè
    @GetMapping("/messages/unread-count/{receiverID}")
    public ResponseEntity<List<UnreadMessagesCountDTO>> getUnreadCountForAllFriends(@PathVariable String receiverID) {
        List<UnreadMessagesCountDTO> unreadCounts = service.getUnreadCountForAllFriends(receiverID); // Gọi service để lấy số lượng tin nhắn chưa đọc
        return ResponseEntity.ok(unreadCounts);
    }

    // Xóa đoạn chat giữa hai người
    @DeleteMapping("/delete-chat/{senderID}/{receiverID}")
    public ResponseEntity<String> deleteChatBetweenUsers(
            @PathVariable String senderID,
            @PathVariable String receiverID) {
        if (senderID == null || senderID.trim().isEmpty() || receiverID == null || receiverID.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("senderID và receiverID không được để trống.");
        }
        try {
            List<Message> messages = service.getMessagesBetweenUsers(senderID, receiverID);
            if (messages.isEmpty()) {
                return ResponseEntity.ok("Không có tin nhắn nào để xóa giữa " + senderID + " và " + receiverID + ".");
            }
            service.deleteMessagesBetweenUsers(senderID, receiverID);
            return ResponseEntity.ok("Đoạn chat đã được xóa thành công.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi khi xóa đoạn chat: " + e.getMessage());
        }
    }

    // Thu hồi tin nhắn
    @DeleteMapping("/recall/{messageId}/{senderID}/{receiverID}")
    public ResponseEntity<String> recallMessage(@PathVariable String messageId,
                                                @PathVariable String senderID,
                                                @PathVariable String receiverID) {
        try {
            service.recallMessage(messageId, senderID, receiverID);
            return ResponseEntity.ok("Tin nhắn được thu hồi thành công.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi thu hồi tin nhắn: " + e.getMessage());
        }
    }

    // chia sẻ tin nhắn
    @PostMapping("/forward")
    public ResponseEntity<String> forwardMessage(@RequestBody ForwardRequest request) {
        try {
            service.forwardMessage(request.getOriginalMessageId(), request.getSenderID(), request.getReceiverIDs());
            return ResponseEntity.ok("Chia sẻ thành công.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi chia sẻ tin nhắn: " + e.getMessage());
        }
    }

}
