package vn.edu.iuh.fit.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.service.MessageService;

import java.io.IOException;
import java.util.HashMap;
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

}
