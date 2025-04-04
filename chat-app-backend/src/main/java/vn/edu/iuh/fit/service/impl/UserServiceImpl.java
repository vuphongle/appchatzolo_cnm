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

    @Override
    public List<User> findByNameContainingIgnoreCase(String name, String userId) {
        return userRepository.findByNameContainingIgnoreCase(name, userId);
    }

    @Override
    public boolean removeFriend(String userId, String friendId) {
        return userRepository.removeFriend(userId, friendId);
    }

    @Override
    public String getUserAvatar(String userId) {
        return userRepository.findById_ttt(userId).getAvatar();
    }

    @Override
    public void updateUserAvatar(String userId, String newAvatarUrl) {
        User user = userRepository.findById_ttt(userId);
        user.setAvatar(newAvatarUrl);
        userRepository.save(user);
    }

    @Override
    public void updateUser(User user) {
        userRepository.save(user);
    }
}
