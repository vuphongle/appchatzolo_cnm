importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Config từ Firebase console
firebase.initializeApp({
    apiKey: "AIzaSyDEegNIiabJOACgu8C_p0JUkpjQ6EtW_Mw",
    authDomain: "my-web-app-35fda.firebaseapp.com",
    projectId: "my-web-app-35fda",
    storageBucket: "my-web-app-35fda.appspot.com",
    messagingSenderId: "909646918228",
    appId: "1:909646918228:web:1c76dbe5c264d2cc4e33c1",
    measurementId: "G-KL1JE2M6H1"
});

const messaging = firebase.messaging();

// Lắng nghe khi nhận thông báo ở background
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const data = payload.data || {};
    const notificationTitle = data.title || 'Cuộc gọi video';
    const notificationOptions = {
        body: data.body || `${data.fromUserName || 'Ai đó'} đang gọi bạn`,
        icon: '/icon.png',
        data: {
            url: `/main?callerId=${data.fromUserId || ''}`
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (let client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
