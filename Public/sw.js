
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v25';
var CACHE_DYNAMIC_NAME = 'dynamic-v5';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/blog-post.html',
  '/contact-us.html',
  '/offline.html',
  '/manifest.json',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/idb.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/js/utility.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/css/help.css',
  '/assets/bootstrap/css/bootstrap.min.css',
  '/assets/bootstrap/js/bootstrap.min.js',
  '/assets/css/Features.css',
  '/assets/css/Features-1.css',
  '/assets/css/smoothproducts.css',
  '/assets/fonts/Simple-Line-Icons.eot',
  '/assets/fonts/simple-line-icons.min.css',
  '/assets/fonts/Simple-Line-Icons.svg',
  '/assets/fonts/Simple-Line-Icons.ttf',
  '/assets/fonts/Simple-Line-Icons.woff',
  '/assets/fonts/Simple-Line-Icons.woff2',
  '/assets/img/tech/image4.jpg',
  '/assets/js/Features.js',
  '/assets/js/Features-1.js',
  '/assets/js/jquery.min.js',
  '/assets/js/smoothproducts.min.js',
  '/assets/js/theme.js',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/baguettebox.js/1.10.0/baguetteBox.min.css',
  'https://daneden.github.io/animate.css/animate.min.css ',
  'https://fonts.googleapis.com/css?family=Montserrat:400,400i,700,700i,600,600i'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function (event) {

  var url = 'https://pwa-licenta.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key])
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(function (res) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then(function (cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html');
                    }
                  });
              });
          }
        })
    );
  }
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(function(data) {
          for (var dt of data) {
            var postData = new FormData();
            postData.append('id', dt.id);
            postData.append('title', dt.title);
            postData.append('location', dt.location);
            postData.append('file', dt.picture, dt.id + '.png');

            fetch('https://us-central1-pwa-licenta.cloudfunctions.net/storePostData', {
              method: 'POST',
              body: postData
            })
              .then(function(res) {
                console.log('Sent data', res);
                if (res.ok) {
                  res.json()
                  .then(function(resData){
                    for (var id in resData.id){
                      deleteItemFromData('sync-posts', resData.id);
                    }
                  });
                }
              })
              .catch(function(err) {
                console.log('Error while sending data', err);
              });
          }

        })
    );
  }
});

self.addEventListener('notificationclick', function(event){
  var notification = event.notification;
  var action = event.action;
  
  console.log(notification);

  if(action === 'confirm'){
    console.log('Confirm was chosen');
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll()
      .then(function(clis){
        var client = clis.find(function(c){
          return c.visibilityState === 'visible';
        });
        if(client !== undefined){
          client.navigate(notification.data.url);
          client.focus();
        } else {
          client.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener('notificationclose', function(event){
  console.log('Notification was closed!', event);
});

self.addEventListener('push', function(event){
  console.log('Push Notification received!', event);

  var data = {title: 'New!', content:'Something new happened!', openUrl: '/'};
  if(event.data){
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: 'src/images/icons/books-96x96.png',
    badge: 'src/images/icons/books-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});