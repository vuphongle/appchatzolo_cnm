package vn.edu.iuh.fit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import vn.edu.iuh.fit.model.DTO.UnreadMessagesCountDTO;
import vn.edu.iuh.fit.model.Message;

import java.util.List;

public interface MessageService {
    void sendMessage(Message message) throws JsonProcessingException;
    List<Message> getInvitationsByReceiverId(String receiverID);
    List<Message> getSentInvitationsBySenderId(String senderID);
    void deleteInvitation(String senderID, String receiverID) throws JsonProcessingException;
    boolean acceptFriendRequest(String senderId, String receiverId) throws JsonProcessingException;
    List<Message> getMessagesBetweenUsers(String senderID, String receiverID);
    List<Message> findUnreadMessages(String receiverID, String senderID);

    Message getLatestMessageBetweenUsers(String senderID, String receiverID);
    void saveReadMess(List<Message> messages);

    List<UnreadMessagesCountDTO> getUnreadCountForAllFriends(String receiverID);

}
