const VERSION = "1";
const ORIGIN = location.protocol + '//' + location.hostname;
 
const STATIC_CACHE_KEY = 'static-' + VERSION;
const STATIC_FILES = [
    ORIGIN + '/',
    ORIGIN + '/images/logo.png',
    ORIGIN + '/css/bootstrap.min.css',
    ORIGIN + '/css/bootstrap-reboot.min.css',
    ORIGIN + '/css/common.css',
    ORIGIN + '/css/default.css',
    ORIGIN + '/js/jquery.js',
    ORIGIN + '/js/common.js',
];
const CACHE_KEYS = [
    STATIC_CACHE_KEY
];
 
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE_KEY).then(cache => {
            return Promise.all(
                STATIC_FILES.map(url => {
                    return fetch(new Request(url, { cache: 'no-cache', mode: 'no-cors' })).then(response => {
                    return cache.put(url, response);
                    });
                })
            );
        })
    );
});
 
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return cacheNames.filter((cacheName) => {
                // STATIC_CACHE_KEYではないキャッシュを探す
                return cacheName !== STATIC_CACHE_KEY;
            });
            }).then((cachesToDelete) => {
            return Promise.all(cachesToDelete.map((cacheName) => {
                // いらないキャッシュを削除する
                return caches.delete(cacheName);
            }));
        })
    );
});
 
self.addEventListener('fetch', event => {
    // POSTの場合はキャッシュを使用しない
    if ('POST' === event.request.method) {
        return;
    }
 
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            // キャッシュ内に該当レスポンスがあれば、それを返す
            if (response) {
                return response;
            }
 
          // 重要：リクエストを clone する。リクエストは Stream なので
          // 一度しか処理できない。ここではキャッシュ用、fetch 用と2回
          // 必要なので、リクエストは clone しないといけない
            let fetchRequest = event.request.clone();
 
            return fetch(fetchRequest)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    // キャッシュする必要のないタイプのレスポンスならそのまま返す
                    return response;
                }
 
                // 重要：レスポンスを clone する。レスポンスは Stream で
                // ブラウザ用とキャッシュ用の2回必要。なので clone して
                // 2つの Stream があるようにする
                let responseToCache = response.clone();
 
                caches.open(STATIC_CACHE_KEY)
                .then((cache) => {
                    cache.put(event.request, responseToCache);
                });
 
                return response;
            });
        })
    );
});

// Firebase利用準備
importScripts('https://www.gstatic.com/firebasejs/6.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/6.2.0/firebase-messaging.js');
firebase.initializeApp({
    'messagingSenderId': 'YOUR-SEND-ID'
});
const messaging = firebase.messaging();
 
// フォアグラウンドでのプッシュ通知受信
messaging.onMessage(function(payload) {
    var notificationTitle = payload.data.title; // タイトル
    var notificationOptions = {
      body: payload.data.body, // 本文
      icon: '/pwa_512.png', // アイコン
      click_action: 'https://xxxx.sample.com/' // 飛び先URL
    };
 
    if (!("Notification" in window)) {
        // ブラウザが通知機能に対応しているかを判定
    } else if (Notification.permission === "granted") {
        // 通知許可されていたら通知する
        var notification = new Notification(notificationTitle,notificationOptions);
    }
});
 
// バックグラウンドでのプッシュ通知受信
messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    var notificationTitle = payload.notification.title; // タイトル
    var notificationOptions = {
            body: payload.notification.body, // 本文
            icon: payload.notification.icon, // アイコン
    };
 
    return self.registration.showNotification(notificationTitle,
    notificationOptions);
});
