package vn.edu.iuh.fit.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.model.User;
import vn.edu.iuh.fit.repository.UserRepository;
import vn.edu.iuh.fit.service.UserService;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void createUser(User user) {
        userRepository.save(user);
    }

    @Override
    public User findUserById(String id) {
        return userRepository.findById(id);
    }

    @Override
    public User findUserByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber);
    }

    @Override
    public List<User> findAllUsers() {
        return userRepository.findAllUsers();
    }

    @Override
    public User findUserById_ttt(String id) {
        return userRepository.findById_ttt(id);
    }
}
