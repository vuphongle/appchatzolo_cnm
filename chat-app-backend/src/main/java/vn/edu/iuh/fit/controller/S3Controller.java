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

    @Autowired
    public S3Controller(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống!"));
        }
        try {
            String fileUrl = s3Service.uploadAvatar(file);
            if (fileUrl == null) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload thất bại: fileUrl null!"));
            }
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết vào console/log
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
}
