package vn.edu.iuh.fit.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.enums.ReactType;
import vn.edu.iuh.fit.exception.GroupException;
import vn.edu.iuh.fit.handler.MyWebSocketHandler;
import vn.edu.iuh.fit.model.DTO.UnreadMessagesCountDTO;
import vn.edu.iuh.fit.model.DTO.response.MessageResponse;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.model.Reaction;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.repository.GroupRepository;
import vn.edu.iuh.fit.repository.MessageRepository;
import vn.edu.iuh.fit.repository.UserRepository;
import vn.edu.iuh.fit.service.MessageService;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MessageServiceImpl implements MessageService {
    private final MessageRepository repository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GroupRepository groupRepository;
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
        if(message.getStatus().equals("Chờ đồng ý")) {
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

    // thu hồi lời mời kết bạn
    @Override
    public void deleteInvitation(String senderID, String receiverID) throws JsonProcessingException {
        repository.deleteInvitation(senderID, receiverID);

        List<Message> invitations = getInvitationsByReceiverId(receiverID);
        int updatedCount = invitations.size();

        // Lấy bean MyWebSocketHandler một cách lazy và gửi thông báo cập nhật
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendRevokeInvitationNotification(senderID,receiverID, updatedCount);
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    //Từ chối lời mời kết bạn
    @Override
    public void refuseInvitation(String senderID, String receiverID) throws JsonProcessingException {
        repository.deleteInvitation(senderID, receiverID);

        List<Message> invitations = getInvitationsByReceiverId(receiverID);
        int updatedCount = invitations.size();

        // Lấy bean MyWebSocketHandler một cách lazy và gửi thông báo cập nhật
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            myWebSocketHandler.sendRefuseInvitationNotification(receiverID, senderID, updatedCount);
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
            myWebSocketHandler.sendSubmitFriendNotification(receiverId,senderId, updatedCount);
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

        if (friendIds == null || friendIds.isEmpty()) {
            return unreadCounts;
        }
        for (String friendId : friendIds) {
            int unreadCount = repository.getUnreadMessagesCount(receiverID, friendId);
            unreadCounts.add(new UnreadMessagesCountDTO(friendId, unreadCount));
        }

        return unreadCounts;
    }

    @Override
    public void deleteMessagesBetweenUsers(String senderID, String receiverID) {
        repository.deleteMessagesBetweenUsers(senderID, receiverID);
        try {
            MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
            if (myWebSocketHandler != null) {
                myWebSocketHandler.sendDeleteMessageNotification(senderID, receiverID);
                myWebSocketHandler.sendDeleteMessageNotification(receiverID, senderID);
            } else {
                System.err.println("MyWebSocketHandler bean is not available.");
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void recallMessage(String messageId, String senderID, String receiverID) {
        // Xóa tin nhắn khỏi DynamoDB
        repository.recallMessage(messageId);

        // Gửi thông báo thu hồi tin nhắn qua WebSocket cho cả hai bên
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            try {
                // Gửi thông báo đến người nhận
                myWebSocketHandler.sendRecallMessageNotification(receiverID, senderID, messageId);
                // Gửi thông báo đến người gửi (để cập nhật UI nếu cần)
                myWebSocketHandler.sendRecallMessageNotification(senderID, senderID, messageId);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    @Override
    public void forwardMessage(String originalMessageId, String senderID, List<String> receiverIDs) {
        Message original = repository.getMessageById(originalMessageId);
        if (original == null) {
            throw new RuntimeException("Không tìm thấy tin nhắn gốc");
        }

        for (String receiverId : receiverIDs) {
            // Kiểm tra xem receiverId có phải là groupId không
            boolean isGroup = groupRepository.getMembersOfGroup(receiverId) != null;

            Message newMsg = new Message();
            newMsg.setId(UUID.randomUUID().toString());
            newMsg.setSenderID(senderID);
            newMsg.setReceiverID(receiverId);
            newMsg.setContent(original.getContent());
            newMsg.setSendDate(LocalDateTime.now(ZoneOffset.UTC));
            newMsg.setIsRead(false);
            newMsg.setType(isGroup ? "GROUP_CHAT" : "PRIVATE_CHAT"); // Đặt type phù hợp

            // Lưu tin nhắn vào cơ sở dữ liệu
            repository.save(newMsg);
            System.out.println("Saved forwarded message to " + receiverId + ", type: " + newMsg.getType());

            // Gửi tin nhắn qua WebSocket
            MyWebSocketHandler handler = myWebSocketHandlerProvider.getIfAvailable();
            if (handler != null) {
                try {
                    handler.sendChatMessage(newMsg); // Gửi cho người nhận (hoặc nhóm)
                } catch (Exception e) {
                    System.err.println("Error forwarding message to " + receiverId + ": " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.err.println("MyWebSocketHandler bean không khả dụng. Không thể gửi tin nhắn.");
            }
        }
    }

    @Override
    public void deleteMessageForUser(String messageId, String userId) {
        repository.deleteMessageForUser(messageId, userId);
    }

    @Override
    public List<MessageResponse> getMessagesInGroup(String groupId) {
        // Truy vấn tất cả tin nhắn trong nhóm từ DynamoDB (dựa vào receiverID là groupId)
        List<Message> messages = repository.findMessagesInGroup(groupId);
        List<MessageResponse> messageResponses = new ArrayList<>();
        for (Message message : messages) {
            // Lấy thông tin người gửi từ bảng User
            User sender = userRepository.findById(message.getSenderID());

            // Tạo MessageResponse từ Message
            MessageResponse response = MessageResponse.builder()
                    .id(message.getId())
                    .content(message.getContent())
                    .sendDate(message.getSendDate())
                    .senderID(message.getSenderID())
                    .receiverID(message.getReceiverID())
                    .isRead(message.getIsRead())
                    .media(message.getMedia())
                    .status(message.getStatus())
                    .type("group")
                    .deletedBySender(message.isDeletedBySender())
                    .deletedByReceiver(message.isDeletedByReceiver())
                    .typeWeb(message.getTypeWeb())
                    .reactions(message.getReactions())
                    .name(sender != null ? sender.getName() : "Unknown")  // Lấy tên người gửi
                    .avatar(sender != null ? sender.getAvatar() : "")  // Lấy avatar người gửi
                    .build();

            messageResponses.add(response);
        }
        return messageResponses;
    }

    //thêm react vào tin nhắn
    @Override
    public void addReactToMessage(String messageId, String userId, ReactType reactType) {
        // Tìm tin nhắn theo ID
        Message message = repository.getMessageById(messageId);
        if(message == null) {
            System.out.println("Message not found - trong hàm addReactToMessage ");
        }
        // Kiểm tra nếu reactions chưa được khởi tạo, tạo một mảng mới
        if (message.getReactions() == null) {
            message.setReactions(new ArrayList<>());  // Khởi tạo mảng reactions nếu chưa có
        }

        // Tạo reaction mới với ID duy nhất
        Reaction newReaction = new Reaction(userId, reactType); // Tạo reaction mới
        message.getReactions().add(newReaction);  // Thêm reaction mới vào mảng reactions

        // Lưu lại tin nhắn đã cập nhật reaction
        repository.save(message);  // Lưu tin nhắn với reactions mới

        // Gửi thông báo qua WebSocket cho người nhận
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            // Userid người cần thông báo
            if(userId.equals(message.getSenderID())) {
                userId = message.getReceiverID();
            } else {
                userId = message.getSenderID();
            }
            if(message.getType() != null && message.getType().equals("GROUP_CHAT")) {
                userId = message.getReceiverID();
            }
            try {
                myWebSocketHandler.sendReactNotification(userId, messageId , String.valueOf(reactType));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    @Override
    public void removeReactFromMessage(String messageId, String userId) {
        // Tìm tin nhắn theo ID
        Message message = repository.getMessageById(messageId);
        if(message == null) {
            System.out.println("Message not found - trong hàm removeReactFromMessage ");
        }


        // Xóa reaction của người dùng khỏi danh sách reactions
        String finalUserId = userId;
        message.getReactions().removeIf(reaction -> reaction.getUserId().equals(finalUserId));

        // Lưu lại tin nhắn sau khi xóa reaction
        repository.save(message);

        // Gửi thông báo qua WebSocket cho người nhận
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            // Userid người cần thông báo
            if(userId.equals(message.getSenderID())) {
                userId = message.getReceiverID();
            } else {
                userId = message.getSenderID();
            }
            if(message.getType() != null && message.getType().equals("GROUP_CHAT")) {
                userId = message.getReceiverID();
            }
            try {
                myWebSocketHandler.sendRemoveReactNotification(userId, messageId);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        } else {
            System.err.println("MyWebSocketHandler bean is not available.");
        }
    }

    @Override
    public Message pinMessage(String messageId, String userId) throws GroupException {
        Message message = repository.getMessageById(messageId);
        if(message == null) {
            throw new GroupException("Tin nhắn không tồn tại");
        }

        if(message.isPinned()) {
            throw new GroupException("Tin nhắn đã được ghim trước đó");
        } else {
            List<Message> pinnedMessages = repository.findPinnedMessages(message.getSenderID(), message.getReceiverID());
            if(pinnedMessages.size() >= 3) {
                throw new GroupException("Đã đạt giới hạn 3 tin nhắn ghim trong đoạn chat này");
            } else {
                message.setPinned(true);
                repository.save(message);
            }
            // Gửi thông báo qua WebSocket cho người nhận
            return getMessage(messageId, userId, message);
        }
    }

    @Override
    public Message unpinMessage(String messageId, String userId) throws GroupException {
        Message message = repository.getMessageById(messageId);
        if(message == null) {
            throw new GroupException("Tin nhắn không tồn tại");
        }

        if(!message.isPinned()) {
            throw new GroupException("Tin nhắn chưa được ghim trước đó");
        } else {
            message.setPinned(false);
            repository.save(message);
            // Gửi thông báo qua WebSocket cho người nhận
            return getMessage(messageId, userId, message);
        }
    }

    @NotNull
    private Message getMessage(String messageId, String userId, Message message) throws GroupException {
        MyWebSocketHandler myWebSocketHandler = myWebSocketHandlerProvider.getIfAvailable();
        if (myWebSocketHandler != null) {
            // Userid người cần thông báo
            if(userId.equals(message.getSenderID())) {
                userId = message.getReceiverID();
            } else {
                userId = message.getSenderID();
            }
            if(message.getType() != null && message.getType().equals("GROUP_CHAT")) {
                userId = message.getReceiverID();
            }
            try {
                myWebSocketHandler.sendPinMessageNotification(userId, messageId);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        } else {
            throw new GroupException("MyWebSocketHandler bean is not available.");
        }
        return message;
    }
}

