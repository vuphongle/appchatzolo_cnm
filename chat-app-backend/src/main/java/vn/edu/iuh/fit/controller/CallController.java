package vn.edu.iuh.fit.controller;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.model.DTO.request.CallContentAnswerRequest;
import vn.edu.iuh.fit.model.DTO.request.CallContentCandidateRequest;
import vn.edu.iuh.fit.model.DTO.request.CallContentRequest;
import vn.edu.iuh.fit.model.IceCandidate;
import vn.edu.iuh.fit.service.impl.PushNotificationService;
import vn.edu.iuh.fit.service.impl.UserFcmTokenService;

import java.util.List;

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

    @PostMapping("/candidate")
    public ResponseEntity<?> sendCandidate(@RequestBody CallContentCandidateRequest request) {
        String toUserId = request.getTo();
        String fromUserId = request.getFrom();
        List<String> candidate = request.getCandidate();
        String type = request.getType();

        System.out.println("Received candidate: " + candidate + " from: " + fromUserId + " to: " + toUserId + " type: " + type);
//
//        // Lấy token FCM user nhận
//        String toUserFcmToken = tokenService.getTokenByUserId(toUserId);
//        if (toUserFcmToken == null) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User không có token FCM");
//        }

        pushNotificationService.sendVideoCallCandidate(toUserId, fromUserId, candidate, type);

        return ResponseEntity.ok("Gửi candidate thành công");
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestCall(@RequestBody CallContentRequest request) {
        String toUserId = request.getTo();
        String fromUserId = request.getFrom();
        String offer = request.getOffer();
        String type = request.getType();

//        // Lấy token FCM user nhận
//        String toUserFcmToken = tokenService.getTokenByUserId(toUserId);
//        if (toUserFcmToken == null) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User không có token FCM");
//        }

        pushNotificationService.sendVideoCallRequest(toUserId, fromUserId, offer, type);

        return ResponseEntity.ok("Gửi yêu cầu gọi thành công");
    }

    @PostMapping("/answer")
    public ResponseEntity<?> answerCall(@RequestBody CallContentAnswerRequest request) {
        String toUserId = request.getTo();
        String fromUserId = request.getFrom();
        String answer = request.getAnswer();
        String type = request.getType();

        pushNotificationService.sendVideoCallAnswer(toUserId, fromUserId, answer, type);
        return ResponseEntity.ok("Gửi câu trả lời thành công");
    }
}

@Data
class CallRequest {
    private String fromUserId;
    private String toUserId;
}
