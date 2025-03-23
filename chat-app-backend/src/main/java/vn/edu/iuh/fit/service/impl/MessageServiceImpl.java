package vn.edu.iuh.fit.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.model.DTO.UnreadMessagesCountDTO;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.repository.MessageRepository;
import vn.edu.iuh.fit.service.MessageService;

import java.util.ArrayList;
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
    public int countInvitation(String senderID, String receiverID) {
        return repository.countInvitation(senderID, receiverID);
    }

    @Override
    public List<Message> getMessagesBetweenUsers(String senderID, String receiverID) {
        return repository.findMessagesBetweenUsers(senderID, receiverID);
    }


    //xét trạng thái đọc tin nhắn
    @Override
    public List<Message> findUnreadMessages(String receiverID, String senderID) {
        return repository.findUnreadMessages(receiverID, senderID);
    }

    @Override
    public void saveReadMess(List<Message> messages) {
        repository.saveReadMess(messages);
    }
    @Override
    public Message getLatestMessageBetweenUsers(String senderID, String receiverID) {
        return repository.findLatestMessageBetweenUsers(senderID, receiverID);
    }


    @Override
    public List<UnreadMessagesCountDTO> getUnreadCountForAllFriends(String receiverID) {
        List<String> friendIds = repository.getFriendsList(receiverID);  // Giả sử bạn đã có phương thức để lấy danh sách bạn bè
        List<UnreadMessagesCountDTO> unreadCounts = new ArrayList<>();

        for (String friendId : friendIds) {
            int unreadCount = repository.getUnreadMessagesCount(receiverID, friendId);
            unreadCounts.add(new UnreadMessagesCountDTO(friendId, unreadCount));
        }

        return unreadCounts;
    }


}
