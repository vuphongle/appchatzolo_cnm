// firebase_messaging.js (hoặc firebase.js)
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDEegNIiabJOACgu8C_p0JUkpjQ6EtW_Mw",
    authDomain: "my-web-app-35fda.firebaseapp.com",
    projectId: "my-web-app-35fda",
    storageBucket: "my-web-app-35fda.firebasestorage.app",
    messagingSenderId: "909646918228",
    appId: "1:909646918228:web:1c76dbe5c264d2cc4e33c1",
    measurementId: "G-KL1JE2M6H1"
};

// Khởi tạo app và messaging
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Đăng ký service worker khi lấy token
export const requestFcmToken = async () => {
    try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        const token = await getToken(messaging, {
            vapidKey: "YOUR_VAPID_KEY_HERE",
            serviceWorkerRegistration: registration, // ✅ Bắt buộc khi muốn nhận notification khi tắt trình duyệt
        });

        console.log("FCM Token:", token);
        return token;
    } catch (err) {
        console.error("FCM error:", err);
        return null;
    }
};


// Hàm yêu cầu quyền và lấy FCM token
export const requestFirebaseNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("🔒 Permission denied for notifications");
            return null;
        }

        // Đăng ký service worker trước
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("✅ Service Worker registered", registration);

        // Lấy token, truyền vào serviceWorkerRegistration
        const token = await getToken(messaging, {
            vapidKey: "BPUvFN0PuhBW_HuOriamhAImn25gE28dQPn1UTfp6zbsRVlqt7CcphHybs0ZMcw5wReYMi9-RZpbs0lTB8nKROQ",
            serviceWorkerRegistration: registration
        });

        console.log("📲 FCM Token:", token);
        return token;

    } catch (error) {
        console.error("❌ Lỗi khi lấy FCM token:", error);
        return null;
    }
};

// Hàm lắng nghe tin nhắn khi app đang mở (foreground)
export const onMessageListener = (callback) => {
    return onMessage(messaging, callback);
};
