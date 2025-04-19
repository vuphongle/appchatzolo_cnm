package vn.edu.iuh.fit.model.DTO.response;

import lombok.*;
import vn.edu.iuh.fit.model.Media;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class MessageResponse {
    private String id;
    private String content;
    private LocalDateTime sendDate;
    private String senderID;
    private String receiverID;
    private Boolean isRead;
    private Media media;
    private String status;
    private String type;
    private boolean deletedBySender = false;
    private boolean deletedByReceiver = false;
    private String typeWeb;

    // Thêm thông tin người gửi vào MessageResponse
    private String name;  // Tên người gửi
    private String avatar;  // Avatar người gửi
}
