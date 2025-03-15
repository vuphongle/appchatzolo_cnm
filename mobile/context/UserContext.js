// contexts/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Auth } from 'aws-amplify';
import { IPV4 } from '@env';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  // Hàm lấy thông tin người dùng từ server dựa trên số điện thoại
  const fetchUserProfile = async (phoneNumber) => {
    try {
      const response = await fetch(IPV4 + '/user/findByPhoneNumber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data:', userData);
        return userData;
      } else {
        const error = await response.text();
        return null;
      }
    } catch (error) {
      console.error('Error during API call:', error);
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
      return null;
    }
  };

  // Hàm kiểm tra và lấy người dùng hiện tại nếu đã đăng nhập
  const loadUser = async () => {
    try {
      const authenticatedUser = await Auth.currentAuthenticatedUser();
      const phoneNumber = authenticatedUser.attributes.phone_number;
      const userData = await fetchUserProfile(phoneNumber);
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.log('Người dùng chưa đăng nhập');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Hàm cập nhật số lời mời kết bạn từ server
  const updateFriendRequestsCount = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${IPV4}/messages/invitations/received/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriendRequestsCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
    }
  };

  // Polling: cập nhật số lời mời mỗi 30 giây khi có user
  useEffect(() => {
    let intervalId;
    if (user) {
      updateFriendRequestsCount(); // Cập nhật ngay lần đầu
      intervalId = setInterval(() => {
        updateFriendRequestsCount();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        fetchUserProfile,
        friendRequestsCount,
        updateFriendRequestsCount,
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
};
