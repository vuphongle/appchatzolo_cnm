import React, { createContext, useContext, useState, useEffect } from 'react';

// Tạo context cho người dùng
const AuthContext = createContext();

// Cung cấp các thông tin và hàm cần thiết qua context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Kiểm tra và lấy thông tin người dùng từ LocalStorage nếu có
    const [MyUser, setMyUser] = useState(() => {
        const storedUser = localStorage.getItem('my_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Hàm login để lưu thông tin vào context và localStorage
    const login = (userData, callback) => {
        setMyUser(userData);
        localStorage.setItem('idToken', userData.idToken);
        localStorage.setItem('my_user', JSON.stringify(userData));
        localStorage.setItem('phoneNumber', userData.username);
        localStorage.setItem('userAttributes', JSON.stringify(userData.userAttributes));
        localStorage.setItem('lastLoginTime', userData.lastLoginTime);

        if (callback) {
            callback();
        }
    };

    // Hàm logout để xóa thông tin trong context và localStorage
    const logout = (callback) => {
        setMyUser(null);
        localStorage.removeItem('idToken');
        localStorage.removeItem('my_user');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('userAttributes');

        if (callback) {
            setTimeout(() => {
                callback();
            }, 3000);
        }
    };

    // Hàm updateUserInfo để cập nhật thông tin người dùng mà không mất dữ liệu cũ
    const updateUserInfo = (updatedUserData) => {
        setMyUser((prevUser) => {
            if (!prevUser) return updatedUserData;
            const updatedUser = { ...prevUser, ...updatedUserData }; // Gộp dữ liệu cũ và mới
            localStorage.setItem('my_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    // Theo dõi sự thay đổi trong localStorage giữa các tab
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'my_user') {
                const storedUser = event.newValue ? JSON.parse(event.newValue) : null;
                setMyUser(storedUser);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ MyUser, setMyUser, login, logout, updateUserInfo }}>
            {children}
        </AuthContext.Provider>
    );
};