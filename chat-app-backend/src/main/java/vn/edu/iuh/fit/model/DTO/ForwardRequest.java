/*
 * @(#) $(NAME).java    1.0     4/10/2025
 *
 * Copyright (c) 2025 IUH. All rights reserved.
 */

package vn.edu.iuh.fit.model.DTO;

/*
 * @description
 * @author: Tran Tan Dat
 * @version: 1.0
 * @created: 10-April-2025 12:26 AM
 */

import java.util.List;

public class ForwardRequest {
    private String originalMessageId;
    private String senderID;
    private List<String> receiverIDs;

    public ForwardRequest(String originalMessageId, String senderID, List<String> receiverIDs) {
        this.originalMessageId = originalMessageId;
        this.senderID = senderID;
        this.receiverIDs = receiverIDs;
    }

    public ForwardRequest() {
    }

    public String getOriginalMessageId() {
        return originalMessageId;
    }

    public void setOriginalMessageId(String originalMessageId) {
        this.originalMessageId = originalMessageId;
    }

    public String getSenderID() {
        return senderID;
    }

    public void setSenderID(String senderID) {
        this.senderID = senderID;
    }

    public List<String> getReceiverIDs() {
        return receiverIDs;
    }

    public void setReceiverIDs(List<String> receiverIDs) {
        this.receiverIDs = receiverIDs;
    }
}
