package vn.edu.iuh.fit.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.response.GroupResponse;
import vn.edu.iuh.fit.model.DTO.response.UserGroupResponse;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.model.UserGroup;
import vn.edu.iuh.fit.repository.GroupRepository;
import vn.edu.iuh.fit.service.GroupService;
import vn.edu.iuh.fit.service.MessageService;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MyWebSocketHandler extends TextWebSocketHandler {
    // Lưu trữ tất cả kết nối WebSocket theo userId
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final MessageService messageService;

    public MyWebSocketHandler(MessageService messageService) {
        this.messageService = messageService;
        this.objectMapper.registerModule(new JavaTimeModule());

    }


    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            sessions.put(userId, session);
            System.out.println("User connected: " + userId);
        }
    }

//    @Override
//    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
//        String payload = message.getPayload();
//        Message chatMessage = objectMapper.readValue(payload, Message.class);
//
//        String receiverId = chatMessage.getReceiverID(); // ID người nhận
//        WebSocketSession receiverSession = sessions.get(receiverId);
//
//        // Gửi tin nhắn cho người nhận nếu họ đang online
//        if (receiverSession != null && receiverSession.isOpen()) {
//            receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
//        } else {
//            System.out.println("Receiver is offline. Message cannot be delivered in real-time.");
//        }
//
//        // Lưu tin nhắn vào DynamoDB
//        saveMessageToDatabase(chatMessage);
//    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Received message: " + payload);
        try {
            Message chatMessage = objectMapper.readValue(payload, Message.class);

            String receiverId = chatMessage.getReceiverID();
            WebSocketSession receiverSession = sessions.get(receiverId);

            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
                System.out.println("Message delivered to user: " + receiverId);
            } else {
                System.out.println("Receiver " + receiverId + " is offline. Message stored in database.");
            }

            saveMessageToDatabase(chatMessage); // Lưu tin nhắn vào DynamoDB
        } catch (Exception e) {
            System.err.println("Error handling message: " + e.getMessage());
        }
    }


    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        String userId = getUserIdFromSession(session);
        if (userId != null) {
            sessions.remove(userId);
            System.out.println("User disconnected: " + userId);
        }
    }

    private String getUserIdFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.startsWith("userId=")) {
            return query.replace("userId=", "");
        }
        return null; // Trả về null nếu không có userId
    }

    private void saveMessageToDatabase(Message message) {
        try {
            messageService.sendMessage(message); // Sử dụng MessageService để lưu
            System.out.println("Message saved to database: " + message);
        } catch (Exception e) {
            System.err.println("Error saving message to database: " + e.getMessage());
        }
    }

    public void sendFriendRequestNotification(String receiverId, int updatedCount) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            System.out.println("-------------------------------------------------------------------------");
            payload.put("type", "FRIEND_REQUEST");  // Loại thông báo
            payload.put("count", updatedCount);       // Số lời mời cập nhật
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Friend request notification sent to user: " + receiverId);
            } catch (Exception e) {
                System.err.println("Error sending friend request notification: " + e.getMessage());
            }
        }
    }

    public void sendRevokeInvitationNotification(String senderId, String receiverId, int updatedCount) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", senderId); // Người gửi lời mời
            payload.put("receiver", receiverId); // Người nhận lời mời
            payload.put("type", "REVOKE_INVITATION");  // Loại thông báo
            payload.put("count", updatedCount);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Friend request notification sent to user: " + receiverId);
            } catch (Exception e) {
                System.err.println("Error sending submit friend notification: " + e.getMessage());
            }
        }
    }

    public void sendRefuseInvitationNotification(String senderId, String receiverId, int updatedCount) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", senderId); // Người gửi lời mời
            payload.put("receiver", receiverId); // Người nhận lời mời
            payload.put("type", "REFUSE_INVITATION");  // Loại thông báo
            payload.put("count", updatedCount);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Friend request notification sent to user: " + receiverId);
            } catch (Exception e) {
                System.err.println("Error sending submit friend notification: " + e.getMessage());
            }
        }
    }

    public void sendSubmitFriendNotification(String senderId, String receiverId, int updatedCount) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", senderId); // Người gửi lời mời
            payload.put("receiver", receiverId); // Người nhận lời mời
            payload.put("type", "SUBMIT_FRIEND_REQUEST");  // Loại thông báo
            payload.put("count", updatedCount);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Friend request notification sent to user: " + receiverId);
            } catch (Exception e) {
                System.err.println("Error sending submit friend notification: " + e.getMessage());
            }
        }
    }

    public void sendDeleteMessageNotification(String receiverId, String fromUserId) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "DELETE_MESSAGE");
            payload.put("from", fromUserId); // Người gửi lệnh xóa
            payload.put("to", receiverId);   // Người nhận thông báo

            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent DELETE_MESSAGE notification to " + receiverId);
            } catch (IOException e) {
                System.err.println("Error sending DELETE_MESSAGE notification: " + e.getMessage());
            }
        } else {
            System.err.println("Receiver session is null or closed for user: " + receiverId);
        }
    }

    public void sendRecallMessageNotification(String receiverId, String fromUserId, String messageId) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "RECALL_MESSAGE");
            payload.put("from", fromUserId);     // Ai gọi thu hồi tin nhắn
            payload.put("messageId", messageId);   // ID của tin nhắn cần thu hồi

            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent RECALL_MESSAGE notification to " + receiverId);
            } catch (IOException e) {
                System.err.println("Error sending RECALL_MESSAGE notification: " + e.getMessage());
            }
        } else {
            System.err.println("Receiver session is null or closed for user: " + receiverId);
        }
    }

    public void sendChatMessage(Message message) {
        WebSocketSession session = sessions.get(message.getReceiverID());
        if (session != null && session.isOpen()) {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "CHAT");
                payload.put("message", message); // nguyên message

                String jsonPayload = objectMapper.writeValueAsString(payload);
                session.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent CHAT message to " + message.getReceiverID());
            } catch (IOException e) {
                System.err.println("Error sending chat message: " + e.getMessage());
            }
        }
    }

