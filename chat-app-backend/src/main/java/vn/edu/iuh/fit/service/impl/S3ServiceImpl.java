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

import com.amazonaws.services.s3.model.CannedAccessControlList;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import vn.edu.iuh.fit.service.S3Service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

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

            String timestamp = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
            String newFileName = timestamp + "_" + fileName;

            // Tạo đường dẫn file trong S3
            String s3Key = "avatar/" + newFileName;

            // Tạo request để upload
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .acl(ObjectCannedACL.PUBLIC_READ) // Đặt quyền public-read
                    .build();
            // Upload file lên S3
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadImage(MultipartFile file) {
        try {
            // Kiểm tra kích thước file không vượt quá 20MB
            if (file.getSize() > 20 * 1024 * 1024) { // 20MB
                throw new IllegalArgumentException("File không được vượt quá 20MB.");
            }

            // Đặt tên file
            String fileName = file.getOriginalFilename();
            String timestamp = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
            String newFileName = timestamp + "_" + fileName;


            if (fileName == null || !fileName.matches(".*\\.(jpg|jpeg|png|gif|bmp|webp|tiff|heif|heic)$")) {
                throw new IllegalArgumentException("Chỉ chấp nhận file (.jpg, .jpeg, .png, .gif, .bmp, .webp, .tiff, .heif, .heic)");
            }

            // Tạo đường dẫn file trong S3
            String s3Key = "image/" + newFileName;

            // Tạo request để upload
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .acl(String.valueOf(CannedAccessControlList.PublicRead)) // Cấp quyền public-read cho tệp khi tải lên
                    .build();
            // Upload file lên S3
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            return "https://" + bucketName + ".s3.amazonaws.com/" + s3Key;
        }catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e); // Trả về lỗi với mã trạng thái 400
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file) {
        try {
            // Kiểm tra kích thước file không vượt quá 20MB
            if (file.getSize() > 20 * 1024 * 1024) { // 20MB
                throw new IllegalArgumentException("File không được vượt quá 20MB.");
            }

            // Đặt tên file
            String fileName = file.getOriginalFilename();
            String timestamp = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
            String newFileName = timestamp + "_" + fileName;


            if (fileName == null) {
                throw new IllegalArgumentException("File name is required.");
            }

            // Tạo đường dẫn file trong S3
            String s3Key = "file/" + newFileName;

            // Tạo request để upload
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .acl(String.valueOf(CannedAccessControlList.PublicRead)) // Cấp quyền công khai nếu muốn
                    .build();

            // Upload file lên S3
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            // Trả về URL của file đã tải lên S3
            return "https://" + bucketName + ".s3.amazonaws.com/" + s3Key;
        }catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e); // Trả về lỗi với mã trạng thái 400
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.isEmpty()) return;

            String fileKey = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key("avatar/" + fileKey) // Chỉ xóa avatar
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
            System.err.println("Xóa file thất bại: " + e.getMessage());
        }
    }

}
