package vn.edu.iuh.fit.controller;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private CognitoIdentityProviderClient cognitoClient;

    private final Dotenv dotenv = Dotenv.load();

    private final String userPoolId = dotenv.get("aws.cognito.userPoolId");
    private final String clientId = dotenv.get("aws.cognito.clientId");
    private final String clientSecret = dotenv.get("aws.cognito.clientSecret");

    /**
     * API: Tạo User trong User Pool
     */
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String password = request.get("password");

        try {
            // Tạo User với Cognito
            AdminCreateUserRequest createUserRequest = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .temporaryPassword(password) // Mật khẩu tạm thời
                    .userAttributes(
                            AttributeType.builder().name("phone_number").value(phoneNumber).build()
                    )
                    .messageAction("SUPPRESS") // Không gửi email/SMS xác thực
                    .build();

            cognitoClient.adminCreateUser(createUserRequest);

            // Đặt mật khẩu cố định
            AdminSetUserPasswordRequest setPasswordRequest = AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .password(password)
                    .permanent(true) // Đặt mật khẩu cố định
                    .build();

            cognitoClient.adminSetUserPassword(setPasswordRequest);

            return ResponseEntity.ok(Map.of("message", "User created successfully", "username", phoneNumber));

        } catch (CognitoIdentityProviderException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating user", "details", e.getMessage()));
        }
    }

    /**
     * API: Đăng nhập User qua Cognito
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        try {
            // Tính toán SECRET_HASH
            String secretHash = calculateSecretHash(clientId, clientSecret, username);

            // Gửi yêu cầu đăng nhập
            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .clientId(clientId)
                    .authParameters(Map.of(
                            "USERNAME", username,
                            "PASSWORD", password,
                            "SECRET_HASH", secretHash
                    ))
                    .build();

            InitiateAuthResponse authResponse = cognitoClient.initiateAuth(authRequest);
            String idToken = authResponse.authenticationResult().idToken();

            return ResponseEntity.ok(Map.of("idToken", idToken));

        } catch (NotAuthorizedException e) {
            System.err.println("Login failed: Invalid username or password. Details: " + e.getMessage());
            return ResponseEntity.status(401).body("Invalid username or password");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error during authentication: " + e.getMessage());
        }
    }

    private String calculateSecretHash(String clientId, String clientSecret, String username) {
        try {
            String message = username + clientId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(clientSecret.getBytes(), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmac = mac.doFinal(message.getBytes());
            return Base64.getEncoder().encodeToString(hmac);
        } catch (Exception e) {
            throw new RuntimeException("Error while calculating SECRET_HASH", e);
        }
    }
}




//package vn.edu.iuh.fit.controller;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//        import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
//import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
//        import javax.crypto.Mac;
//import javax.crypto.spec.SecretKeySpec;
//import java.util.Base64;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/auth")
//public class AuthController {
//
//    @Autowired
//    private CognitoIdentityProviderClient cognitoClient;
//
//    @Value("${aws.cognito.userPoolId}")
//    private String userPoolId;
//
//    @Value("${aws.cognito.clientId}")
//    private String clientId;
//
//    @Value("${aws.cognito.clientSecret}")
//    private String clientSecret;
//
//    /**
//     * API: Đăng nhập User qua Cognito và gửi OTP
//     */
//    @PostMapping("/login")
//    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
//        String username = request.get("username");
//        String password = request.get("password");
//
//        try {
//            // Tính toán SECRET_HASH
//            String secretHash = calculateSecretHash(clientId, clientSecret, username);
//
//            // Gửi yêu cầu đăng nhập
//            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
//                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
//                    .clientId(clientId)
//                    .authParameters(Map.of(
//                            "USERNAME", username,
//                            "PASSWORD", password,
//                            "SECRET_HASH", secretHash
//                    ))
//                    .build();
//
//            InitiateAuthResponse authResponse = cognitoClient.initiateAuth(authRequest);
//            String idToken = authResponse.authenticationResult().idToken();
//
//            // Gửi OTP tới số điện thoại của người dùng
//            SendMFACodeRequest mfaRequest = SendMFACodeRequest.builder()
//                    .userPoolId(userPoolId)
//                    .username(username)
//                    .clientId(clientId)
//                    .build();
//
//            cognitoClient.adminInitiateAuth(mfaRequest); // Gửi mã xác thực đến số điện thoại người dùng
//
//            return ResponseEntity.ok(Map.of("idToken", idToken, "message", "OTP sent successfully"));
//
//        } catch (NotAuthorizedException e) {
//            return ResponseEntity.status(401).body("Invalid username or password");
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(500).body("Error during authentication: " + e.getMessage());
//        }
//    }
//
//    /**
//     * API: Xác thực OTP
//     */
//    @PostMapping("/verify-otp")
//    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
//        String username = request.get("username");
//        String otp = request.get("otp");
//
//        try {
//            // Gửi yêu cầu xác thực OTP
//            RespondToAuthChallengeRequest challengeRequest = RespondToAuthChallengeRequest.builder()
//                    .challengeName(ChallengeNameType.SMS_MFA)
//                    .clientId(clientId)
//                    .challengeResponses(Map.of(
//                            "USERNAME", username,
//                            "SMS_MFA_CODE", otp
//                    ))
//                    .session(request.get("session"))
//                    .build();
//
//            cognitoClient.respondToAuthChallenge(challengeRequest);
//
//            return ResponseEntity.ok("OTP verification successful");
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(400).body("OTP verification failed: " + e.getMessage());
//        }
//    }
//
//    private String calculateSecretHash(String clientId, String clientSecret, String username) {
//        try {
//            String message = username + clientId;
//            Mac mac = Mac.getInstance("HmacSHA256");
//            SecretKeySpec secretKey = new SecretKeySpec(clientSecret.getBytes(), "HmacSHA256");
//            mac.init(secretKey);
//            byte[] hmac = mac.doFinal(message.getBytes());
//            return Base64.getEncoder().encodeToString(hmac);
//        } catch (Exception e) {
//            throw new RuntimeException("Error while calculating SECRET_HASH", e);
//        }
//    }
//}


