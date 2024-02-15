var CACHE_NAME = 'mandarin-tone-trainer-cache';
var urlsToCache = [
    'https://r2.adarshsolanki.com/model.onnx'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
  
          // IMPORTANT: Clone the response. A response is a stream and because we want the browser to consume the response
          // as well as the cache consuming the response, we need to clone it so we have two streams.
          return fetch(event.request).then(response => {
            let responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
  
            return response;
          });
        })
    );
  });