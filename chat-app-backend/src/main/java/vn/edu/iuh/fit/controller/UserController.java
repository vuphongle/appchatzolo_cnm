package vn.edu.iuh.fit.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.service.UserService;

import java.util.List;
import java.util.Map;
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

    @PostMapping("/findByPhoneNumber")
    public ResponseEntity<?> findUserByPhoneNumber(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Số điện thoại không được để trống");
        }

        User user = userService.findUserByPhoneNumber(phoneNumber);
        if (user == null) {
            System.out.println("Không tìm thấy người dùng với số điện thoại: " + phoneNumber);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng với số điện thoại: " + phoneNumber);
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAllUsers();
        if (users.isEmpty()) {
            return ResponseEntity.noContent().build(); // HTTP 204 nếu danh sách rỗng
        }
        return ResponseEntity.ok(users); // HTTP 200 và trả về danh sách người dùng
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
            // Nếu không có bạn bè trả về danh sách rỗng
            if (friendIds == null || friendIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
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

    // API Tìm bạn bè theo ID
    @GetMapping("/findById/{id}")
    public ResponseEntity<?> findUserById(@PathVariable String id) {
        try {
            User user = userService.findUserById(id);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with ID: " + id);
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred while fetching user");
        }
    }

    //Tìm User (người gửi) theo ID
    @GetMapping("/searchSender")
    public ResponseEntity<?> getUserById(@RequestParam String senderId) {
        try {
            User user = userService.findUserById_ttt(senderId);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching user: " + e.getMessage());
        }
    }
    @GetMapping("/searchUserByName")
    public ResponseEntity<?> searchUserByName(@RequestParam String name, @RequestParam String userId) {
        try {
            List<User> users = userService.findByNameContainingIgnoreCase(name, userId);
            return users.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body("No users found")
                    : ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred");
        }
    }
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String newName = payload.get("name");
            String newDob = payload.get("dob");
            String newAvatar = payload.get("avatar");
            String newGender = payload.get("gender");

            User user = userService.findUserById_ttt(id);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with ID: " + id);
            }

            if (newName != null && !newName.trim().isEmpty()) {
                user.setName(newName);
            }

            if (newDob != null && !newDob.trim().isEmpty()) {
                user.setDob(newDob);
            }

            if (newAvatar != null && !newAvatar.trim().isEmpty()) {
                user.setAvatar(newAvatar);
            }

            if (newGender != null && !newGender.trim().isEmpty()) {
                user.setGender(newGender);
            }

            userService.createUser(user);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating user: " + e.getMessage());
        }
    }


    @DeleteMapping("/{userId}/removeFriend/{friendId}")
    public ResponseEntity<?> removeFriend(@PathVariable String userId, @PathVariable String friendId) throws JsonProcessingException {
        boolean success = userService.removeFriend(userId, friendId);

        if (success) {
            return ResponseEntity.ok("Bạn đã xóa bạn bè thành công!");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng hoặc bạn bè để xóa.");
        }
    }

}
