/**
*
*  以下代码为自动生成，不要私自替换
*  var sw_config = {}
***/
var SW_CONFIG_NAME = '/sw_config.1.0.0.js';
self.importScripts(SW_CONFIG_NAME);

/*
 common:[],
        static: [],
        remote: [],
        runtime: []
*/
var STATIC_PREFIX = 'static';
var REMOTE_PREFIX = 'remote';
var RUNTIME_PREFIX = 'runtime';
var expectedCaches = [STATIC_PREFIX, REMOTE_PREFIX, RUNTIME_PREFIX];
self.addEventListener('install', function (event) {
    console.log('sub install')
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_PREFIX)
      .then(function (cache) {
        return cache.addAll(sw_config[STATIC_PREFIX])
      })
  )
})

self.addEventListener('activate', function (event) {
    console.log('sub activate')

  self.clients.claim();
  event.waitUntil(
    caches.keys().then(function (cacheName) {
      return Promise.all(
        cacheName.filter(n => expectedCaches.indexOf(n) === -1)
          .map(n => caches.delete(n))
      )
    })
  )
})

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url)
  var requestPath = requestUrl.pathname

  //静态资源部经过编译的 1、热更新的文件 2、_webpack_hmr 3、html 文件不缓存

  if (stringContains(requestPath, 'hot-update.json')
    || stringContains(requestPath, '__webpack_hmr ')
    || stringContains(requestPath, '.html ')) {
        event.respondWith(fetch(event.request))
    } else if (sw_config.static.indexOf(requestPath) > -1) {
    // console.log("cache first:", requestUrl.href);
        event.respondWith(cacheFirstStrategy(event.request))
    } else if (stringContains(event.request.url, 'http://localhost:8092/')) {
        event.respondWith(networkFirstStrategy(event.request))
    } else {
        event.respondWith(fetch(event.request))
    }
})

function cacheFirstStrategy (request) {
  return caches.match(request).then(function (cacheResponse) {
    return cacheResponse || fetchRequestAndCache(request)
  })
}

function networkFirstStrategy (request) {
  return fetchRequestAndCache(request).catch(function (response) {
    return caches.match(request).then(function (cacheResponse) {
      if (!cacheResponse) {
        var requestUrl = new URL(request.url)
        var requestPath = requestUrl.pathname
      }
      return cacheResponse
    })
  })
}

function fetchRequestAndCache (request) {
    var cacheName = getCacheName(request);

    return fetch(request).then(function (networkResponse) {
        caches.open(cacheName).then(function (cache) {
            cache.put(request, networkResponse)
        })
        return networkResponse.clone()
    })
}

function getCacheName (request) {

    let findStaticIndex = sw_config.static.findIndex(function (url) {
        return stringContains(request.url, url);
    });
    let findRuntimeIndex = sw_config.runtime.findIndex(function(url) {
        return stringContains(request.url, url);
    });
    if (findStaticIndex > -1) {
        return STATIC_PREFIX;
    } else  if(findRuntimeIndex > -1){
        return RUNTIME_PREFIX;
    } else {
        return REMOTE_PREFIX;
    }
}

function stringContains (str, search) {
  return str.indexOf(search) !== -1
}
