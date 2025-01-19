package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.service.UserService;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/create")
    public ResponseEntity<String> createUser(@RequestBody User user) {
        if (user.getName() == null || user.getPhoneNumber() == null || user.getDob() == null) {
            return ResponseEntity.badRequest().body("Thông tin người dùng không hợp lệ");
        }

        user.setId(UUID.randomUUID().toString());

        userService.createUser(user);
        return ResponseEntity.ok("User created successfully!");
    }

    @GetMapping("/searchFriend")
    public ResponseEntity<?> searchUser(@RequestParam String phoneNumber) {
        try {
            User user = userService.findUserByPhoneNumber(phoneNumber); // Xử lý tìm kiếm
            if (user != null) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
        } catch (Exception e) {
            e.printStackTrace();  // In chi tiết lỗi ra log
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred");
        }
    }


    // API Lấy danh sách bạn bè
    @GetMapping("/{userId}/friends")
    public ResponseEntity<?> getFriends(@PathVariable String userId) {
        try {
            User user = userService.findUserById_ttt(userId);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            List<String> friendIds = user.getFriendIds();
            if (friendIds == null || friendIds.isEmpty()) {
                return ResponseEntity.ok("No friends found");
            }

            // Lấy chi tiết bạn bè
            List<User> friends = friendIds.stream()
                    .map(userService::findUserById_ttt)
                    .filter(Objects::nonNull) // Loại bỏ các ID không hợp lệ
                    .collect(Collectors.toList());

            return ResponseEntity.ok(friends);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching friends: " + e.getMessage());
        }
    }

}
