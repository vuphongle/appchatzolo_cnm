package vn.edu.iuh.fit.service.impl;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.handler.MyWebSocketHandler;
import vn.edu.iuh.fit.model.IceCandidate;

import java.util.List;

@Service
public class PushNotificationService {

    @Autowired
    private ObjectProvider<MyWebSocketHandler> myWebSocketHandlerProvider;

    public void sendVideoCallRequest(String toUserFcmToken, String fromUserId, String fromUserName) {
        Message message = Message.builder()
                .setToken(toUserFcmToken)
                .putData("type", "video_call_request")
                .putData("fromUserId", fromUserId)
                .putData("fromUserName", fromUserName)
//                .setNotification(Notification.builder()
//                        .setTitle("Cuộc gọi video")
//                        .setBody(fromUserName + " đang gọi bạn")
//                        .build())
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent message: " + response);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendVideoCallCandidate(String toUser, String fromUserId, List<String> candidate, String type) {
        // Lấy MyWebSocketHandler một cách lazy khi cần dùng
        vn.edu.iuh.fit.handler.MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendVideoCallCandidate(toUser, fromUserId, candidate, type);
        } else {
            // Xử lý nếu không tìm thấy bean (nếu cần)
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    public void sendVideoCallRequest(String toUserFcmToken, String fromUserId, String offer, String type) {
        // Lấy MyWebSocketHandler một cách lazy khi cần dùng
        vn.edu.iuh.fit.handler.MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendVideoCallRequest(toUserFcmToken, fromUserId, offer, type);
        } else {
            // Xử lý nếu không tìm thấy bean (nếu cần)
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    public void sendVideoCallAnswer(String toUser, String fromUserId, String answer, String type) {
        // Lấy MyWebSocketHandler một cách lazy khi cần dùng
        vn.edu.iuh.fit.handler.MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendVideoCallAnswer(toUser, fromUserId, answer, type);
        } else {
            // Xử lý nếu không tìm thấy bean (nếu cần)
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }
}
