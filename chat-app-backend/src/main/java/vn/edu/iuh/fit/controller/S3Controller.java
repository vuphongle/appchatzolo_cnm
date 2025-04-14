/*
 * @(#) $(NAME).java    1.0     2/28/2025
 *
 * Copyright (c) 2025 IUH. All rights reserved.
 */

package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.iuh.fit.service.S3Service;
import vn.edu.iuh.fit.service.UserService;

import java.util.Map;

/*
 * @description
 * @author: Tran Tan Dat
 * @version: 1.0
 * @created: 28-February-2025 4:30 PM
 */
@RestController
@RequestMapping("/s3")
public class S3Controller {
    private final S3Service s3Service;
    private final UserService userService;
    @Autowired
    public S3Controller(S3Service s3Service, UserService userService) {
        this.s3Service = s3Service;
        this.userService = userService;
    }

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {  // Nhận userId từ request

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống!"));
        }

        try {
            String oldAvatarUrl = userService.getUserAvatar(userId);

            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
                s3Service.deleteFile(oldAvatarUrl);
            }

            String newAvatarUrl = s3Service.uploadAvatar(file);
            userService.updateUserAvatar(userId, newAvatarUrl);

            return ResponseEntity.ok(Map.of("url", newAvatarUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống!"));
        }
        try {
            String fileUrl = s3Service.uploadImage(file);
            if (fileUrl == null) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: fileUrl null!"));
            }
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết vào console/log
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/file")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println("File: " + file.getOriginalFilename());
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống!"));
        }
        try {
            String fileUrl = s3Service.uploadFile(file);
            if (fileUrl == null) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: fileUrl null!"));
            }
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết vào console/log
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: " + e.getMessage()));
        }
    }
}
