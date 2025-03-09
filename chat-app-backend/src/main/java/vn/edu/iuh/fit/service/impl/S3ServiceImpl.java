/*
 * @(#) $(NAME).java    1.0     3/2/2025
 *
 * Copyright (c) 2025 IUH. All rights reserved.
 */

package vn.edu.iuh.fit.service.impl;

/*
 * @description
 * @author: Tran Tan Dat
 * @version: 1.0
 * @created: 02-March-2025 1:20 PM
 */

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import vn.edu.iuh.fit.service.S3Service;

import java.io.IOException;

@Service
public class S3ServiceImpl implements S3Service {
    private final Dotenv dotenv = Dotenv.load();
    private final S3Client s3Client;
    private final String bucketName = dotenv.get("aws.s3.bucketName");
    private final String region = dotenv.get("aws.region");

    public S3ServiceImpl(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String uploadAvatar(MultipartFile file) {
        try {

            String fileName = file.getOriginalFilename();

            if (fileName == null || !fileName.matches(".*\\.(jpg|jpeg|png)$")) {
                throw new IllegalArgumentException("Chỉ chấp nhận file (.jpg,.jpeg,.png)");
            }

            // Tạo đường dẫn file trong S3
            String s3Key = "avatar/" + fileName;

            // Tạo request để upload
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .build();
            // Upload file lên S3
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }
}
