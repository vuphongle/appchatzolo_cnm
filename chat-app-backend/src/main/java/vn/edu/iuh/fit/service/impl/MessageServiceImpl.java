package vn.edu.iuh.fit.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.repository.MessageRepository;
import vn.edu.iuh.fit.service.MessageService;

import java.util.List;

@Service
public class MessageServiceImpl implements MessageService {
    private final MessageRepository repository;

    @Autowired
    public MessageServiceImpl(MessageRepository repository) {
        this.repository = repository;
    }

    @Override
    public void sendMessage(Message message) {
        repository.save(message);
    }

    //Tìm danh sách lời mời kết bạn
    @Override
    public List<Message> getInvitationsByReceiverId(String receiverID) {
        return repository.findInvitationsByReceiverId(receiverID);
    }

    //Tìm danh sách các lời mời đã gửi đi
    @Override
    public List<Message> getSentInvitationsBySenderId(String senderID) {
        return repository.findSentInvitationsBySenderId(senderID);
    }

    // Xóa, thu hồi lời mời kết bạn
    @Override
    public void deleteInvitation(String senderID, String receiverID) {
        repository.deleteInvitation(senderID, receiverID);
    }

    // Hàm đồng ý kết bạn
    public boolean acceptFriendRequest(String senderId, String receiverId) {
        // Cập nhật trạng thái của lời mời trong bảng Message
        repository.updateInvitationStatus(senderId, receiverId, "Đã kết bạn");

        // Thêm ID của nhau vào danh sách bạn bè
        repository.submitFriend(senderId, receiverId);

        return true;
    }

    @Override
    public List<Message> getMessagesBetweenUsers(String senderID, String receiverID) {
        return repository.findMessagesBetweenUsers(senderID, receiverID);
    }
}
