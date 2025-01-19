package vn.edu.iuh.fit.service;

import vn.edu.iuh.fit.model.User;

public interface UserService {
    void createUser(User user);
    User findUserById(String id);
    User findUserByPhoneNumber(String phoneNumber);
    User findUserById_ttt(String id);
}
