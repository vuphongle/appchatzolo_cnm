package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.model.User;

import java.util.List;

public interface UserService {
    void createUser(User user);
    User findUserById(String id);
    User findUserByPhoneNumber(String phoneNumber);
    List<User> findAllUsers();
    User findUserById_ttt(String id);
    List<User> findByNameContainingIgnoreCase(String name);
}
