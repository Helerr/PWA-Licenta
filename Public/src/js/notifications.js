
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

function askForNotificationPermission() {
    Notification.requestPermission(function(result) {
      console.log('User Choice', result);
      if (result !== 'granted') {
        console.log('Permission denied!');
      } else {
        //displayConfirmNotification();
        configurePushSub();
      }
    });
  }
  
if ('Notification' in window && 'serviceWorker' in navigator) {
  for (i=0; i < enableNotificationsButtons.length ; i++){
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
} else {
  
}

function displayConfirmNotification() {
  if ('serviceWorker' in navigator){
    var options = {
      body: 'You successfully subscribed to our Notification service! Thank you!',
      icon: '/src/images/icons/books-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/books-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'Okay', icon: '/src/images/icons/books-96x96.png'},
        { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/books-96x96.png'}
      ]
    };
    navigator.serviceWorker.ready
      .then(function(swreg){
        swreg.showNotification('Successfully subscribed!', options);
      });
  }
}

function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  var reg;
  navigator.serviceWorker.ready
    .then(function(swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function(sub) {
      if (sub === null) {
        // Create a new subscription
        var vapidPublicKey = 'BPkfMPsT3a0bfOKAu5FAb_JdfBFzdGoEusGQWZA9SzMJobtKq3sQlqKLB-QbatmiDVNdTPNaUKpzob_EHEbZ3lc';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // We have a subscription
      }
    })
    .then(function(newSub) {
      return fetch('https://pwa-licenta.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(function(res) {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch(function(err) {
      console.log(err);
    });
}
