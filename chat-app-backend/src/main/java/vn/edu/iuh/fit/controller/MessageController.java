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

    @GetMapping("/addSampleData")
    public ResponseEntity<String> addSampleData() {
        System.out.println("1111111111111111");
        // Dữ liệu mẫu
        Message message1 = new Message();
        message1.setRoomId("room1");
        message1.setTimestamp("2024-12-31T21:00:00");
        message1.setUserId("user123");
        message1.setContent("Hello, this is the first message!");

        Message message2 = new Message();
        message2.setRoomId("room2");
        message2.setTimestamp("2024-12-31T22:00:00");
        message2.setUserId("user456");
        message2.setContent("This is a message in room2.");

        Message message3 = new Message();
        message3.setRoomId("room3");
        message3.setTimestamp("2024-12-31T23:00:00");
        message3.setUserId("user789");
        message3.setContent("Another message in room1.");
        System.out.println("22222222222222222");

        // Lưu dữ liệu vào DynamoDB
        service.sendMessage(message1);
        service.sendMessage(message2);
        service.sendMessage(message3);

        // Phản hồi
        return ResponseEntity.ok("Sample data added successfully!");
    }


    @PostMapping
    public ResponseEntity<Void> sendMessage(@RequestBody Message message) {
        service.sendMessage(message);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable String roomId) {
        List<Message> messages = service.getMessages(roomId);
        return ResponseEntity.ok(messages);
    }
}
