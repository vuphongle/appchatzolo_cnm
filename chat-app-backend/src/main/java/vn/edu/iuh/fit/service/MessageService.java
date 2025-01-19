package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.model.Message;

import java.util.List;

public interface MessageService {
    void sendMessage(Message message);
    List<Message> getInvitationsByReceiverId(String receiverID);
    List<Message> getSentInvitationsBySenderId(String senderID);
    void deleteInvitation(String senderID, String receiverID);
    boolean acceptFriendRequest(String senderId, String receiverId);
    List<Message> getMessagesBetweenUsers(String senderID, String receiverID);

}
