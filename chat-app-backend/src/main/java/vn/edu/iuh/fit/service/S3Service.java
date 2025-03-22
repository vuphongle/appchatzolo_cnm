/*
 * @(#) $(NAME).java    1.0     2/28/2025
 *
 * Copyright (c) 2025 IUH. All rights reserved.
 */

package vn.edu.iuh.fit.service;

/*
 * @description
 * @author: Tran Tan Dat
 * @version: 1.0
 * @created: 28-February-2025 4:19 PM
 */

import org.springframework.web.multipart.MultipartFile;

public interface S3Service {
    String uploadAvatar(MultipartFile file);

    String uploadImage(MultipartFile file);

    String uploadFile(MultipartFile file);

    void deleteFile(String fileUrl);
}
