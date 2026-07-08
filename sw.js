// GLC Construction HT — Service Worker
// Basic app-shell caching so the tool keeps working with a weak/no connection on chantye.

var CACHE_NAME = 'glc-construction-ht-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first for app shell files, network-first (with cache fallback) for everything else.
self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;

  var url = new URL(req.url);
  var isSameOrigin = url.origin === self.location.origin;

  if(isSameOrigin){
    event.respondWith(
      caches.match(req).then(function(cached){
        return cached || fetch(req).then(function(res){
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
          return res;
        }).catch(function(){ return cached; });
      })
    );
  } else {
    // Fonts / external CDN / API calls: try network, don't break offline if it fails.
    event.respondWith(
      fetch(req).catch(function(){ return caches.match(req); })
    );
  }
});
