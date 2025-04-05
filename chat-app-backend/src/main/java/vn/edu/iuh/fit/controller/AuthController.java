package vn.edu.iuh.fit.controller;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.CreateSmsSandboxPhoneNumberRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.VerifySmsSandboxPhoneNumberRequest;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.service.UserService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
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
    public ResponseEntity<?> verifyPhoneAndCreateUser(@RequestBody Map<String, Object> requestData) {
        // Lấy thông tin từ requestData
        String phoneNumber = (String) requestData.get("phoneNumber");
        String verificationCode = (String) requestData.get("verificationCode");
        Map<String, String> userMap = (Map<String, String>) requestData.get("user");

        //Test truyền dữ liệu
        System.out.println("verificationCode: " + verificationCode);
        System.out.println("phoneNumber: " + phoneNumber);
        System.out.println("userMap: " + userMap);

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

            // Tạo User trong dynamodb
            // Chuyển đổi userMap thành đối tượng User
            User user = new User();
            user.setId(userMap.get("id"));
            user.setDob(userMap.get("dob"));
            user.setName(userMap.get("name"));
            user.setPhoneNumber(userMap.get("phoneNumber"));

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
            //set trạng thái online cho user
            if (my_user != null) {
                my_user.setOnline(true); // Cập nhật trạng thái online
                userService.updateUser(my_user); // Lưu trạng thái online vào DB
            }

            // Trả về dữ liệu kết hợp từ Cognito và hệ thống của bạn
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("idToken", idToken);
            responseData.put("accessToken", accessToken);
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

    //hàm logout thì sét offline - tín viết cho đạt làm
    @PutMapping("/logout/{userId}")
    public ResponseEntity<?> logoutUser(@PathVariable Long userId) {
        User user = userService.findUserById(String.valueOf(userId));
        if (user != null) {
            user.setOnline(false);
            userService.updateUser(user);
            return ResponseEntity.ok("User logged out successfully");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        System.out.println("username: " + username);
        System.out.println("currentPassword: " + currentPassword);
        System.out.println("newPassword: " + newPassword);

        try {
            if (username == null || currentPassword == null || newPassword == null || username.isEmpty() || currentPassword.isEmpty() || newPassword.isEmpty()) {
                throw new IllegalArgumentException("Username, current password, and new password must not be empty");
            }

            if (currentPassword.equals(newPassword)) {
                return ResponseEntity.badRequest().body("New password must not be the same as the current password");
            }

            String secretHash = calculateSecretHash(clientId, clientSecret, username);

            // Gửi yêu cầu đăng nhập với mật khẩu hiện tại để xác thực
            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .clientId(clientId)
                    .authParameters(Map.of(
                            "USERNAME", username,
                            "PASSWORD", currentPassword,
                            "SECRET_HASH", secretHash
                    ))
                    .build();

            cognitoClient.initiateAuth(authRequest);

            // Nếu mật khẩu hiện tại đúng, cập nhật mật khẩu mới
            AdminSetUserPasswordRequest setPasswordRequest = AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(username)
                    .password(newPassword)
                    .permanent(true)
                    .build();

            cognitoClient.adminSetUserPassword(setPasswordRequest);

            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (NotAuthorizedException e) {
            return ResponseEntity.status(401).body("Current password is incorrect");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error during password update: " + e.getMessage());
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

    // Tạo, Random OTP ngẫu nhiên với 6 chữ số
    private String generateOtp() {
        return String.valueOf((int) (Math.random() * 900000) + 100000); // Tạo OTP 6 chữ số
    }

    // Gửi OTP cho người dùng khi quên mật khẩu
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendOtpForPasswordReset(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        System.out.println("phoneNumber: " + phoneNumber);

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                throw new IllegalArgumentException("Phone number must not be empty");
            }

            // Tạo OTP và lưu vào otpStore
            String otp = generateOtp();
            otpStore.put(phoneNumber, otp);  // Lưu OTP tạm thời

            // Tạo tin nhắn để gửi OTP
            String message = "Your OTP for password reset is: " + otp;

            // Gửi OTP qua SNS
            PublishRequest publishRequest = PublishRequest.builder()
                    .phoneNumber(phoneNumber)  // Số điện thoại người nhận
                    .message(message)           // Tin nhắn chứa OTP
                    .build();

            snsClient.publish(publishRequest);

            return ResponseEntity.ok(Map.of("message", "OTP sent. Please check your SMS"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error sending OTP: " + e.getMessage());
        }
    }

    // Xác thực OTP khi người dùng quên mật khẩu
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String otp = request.get("otp");

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || otp == null || phoneNumber.isEmpty() || otp.isEmpty()) {
                throw new IllegalArgumentException("Phone number and OTP must not be empty");
            }

            // Kiểm tra OTP (so với OTP đã lưu trong otpStore)
            String storedOtp = otpStore.get(phoneNumber);
            if (storedOtp == null || !storedOtp.equals(otp)) {
                return ResponseEntity.badRequest().body("Invalid OTP");
            }

            // Nếu OTP hợp lệ, trả về thông báo xác nhận
            return ResponseEntity.ok(Map.of("message", "OTP verified successfully. Please enter a new password"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error verifying OTP: " + e.getMessage());
        }
    }

    // Đặt lại mật khẩu mới cho người dùng khi quên mật khẩu
    @PostMapping("/forgot-password/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String newPassword = request.get("newPassword");
        System.out.println("phoneNumber: " + phoneNumber);
        System.out.println("newPassword: " + newPassword);

        try {
            // Kiểm tra thông tin đầu vào
            if (phoneNumber == null || newPassword == null || phoneNumber.isEmpty() || newPassword.isEmpty()) {
                throw new IllegalArgumentException("Phone number and new password must not be empty");
            }

            // Cập nhật mật khẩu mới cho người dùng trên Cognito
            AdminSetUserPasswordRequest setPasswordRequest = AdminSetUserPasswordRequest.builder()
                    .userPoolId(userPoolId)
                    .username(phoneNumber)
                    .password(newPassword)
                    .permanent(true)
                    .build();
            cognitoClient.adminSetUserPassword(setPasswordRequest);

            // Xóa OTP sau khi thay đổi mật khẩu
            otpStore.remove(phoneNumber);

            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error resetting password: " + e.getMessage());
        }
    }
}
