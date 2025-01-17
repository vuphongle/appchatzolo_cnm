package vn.edu.iuh.fit.controller;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.CreateSmsSandboxPhoneNumberRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.sns.model.VerifySmsSandboxPhoneNumberRequest;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.service.UserService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private CognitoIdentityProviderClient cognitoClient;

    @Autowired
    private SnsClient snsClient;

    @Autowired
    private UserService userService;

    private final Dotenv dotenv = Dotenv.load();
    private final String userPoolId = dotenv.get("aws.cognito.userPoolId");
    private final String clientId = dotenv.get("aws.cognito.clientId");
    private final String clientSecret = dotenv.get("aws.cognito.clientSecret");

    private final Map<String, String> otpStore = new ConcurrentHashMap<>(); // Lưu OTP tạm thời
    private final Map<String, String> tempUserStore = new ConcurrentHashMap<>(); // Lưu thông tin tạm thời (password)

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String password = request.get("password");

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || phoneNumber.isEmpty() || password == null || password.isEmpty()) {
                throw new IllegalArgumentException("Phone number and password must not be empty");
            }

            // Lưu thông tin người dùng tạm thời
            tempUserStore.put(phoneNumber, password);

            // Thêm số điện thoại vào SNS Sandbox
            try {
                CreateSmsSandboxPhoneNumberRequest sandboxRequest = CreateSmsSandboxPhoneNumberRequest.builder()
                        .phoneNumber(phoneNumber)
                        .languageCode("en-US") // Ngôn ngữ tin nhắn
                        .build();
                snsClient.createSMSSandboxPhoneNumber(sandboxRequest);
            } catch (software.amazon.awssdk.services.sns.model.SnsException e) {
                // Nếu số đã tồn tại, bỏ qua lỗi
                if (!e.awsErrorDetails().errorMessage().contains("already exists")) {
                    throw e;
                }
            }

            return ResponseEntity.ok(Map.of("message", "Verification code sent. Please check your SMS to verify the phone number."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (software.amazon.awssdk.services.sns.model.SnsException snsException) {
            return ResponseEntity.status(500).body("AWS SNS Error: " + snsException.awsErrorDetails().errorMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error sending verification code: " + e.getMessage());
        }
    }

    @PostMapping("/verify-phone-and-create-user")
    public ResponseEntity<?> verifyPhoneAndCreateUser(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String verificationCode = request.get("verificationCode");

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || verificationCode == null || phoneNumber.isEmpty() || verificationCode.isEmpty()) {
                throw new IllegalArgumentException("Phone number and verification code must not be empty");
            }

            // Xác thực số điện thoại trong SNS Sandbox
            VerifySmsSandboxPhoneNumberRequest verifyRequest = VerifySmsSandboxPhoneNumberRequest.builder()
                    .phoneNumber(phoneNumber)
                    .oneTimePassword(verificationCode)
                    .build();
            snsClient.verifySMSSandboxPhoneNumber(verifyRequest);

            // Lấy mật khẩu tạm thời
            String password = tempUserStore.get(phoneNumber);
            if (password == null) {
                throw new IllegalStateException("Temporary password not found for phone number: " + phoneNumber);
            }

            // Tạo User với Cognito
            AdminCreateUserRequest createUserRequest = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .temporaryPassword(password)
                    .userAttributes(
                            AttributeType.builder().name("phone_number").value(phoneNumber).build(),
                            AttributeType.builder().name("phone_number_verified").value("true").build()
                    )
                    .messageAction("SUPPRESS")
                    .build();

            cognitoClient.adminCreateUser(createUserRequest);

            // Đặt mật khẩu cố định
            AdminSetUserPasswordRequest setPasswordRequest = AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .password(password)
                    .permanent(true)
                    .build();
            cognitoClient.adminSetUserPassword(setPasswordRequest);

            // Lưu thông tin người dùng vào DynamoDB qua UserRepository
            String name = request.get("name");
            String dobString = request.get("dob");
//            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
//            LocalDate dob = LocalDate.parse(dobString, formatter);
            // Gán ID cho người dùng
            User user = new User(phoneNumber, name, dobString);
            user.setId(UUID.randomUUID().toString());  // Gán ID cho User
            userService.createUser(user);

            // Xóa dữ liệu tạm
            tempUserStore.remove(phoneNumber);

            return ResponseEntity.ok(Map.of("message", "User created successfully", "username", phoneNumber));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (software.amazon.awssdk.services.sns.model.SnsException snsException) {
            return ResponseEntity.status(500).body(Map.of("error", "AWS SNS Error", "details", snsException.awsErrorDetails().errorMessage()));
        } catch (CognitoIdentityProviderException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating user", "details", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Unexpected error", "details", e.getMessage()));
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
            String accessToken = authResponse.authenticationResult().accessToken();

            // Truy vấn thông tin người dùng từ accessToken
            GetUserRequest getUserRequest = GetUserRequest.builder()
                    .accessToken(accessToken)  // Sử dụng accessToken thay vì idToken
                    .build();

            GetUserResponse getUserResponse = cognitoClient.getUser(getUserRequest);

            // Lấy thông tin người dùng trong cognito
            Map<String, String> userAttributes = new HashMap<>();
            for (AttributeType attribute : getUserResponse.userAttributes()) {
                userAttributes.put(attribute.name(), attribute.value());
            }

            // Sử dụng số điện thoại để tìm người dùng trong DynamoDB hoặc cơ sở dữ liệu khác
            User my_user = userService.findUserByPhoneNumber(username); //username là phone number

            // Trả về dữ liệu kết hợp từ Cognito và hệ thống của bạn
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("idToken", idToken);
            responseData.put("userAttributes", userAttributes);
            responseData.put("my_user", my_user);

            // Trả về ResponseEntity với dữ liệu người dùng
            return ResponseEntity.ok(responseData);

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
