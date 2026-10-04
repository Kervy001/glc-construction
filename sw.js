// GLC Construction HT — Service Worker (v6)
// Network-first pou fichye sit la (dènye deplwaman toujou parèt lè gen entènèt),
// kach la sèvi sèlman kòm repli offline. Apèl Firebase/Google pa janm entèsepte.

var CACHE_NAME = 'glc-construction-ht-v6';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];
// Resous ekstèn ki an sekirite pou kache (polis, SDK Firebase, QR) — pou app la ka demare offline
var CACHEABLE_HOSTS = ['fonts.googleapis.com','fonts.gstatic.com','www.gstatic.com','cdn.jsdelivr.net'];
// Sèvis dinamik: pa janm touche yo (otantifikasyon, Firestore, tokens)
var BYPASS_HOSTS = ['firestore.googleapis.com','identitytoolkit.googleapis.com','securetoken.googleapis.com','www.googleapis.com','apis.google.com','accounts.google.com','www.google.com'];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // Chak fichye endepandan: si yon ikòn manke, enstalasyon an pa echwe
      return Promise.all(APP_SHELL.map(function(u){ return cache.add(u).catch(function(){}); }));
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
    }).then(function(){ return self.clients.claim(); })
  );
});

function storable(res){
  return res && (res.ok || res.type === 'opaque') && res.status !== 206;
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url;
  try{ url = new URL(req.url); }catch(e){ return; }
  if(url.protocol !== 'http:' && url.protocol !== 'https:') return;

  var sameOrigin = url.origin === self.location.origin;
  if(!sameOrigin){
    if(BYPASS_HOSTS.indexOf(url.hostname) !== -1) return;          // kite navigatè a jere l
    if(CACHEABLE_HOSTS.indexOf(url.hostname) === -1) return;       // lòt domèn: pa entèsepte
  }

  event.respondWith(
    fetch(req).then(function(res){
      if(storable(res)){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req, {ignoreSearch:true}).then(function(hit){
        if(hit) return hit;
        if(req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
