import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Auth } from 'aws-amplify';
import { IPV4 } from '@env';
import GroupService from '../services/GroupService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(0);
  const [isChange, setIsChange] = useState("");
  const [accept, setAccept] = useState(false);
  const [reject, setReject] = useState(false);
  const [infoGroup, setInfoGroup] = useState(null);
  const [infoMemberGroup, setInfoMemberGroup] = useState([]);

  // Hàm lấy thông tin người dùng từ server dựa trên số điện thoại
  const fetchUserProfile = async (phoneNumber) => {
    try {
        console.log('Fetching user profile for phone number:', phoneNumber);
      const response = await fetch(IPV4 + '/user/findByPhoneNumber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        const userData = await response.json();
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

  // Hàm cập nhật thông tin người dùng
    const updateUserProfile = async (updatedData) => {
      const result = await fetchUserProfile(user?.phoneNumber);
        if (result) {
            setUser(result);
        } else {
            console.error('Không thể cập nhật thông tin người dùng');
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

  // Hàm update infoGroup
    const updateInfoGroup = async (groupId) => {
        try {
        const response = await fetch(`${IPV4}/groups/getGroupById/${groupId}`);
        if (response.success) {
            const groupData = await response.json();
            setInfoGroup(groupData.data);
        } else {
            console.error('Error fetching group data');
        }
        } catch (error) {
            console.error('Error fetching group data:', error);
        }
    };

  // Hàm update infoMemberGroup
    const updateInfoMemberGroup = async (groupId) => {
        try {
          const response = await GroupService.getGroupMembers(groupId);

          if (response.data && Array.isArray(response.data) && response.data[0].userGroups) {
            const userGroups = response.data[0].userGroups;
            setInfoMemberGroup(userGroups);
          } else {
            console.error('Dữ liệu không hợp lệ:', response.data);
            setInfoMemberGroup([]);
          }

        } catch (error) {
          console.error('Lỗi khi lấy thông tin thành viên nhóm:', error);
          setInfoMemberGroup([]);
        }
    };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        fetchUserProfile,
        notification,
        setNotification,
        isChange,
        setIsChange,
        updateUserProfile,
        accept,
        setAccept,
        reject,
        setReject,
        infoGroup,
        setInfoGroup,
        infoMemberGroup,
        setInfoMemberGroup,
        updateInfoMemberGroup,
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
};
