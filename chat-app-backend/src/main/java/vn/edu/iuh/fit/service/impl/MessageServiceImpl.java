package vn.edu.iuh.fit.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.handler.MyWebSocketHandler;
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
    private ObjectProvider<MyWebSocketHandler> myWebSocketHandlerProvider;

    @Autowired
    public MessageServiceImpl(MessageRepository repository) {
        this.repository = repository;
    }

    @Override
    public void sendMessage(Message message) throws JsonProcessingException {
        repository.save(message);
        // Tính lại số lời mời hiện tại của người nhận
        List<Message> invitations = getInvitationsByReceiverId(message.getReceiverID());
        int updatedCount = invitations.size();

        // Lấy MyWebSocketHandler một cách lazy khi cần dùng
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendFriendRequestNotification(message.getReceiverID(), updatedCount);
        } else {
            // Xử lý nếu không tìm thấy bean (nếu cần)
            System.err.println("MyWebSocketHandler bean is not available.");
        }
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
    public void deleteInvitation(String senderID, String receiverID) throws JsonProcessingException {
        repository.deleteInvitation(senderID, receiverID);

        List<Message> invitations = getInvitationsByReceiverId(receiverID);
        int updatedCount = invitations.size();

        // Lấy bean MyWebSocketHandler một cách lazy và gửi thông báo cập nhật
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendFriendRequestNotification(receiverID, updatedCount);
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    // Hàm đồng ý kết bạn
    public boolean acceptFriendRequest(String senderId, String receiverId) throws JsonProcessingException {
        // Cập nhật trạng thái của lời mời trong bảng Message
        repository.updateInvitationStatus(senderId, receiverId, "Đã kết bạn");

        // Thêm ID của nhau vào danh sách bạn bè
        repository.submitFriend(senderId, receiverId);

        // Sau khi đồng ý, lời mời sẽ không còn tồn tại nữa. Do đó, lấy lại số lời mời hiện tại của receiver.
        List<Message> invitations = getInvitationsByReceiverId(receiverId);
        int updatedCount = invitations.size();

        // Lấy bean MyWebSocketHandler một cách lazy và gửi thông báo cập nhật
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendFriendRequestNotification(receiverId, updatedCount);
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }

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
