package vn.edu.iuh.fit.handler;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class MyWebSocketHandler extends TextWebSocketHandler {

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Log nhận tin nhắn từ client
        System.out.println("Received message: " + message.getPayload());

        // Gửi phản hồi lại cho client
        session.sendMessage(new TextMessage("Hello from server! You said: " + message.getPayload()));
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Log khi kết nối WebSocket được thiết lập
        System.out.println("New WebSocket connection established: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        // Log khi kết nối WebSocket bị đóng
        System.out.println("WebSocket connection closed: " + session.getId());
    }
}
