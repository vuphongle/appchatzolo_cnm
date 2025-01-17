package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.model.Message;

import java.util.List;

public interface MessageService {
    void sendMessage(Message message);
    List<Message> getInvitationsByReceiverId(String receiverID);
    List<Message> getSentInvitationsBySenderId(String senderID);
}
