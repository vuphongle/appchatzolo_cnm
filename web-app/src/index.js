import React, { useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { WebSocketProvider } from "./context/WebSocket"; // Import WebSocketProvider
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import AuthContext

const WebSocketWrapper = () => {
    const { MyUser } = useAuth(); // Lấy thông tin người dùng từ AuthContext

    return (
        <WebSocketProvider userId={MyUser?.my_user?.id || "defaultUserId"}>
            <App />
        </WebSocketProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <AuthProvider>
            <WebSocketWrapper />
        </AuthProvider>
    </BrowserRouter>
);
