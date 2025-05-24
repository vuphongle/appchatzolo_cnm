package vn.edu.iuh.fit.controller;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.service.impl.UserFcmTokenService;

@RestController
@RequestMapping("/fcm")
public class FcmTokenController {

    @Autowired
    private UserFcmTokenService tokenService;

    @PostMapping("/register")
    public ResponseEntity<?> registerToken(@RequestBody FcmTokenRequest request) {
        if (request.getUserId() == null || request.getFcmToken() == null) {
            return ResponseEntity.badRequest().body("Missing userId or fcmToken");
        }
        tokenService.saveOrUpdateToken(request.getUserId(), request.getFcmToken());
        return ResponseEntity.ok("Token registered");
    }
}

@Data
class FcmTokenRequest {
    private String userId;
    private String fcmToken;
}
