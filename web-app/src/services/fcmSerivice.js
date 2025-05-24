import { messaging, getToken } from "../firebase";

export async function requestFcmToken(userId) {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "BPUvFN0PuhBW_HuOriamhAImn25gE28dQPn1UTfp6zbsRVlqt7CcphHybs0ZMcw5wReYMi9", // lấy từ Firebase Console > Cloud Messaging
        });

        if (currentToken) {
            console.log("FCM Token:", currentToken);

            // Gửi token về backend để lưu
            await fetch("/fcm/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, fcmToken: currentToken }),
            });

        } else {
            console.warn("Không lấy được token. Yêu cầu người dùng cấp quyền.");
        }
    } catch (err) {
        console.error("Lỗi khi lấy FCM token:", err);
    }
}