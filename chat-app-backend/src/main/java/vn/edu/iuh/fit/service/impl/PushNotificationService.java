package vn.edu.iuh.fit.service.impl;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class PushNotificationService {

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
}
