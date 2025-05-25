importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const data = payload.data || {};
    const notificationTitle = data.title || 'Cuộc gọi video';
    const notificationOptions = {
        body: data.body || `${data.fromUserName || 'Ai đó'} đang gọi bạn`,
        icon: '/icon.png',
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý click vào notification để mở trang video call
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Nếu đã có tab mở thì focus nó
            for (const client of clientList) {
                if ('focus' in client) {
                    console.log('Focusing existing client:', client.url);
                    console.log('Data from notification:', data);

                    client.focus();
                    // Chuyển hướng trang trong tab đó nếu cần
                    if (data?.type === 'video_call_request' && data?.fromUserId) {
                        client.navigate(`/main?callerId=${data.fromUserId}`);
                    }
                    return;
                }
            }
            // Nếu không có tab thì mở mới
            if (clients.openWindow) {
                const url = data?.type === 'video_call_request' && data?.fromUserId
                    ? `/main?callerId=${data.fromUserId}`
                    : '/';
                return clients.openWindow(url);
            }
        })
    );
});
