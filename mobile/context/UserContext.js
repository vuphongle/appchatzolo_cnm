// contexts/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Auth } from 'aws-amplify';
import { IPV4 } from '@env';

export const UserContext = createContext();

// contexts/UserContext.js
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm để lấy thông tin người dùng từ server
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
                setUser(userData);
                return userData; // Thêm dòng này để trả về dữ liệu người dùng
            } else {
                const error = await response.text();
                console.error('Error fetching user:', error);
                Alert.alert('Lỗi', `Không tìm thấy người dùng: ${phoneNumber}`);
                return null; // Trả về null nếu không thành công
            }
        } catch (error) {
            console.error('Error during API call:', error);
            Alert.alert('Lỗi', 'Không thể kết nối tới server.');
            return null; // Trả về null nếu có lỗi
        }
    };

    // Hàm để kiểm tra và lấy người dùng hiện tại nếu đã đăng nhập
    const loadUser = async () => {
        try {
            const authenticatedUser = await Auth.currentAuthenticatedUser();
            const phoneNumber = authenticatedUser.attributes.phone_number;
            await fetchUserProfile(phoneNumber);
        } catch (error) {
            console.log('Người dùng chưa đăng nhập');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, fetchUserProfile }}>
            {!loading && children}
        </UserContext.Provider>
    );
};

