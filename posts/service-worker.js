const CACHE_NAME = 'mandarin-trainer-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/pico.min.css',
    '/css/styles.css',
    '/js/tone-trainer.js',
    '/js/pinyin_dict2.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});