//    public void sendGroupChatMessage(String groupId, Message message) throws GroupException {
//        // Lấy thông tin nhóm từ groupService
//        GroupResponse groupResponse = groupService.getGroupMembers(groupId);
//
//        // Lấy danh sách các thành viên trong nhóm từ userGroups
//        List<UserGroupResponse> userGroups = groupResponse.getUserGroups();
//
//        // Duyệt qua từng thành viên trong nhóm và gửi tin nhắn
//        for (UserGroupResponse userGroup : userGroups) {
//            String userId = userGroup.getUserId();  // Lấy userId của thành viên
//            WebSocketSession userSession = sessions.get(userId);
//
//            if (userSession != null && userSession.isOpen()) {
//                try {
//                    // Tạo payload để gửi tin nhắn theo định dạng JSON
//                    Map<String, Object> payload = new HashMap<>();
//                    payload.put("type", "GROUP_CHAT");  // Loại tin nhắn là nhóm
//                    payload.put("message", message);    // Gửi tin nhắn thực tế
//
//                    // Chuyển payload thành JSON
//                    String jsonPayload = objectMapper.writeValueAsString(payload);
//
//                    // Gửi tin nhắn đến WebSocket session của thành viên
//                    userSession.sendMessage(new TextMessage(jsonPayload));
//                    System.out.println("Sent GROUP_CHAT message to " + userId);
//                } catch (IOException e) {
//                    // Xử lý lỗi nếu không thể gửi tin nhắn cho thành viên này
//                    System.err.println("Error sending group chat message to user " + userId + ": " + e.getMessage());
//                }
//            } else {
//                // Nếu session không tồn tại hoặc đã đóng, thông báo lỗi
//                System.out.println("User session not open or not found for user: " + userId);
//            }
//        }
//    }




    //Socket Xóa bạn
    public void removeFriendNotification(String senderId, String receiverId) throws JsonProcessingException {
        WebSocketSession receiverSession = sessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", senderId); // Người xóa bạn
            payload.put("receiver", receiverId); // Người bị xóa
            payload.put("type", "REMOVE_FRIEND");  // Loại thông báo
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                receiverSession.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Friend request notification sent to user: " + receiverId);
            } catch (Exception e) {
                System.err.println("Error sending submit friend notification: " + e.getMessage());
            }
        }
    }

    // Thông báo khi người dùng được thêm vào nhóm
    public void sendAddToGroupNotification(String userId, String groupId) throws JsonProcessingException {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "ADD_TO_GROUP");
            payload.put("groupId", groupId);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                session.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent ADD_TO_GROUP notification to user: " + userId);
            } catch (IOException e) {
                System.err.println("Error sending ADD_TO_GROUP notification: " + e.getMessage());
            }
        }
    }

    // Thông báo khi nhóm bị xóa
    public void sendGroupDeletedNotification(String userId, String groupId) throws JsonProcessingException {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "GROUP_DELETED");
            payload.put("groupId", groupId);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                session.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent GROUP_DELETED notification to user: " + userId);
            } catch (IOException e) {
                System.err.println("Error sending GROUP_DELETED notification: " + e.getMessage());
            }
        }
    }

    // Thông báo khi thành viên bị xóa khỏi nhóm
    public void sendMemberRemovedNotification(String userId, String groupId, String removedUserId) throws JsonProcessingException {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "MEMBER_REMOVED");
            payload.put("groupId", groupId);
            payload.put("removedUserId", removedUserId);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                session.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent MEMBER_REMOVED notification to user: " + userId);
            } catch (IOException e) {
                System.err.println("Error sending MEMBER_REMOVED notification: " + e.getMessage());
            }
        }
    }

    // Thông báo khi nhóm được cập nhật (cho các thành viên hiện tại)
    public void sendGroupUpdateNotification(String userId, String groupId) throws JsonProcessingException {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "GROUP_UPDATE");
            payload.put("groupId", groupId);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            try {
                session.sendMessage(new TextMessage(jsonPayload));
                System.out.println("Sent GROUP_UPDATE notification to user: " + userId);
            } catch (IOException e) {
                System.err.println("Error sending GROUP_UPDATE notification: " + e.getMessage());
            }
        }
    }
}
