package vn.edu.iuh.fit.model.DTO.request;

import lombok.*;
import vn.edu.iuh.fit.model.Media;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Builder
public class MessageRequest {
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
}
