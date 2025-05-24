package vn.edu.iuh.fit.controller;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.service.impl.PushNotificationService;
import vn.edu.iuh.fit.service.impl.UserFcmTokenService;

@RestController
@RequestMapping("/calls")
public class CallController {

    @Autowired
    private UserFcmTokenService tokenService;

    @Autowired
    private PushNotificationService pushNotificationService;

    @PostMapping("/start")
    public ResponseEntity<?> startCall(@RequestBody CallRequest callRequest) {
        String toUserId = callRequest.getToUserId();
        String fromUserId = callRequest.getFromUserId();

        // Lấy token FCM user nhận
        String toUserFcmToken = tokenService.getTokenByUserId(toUserId);
        if (toUserFcmToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User không có token FCM");
        }

        // Lấy tên người gọi, có thể thay bằng truy vấn User Service / DB
        String fromUserName = "Người gọi " + fromUserId; // hoặc lấy từ DB

        pushNotificationService.sendVideoCallRequest(toUserFcmToken, fromUserId, fromUserName);

        return ResponseEntity.ok("Gửi yêu cầu gọi thành công");
    }


}

@Data
class CallRequest {
    private String fromUserId;
    private String toUserId;
}
