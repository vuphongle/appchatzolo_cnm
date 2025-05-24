package vn.edu.iuh.fit.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.model.UserFcmToken;
import vn.edu.iuh.fit.repository.UserFcmTokenRepository;

@Service
public class UserFcmTokenService {

    @Autowired
    private UserFcmTokenRepository repository;

    public void saveOrUpdateToken(String userId, String fcmToken) {
        UserFcmToken token = repository.findByUserId(userId).orElse(new UserFcmToken());
        token.setUserId(userId);
        token.setFcmToken(fcmToken);
        repository.save(token);
    }

    public String getTokenByUserId(String userId) {
        return repository.findByUserId(userId).map(UserFcmToken::getFcmToken).orElse(null);
    }
}
