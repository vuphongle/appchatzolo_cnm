import React, { createContext, useContext, useState } from 'react';

// Tạo context cho người dùng
const AuthContext = createContext();

// Cung cấp các thông tin và hàm cần thiết qua context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [MyUser, setMyUser] = useState(null); 

    const login = (userData) => {
        setMyUser(userData); 
    };

    const logout = () => {
        setMyUser(null); 
    };

    return (
        <AuthContext.Provider value={{ MyUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
