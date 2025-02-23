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
        localStorage.setItem('my_user', JSON.stringify(userData)); // Lưu thông tin vào LocalStorage
        localStorage.setItem('phoneNumber', userData.username);
        localStorage.setItem('userAttributes', JSON.stringify(userData.userAttributes));
        localStorage.setItem('lastLoginTime', userData.lastLoginTime);

        if (callback) {
            callback(); // Gọi callback sau khi MyUser được cập nhật
        }
    };

    // Hàm logout để xóa thông tin trong context và localStorage
    const logout = (callback) => {
        setMyUser(null);
        localStorage.removeItem('idToken');
        localStorage.removeItem('my_user'); // Xóa thông tin người dùng khỏi LocalStorage
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('userAttributes');

        if (callback) {
            setTimeout(() => {
                callback();
            }, 3000);
        }
    };

    // Hàm updateUserInfo để cập nhật thông tin người dùng
    const updateUserInfo = (updatedUserData) => {
        setMyUser((prevUser) => {
            const updatedUser = { ...prevUser, ...updatedUserData }; // Cập nhật thông tin người dùng
            localStorage.setItem('my_user', JSON.stringify(updatedUser)); // Lưu lại vào localStorage
            return updatedUser;
        });
    };

    // Theo dõi sự thay đổi trong localStorage giữa các tab
    useEffect(() => {
        const handleStorageChange = () => {
            const storedUser = localStorage.getItem('my_user');
            if (storedUser) {
                setMyUser(JSON.parse(storedUser)); // Cập nhật giá trị MyUser từ localStorage
            } else {
                setMyUser(null); // Nếu không có dữ liệu, gán MyUser là null
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Lưu thông tin MyUser vào localStorage mỗi khi MyUser thay đổi
    useEffect(() => {
        if (MyUser) {
            localStorage.setItem('my_user', JSON.stringify(MyUser)); // Lưu lại thông tin khi MyUser thay đổi
        }
    }, [MyUser]);

    return (
        <AuthContext.Provider value={{ MyUser, setMyUser, login, logout, updateUserInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
