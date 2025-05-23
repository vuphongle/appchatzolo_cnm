package vn.edu.iuh.fit.model;

import lombok.Getter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@DynamoDbBean
public class Message {
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
    private List<Reaction> reactions = new ArrayList<>();
    private boolean pinned = false;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @DynamoDbAttribute("content")
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @DynamoDbAttribute("sendDate")
    public LocalDateTime getSendDate() {
        return sendDate;
    }

    public void setSendDate(LocalDateTime sendDate) {
        this.sendDate = sendDate;
    }

    @DynamoDbAttribute("senderID")
    public String getSenderID() {
        return senderID;
    }

    public void setSenderID(String senderID) {
        this.senderID = senderID;
    }

    @DynamoDbAttribute("receiverID")
    public String getReceiverID() {
        return receiverID;
    }

    public void setReceiverID(String receiverID) {
        this.receiverID = receiverID;
    }

    @DynamoDbAttribute("isRead")
    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    @DynamoDbAttribute("media")
    public Media getMedia() {
        return media;
    }

    public void setMedia(Media media) {
        this.media = media;
    }

    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @DynamoDbAttribute("type")
    public String getType() {
        return type;
    }

    @DynamoDbAttribute("typeWeb")
    public String getTypeWeb() {
        return typeWeb;
    }

    public void setTypeWeb(String typeWeb) {
        this.typeWeb = typeWeb;
    }

    public void setType(String type) {
        this.type = type;
    }

    @DynamoDbAttribute("deletedBySender")
    public boolean isDeletedBySender() {
        return deletedBySender;
    }

    public void setDeletedBySender(boolean deletedBySender) {
        this.deletedBySender = deletedBySender;
    }

    @DynamoDbAttribute("deletedByReceiver")
    public boolean isDeletedByReceiver() {
        return deletedByReceiver;
    }

    public void setDeletedByReceiver(boolean deletedByReceiver) {
        this.deletedByReceiver = deletedByReceiver;
    }

    @DynamoDbAttribute("reactions")
    public List<Reaction> getReactions() {
        return reactions;
    }

    public void setReactions(List<Reaction> reactions) {
        this.reactions = reactions;
    }

    @DynamoDbAttribute("pinned")
    public boolean isPinned() {
        return pinned;
    }
    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }
}
