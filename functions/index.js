/* eslint-disable promise/no-nesting */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const VrgHelper = require('./VrgHelper.js');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createGame = functions.https.onCall(async(datas, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games').push();

    let user = await admin.database().ref('users/'+uid).once('value');

    let game = {
        players : [{
            uid:uid,
            name:user.displayName
        }],
        ready: false,
        loaded:true,
    }

    gameRef.set(game);


    return gameRef.key;
    
});

exports.joinGame = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);
    let user = await admin.database().ref('users/'+uid).once('value');
    
    let game = await gameRef.once('value');

    if(game.players.length >=2){
        throw new Error('This game is at maximum capacity'); //TODO trad
    }
    game.players.push({
        uid:uid,
        name:user.displayName
    })
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
});

exports.quitGame = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);

    let game = await gameRef.once('value');
    
    game.players = game.players.filter(pl=>pl.uid !== uid);
    if(game.gameInfo.toPlay>=game.players.length){
        game.gameInfo.toPlay = 0;
    }
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
});

exports.launchGame = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);
    let cellsRef = admin.database().ref('cells/'+key);
    
    cellsRef.set(VrgHelper.newMap());

    let game = await gameRef.once('value');
    
    game.gameInfo = {
        turn: 1,
        toPlay:0,
        votes:0
    }

    game.ready = true;
    game.finished = false;
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
    
});