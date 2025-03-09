package vn.edu.iuh.fit.model.DTO;

public class UnreadMessagesCountDTO {
    private String friendId;
    private int unreadCount;

    public UnreadMessagesCountDTO(String friendId, int unreadCount) {
        this.friendId = friendId;
        this.unreadCount = unreadCount;
    }

    public String getFriendId() {
        return friendId;
    }

    public void setFriendId(String friendId) {
        this.friendId = friendId;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }
}
