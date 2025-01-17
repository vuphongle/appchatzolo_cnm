package vn.edu.iuh.fit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.service.MessageService;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;

    @Autowired
    public MessageController(MessageService service) {
        this.service = service;
    }

    //Gửi lời mời kết bạn
    @PostMapping("/addFriend")
    public void sendMessage(@RequestBody Message message) {
        System.out.println("Received message: " + message);
        service.sendMessage(message);
    }

    //Tìm danh sách lời mời kết bạn
    @GetMapping("/invitations/received/{receiverId}")
    public ResponseEntity<List<Message>> getReceivedInvitations(@PathVariable String receiverId) {
        List<Message> invitations = service.getInvitationsByReceiverId(receiverId);
        return ResponseEntity.ok(invitations);
    }

    //Tìm danh sách các lời mời đã gửi đi
    @GetMapping("/invitations/sent/{senderId}")
    public ResponseEntity<List<Message>> getSentInvitations(@PathVariable String senderId) {
        List<Message> sentInvitations = service.getSentInvitationsBySenderId(senderId);
        return ResponseEntity.ok(sentInvitations);
    }


}
