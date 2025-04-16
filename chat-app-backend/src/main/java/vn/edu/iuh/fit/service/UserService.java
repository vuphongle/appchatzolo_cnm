package vn.edu.iuh.fit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import vn.edu.iuh.fit.model.Message;
import vn.edu.iuh.fit.model.User;

import java.util.List;

public interface UserService {
    void createUser(User user);
    User findUserById(String id);
    User findUserByPhoneNumber(String phoneNumber);
    List<User> findAllUsers();
    User findUserById_ttt(String id);
    void updateUser(User user);
    List<User> findByNameContainingIgnoreCase(String name, String userId);
    boolean removeFriend(String userId, String friendId) throws JsonProcessingException;
    String getUserAvatar(String userId);
    void updateUserAvatar(String userId, String newAvatarUrl);
}
