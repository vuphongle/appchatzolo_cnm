package vn.edu.iuh.fit.controller;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private CognitoIdentityProviderClient cognitoClient;

    @Autowired
    private SnsClient snsClient;

    private final Dotenv dotenv = Dotenv.load();
    private final String userPoolId = dotenv.get("aws.cognito.userPoolId");
    private final String clientId = dotenv.get("aws.cognito.clientId");
    private final String clientSecret = dotenv.get("aws.cognito.clientSecret");

    private final Map<String, String> otpStore = new ConcurrentHashMap<>(); // Lưu OTP tạm thời
    private final Map<String, String> tempUserStore = new ConcurrentHashMap<>(); // Lưu thông tin tạm thời (password)

    /**
     * API: Gửi OTP qua SMS
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String password = request.get("password");
        String otp = generateOtp(); // Tạo OTP ngẫu nhiên

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || phoneNumber.isEmpty() || password == null || password.isEmpty()) {
                throw new IllegalArgumentException("Phone number and password must not be empty");
            }

            // Lưu thông tin người dùng tạm thời
            tempUserStore.put(phoneNumber, password);

            // Gửi OTP qua AWS SNS
            PublishRequest publishRequest = PublishRequest.builder()
                    .phoneNumber(phoneNumber)
                    .message("Your OTP code is: " + otp)
                    .build();
            snsClient.publish(publishRequest);

            // Lưu OTP tạm thời
            otpStore.put(phoneNumber, otp);

            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (software.amazon.awssdk.services.sns.model.SnsException snsException) {
            return ResponseEntity.status(500).body("AWS SNS Error: " + snsException.awsErrorDetails().errorMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error sending OTP: " + e.getMessage());
        }
    }

    /**
     * API: Xác thực OTP và tạo User
     */
    @PostMapping("/verify-otp-and-create-user")
    public ResponseEntity<?> verifyOtpAndCreateUser(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String otp = request.get("otp");

        // Kiểm tra OTP
        if (!otp.equals(otpStore.get(phoneNumber))) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }

        // Xóa OTP sau khi xác thực
        otpStore.remove(phoneNumber);

        // Lấy thông tin mật khẩu tạm thời
        String password = tempUserStore.remove(phoneNumber);

        if (password == null) {
            return ResponseEntity.status(400).body("User data not found. Please restart the process.");
        }

        try {
            // Tạo User với Cognito
            AdminCreateUserRequest createUserRequest = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .temporaryPassword(password)
                    .userAttributes(
                            AttributeType.builder().name("phone_number").value(phoneNumber).build(),
                            AttributeType.builder().name("phone_number_verified").value("true").build()  // Xác thực số điện thoại
                    )
                    .messageAction("SUPPRESS")
                    .build();

            cognitoClient.adminCreateUser(createUserRequest);

            //Đặt mật khẩu cố định
            AdminSetUserPasswordRequest setPasswordRequest = AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .password(password)
                    .permanent(true)
                    .build();

            cognitoClient.adminSetUserPassword(setPasswordRequest);

            return ResponseEntity.ok(Map.of("message", "User created successfully", "username", phoneNumber));

        } catch (CognitoIdentityProviderException e) {
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

    private String generateOtp() {
        return String.valueOf((int) (Math.random() * 900000) + 100000); // Tạo OTP 6 chữ số
    }
}
