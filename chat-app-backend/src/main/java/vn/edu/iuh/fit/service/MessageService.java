package vn.edu.iuh.fit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import vn.edu.iuh.fit.enums.ReactType;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.model.DTO.UnreadMessagesCountDTO;
import vn.edu.iuh.fit.model.Message;

import java.util.List;

public interface MessageService {
    void sendMessage(Message message) throws JsonProcessingException;
    List<Message> getInvitationsByReceiverId(String receiverID);
    List<Message> getSentInvitationsBySenderId(String senderID);
    void deleteInvitation(String senderID, String receiverID) throws JsonProcessingException;

    //Từ chối lời mời kết bạn
    void refuseInvitation(String senderID, String receiverID) throws JsonProcessingException;

    boolean acceptFriendRequest(String senderId, String receiverId) throws JsonProcessingException;
    int countInvitation(String senderID, String receiverID);
    List<Message> getMessagesBetweenUsers(String senderID, String receiverID);
    List<Message> findUnreadMessages(String receiverID, String senderID);

    Message getLatestMessageBetweenUsers(String senderID, String receiverID);
    void saveReadMess(List<Message> messages);
    //lấy tin nhắn trong group
    List<Message> getMessagesInGroup(String groupId);
    List<UnreadMessagesCountDTO> getUnreadCountForAllFriends(String receiverID);
    void deleteMessagesBetweenUsers(String senderID, String receiverID);
    void recallMessage(String messageId, String senderID, String receiverID);
    void forwardMessage(String originalMessageId, String senderID, List<String> receiverIDs);
    void deleteMessageForUser(String messageId, String userId);

    //hàm thêm react
    void addReactToMessage (String messageId, String userId, ReactType reactType);
    void removeReactFromMessage (String messageId, String userId);

    //pin tin nhắn
    Message pinMessage(String messageId, String userId) throws GroupException;
    // hủy pin tin nhắn
    Message unpinMessage(String messageId, String userId) throws GroupException;
}
