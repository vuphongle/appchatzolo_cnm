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
}
