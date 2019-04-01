var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpush = require('web-push');
var formidable = require('formidable');
var fs = require('fs');
var UUID = require('uuid-v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwa-fb-key.json");

var {Storage} = require('@google-cloud/storage');
var gcs = new Storage ({
    projectId: 'pwa-licenta',
    keyFilename: 'pwa-fb-key.json'
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwa-licenta.firebaseio.com/'
});

 exports.storePostData = functions.https.onRequest(function (request, response) {
    cors(request, response, function(){
        var uuid = UUID();
        var formData = new formidable.IncomingForm();
        formData.parse(request, function(err, fields, files){
            fs.rename(files.file.path, '/tmp/' + files.file.name);
            var bucket = gcs.bucket('pwa-licenta.appspot.com');

            bucket.upload('/tmp/' + files.file.name, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: files.file.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, function(err, file){
                if(!err){
                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + encodeURIComponent(file.name) + '?alt=media&token=' + uuid 
                    }) 
                    .then(function(){
                        webpush.setVapidDetails('mailto:alleexx250595@gmail.com',
                        'BPkfMPsT3a0bfOKAu5FAb_JdfBFzdGoEusGQWZA9SzMJobtKq3sQlqKLB-QbatmiDVNdTPNaUKpzob_EHEbZ3lc',
                        'b9x3YYVS7KWtkgMAdtVj-6SVzXFBFzfY3eemfwkX2ZE');
                        return admin.database().ref('subscriptions').once('value');
                     })
                     .then(function(subscriptions){
                         subscriptions.forEach(function(sub){
                             var pushConfig = {
                                 endpoint: sub.val().endpoint,
                                 keys: {
                                     auth: sub.val().keys.auth,
                                     p256dh: sub.val().keys.p256dh
                                 }
                             };
                             webpush.sendNotification(pushConfig, JSON.stringify({
                                 title: 'New Post',
                                 content: 'New Post added!',
                             openUrl: '/help'
                             }))
                                 .catch(function(err){
                                     console.log(err);
                                 });
                         });
                         response.status(201).json({message: 'Data stored', id: fields.id});
                    })
                    .catch(function(err){
                     response.status(500).json({error: err});
                    });
                } else {
                    console.log(err);
                }
            });
        });
    });
 });

