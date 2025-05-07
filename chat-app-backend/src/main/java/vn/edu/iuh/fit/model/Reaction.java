package vn.edu.iuh.fit.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import vn.edu.iuh.fit.enums.ReactType;

@DynamoDbBean
public class Reaction {
    private String userId;
    private ReactType reactionType;

    public Reaction(String userId) {
        this.userId = userId;
    }

    public Reaction() {
    }

    public Reaction(String userId, ReactType reactionType) {
        this.userId = userId;
        this.reactionType = reactionType;
    }

    @DynamoDbAttribute("userId")
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbAttribute("reactionType")
    public ReactType getReactionType() {
        return reactionType;
    }

    public void setReactionType(ReactType reactionType) {
        this.reactionType = reactionType;
    }

    @Override
    public String toString() {
        return "Reaction{" +
                "userId='" + userId + '\'' +
                ", reactionType=" + reactionType +
                '}';
    }
}
