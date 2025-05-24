import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDEegNIiabJOACgu8C_p0JUkpjQ6EtW_Mw",
    authDomain: "my-web-app-35fda.firebaseapp.com",
    projectId: "my-web-app-35fda",
    storageBucket: "my-web-app-35fda.firebasestorage.app",
    messagingSenderId: "909646918228",
    appId: "1:909646918228:web:1c76dbe5c264d2cc4e33c1",
    measurementId: "G-KL1JE2M6H1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: 'BPUvFN0PuhBW_HuOriamhAImn25gE28dQPn1UTfp6zbsRVlqt7CcphHybs0ZMcw5wReYMi9-RZpbs0lTB8nKROQ' });
            return token; // gửi token này lên server lưu lại
        } else {
            console.error('Permission not granted for Notification');
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
