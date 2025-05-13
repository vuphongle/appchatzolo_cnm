package vn.edu.iuh.fit.model.DTO.request;

import vn.edu.iuh.fit.enums.ReactType;

public class ReactRequest {
    private String userId;  // ID của người dùng gửi react
    private ReactType reactType;  // Loại react (LIKE, LOVE, HAHA, etc.)

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public ReactType getReactType() {
        return reactType;
    }

    public void setReactType(ReactType reactType) {
        this.reactType = reactType;
    }
}
