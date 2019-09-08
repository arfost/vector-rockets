/* eslint-disable promise/no-nesting */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const VrgHelper = require('./VrgHelper.js');

admin.initializeApp({
    credential: admin.credential.cert(require('../config/gameengineconfigurator-0a66938107ae.json')),
    databaseURL: "https://gameengineconfigurator.firebaseio.com"
  });

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

    let user = (await admin.database().ref('users/'+uid).once('value')).val();
    console.log(user)

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
    let user = await admin.database().ref('users/'+uid).once('value').val();
    
    let game = await gameRef.once('value').val();

    if(game.players.length >=4){
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

    let game = await gameRef.once('value').val();
    
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

    let scenario = VrgHelper.newScenario();
    
    cellsRef.set(scenario.cells);

    let game = (await gameRef.once('value')).val();
    
    game.gameInfo = {
        turn: 1,
        toPlay:game.players.length,
        votes:0
    }
    game.mapInfos = scenario.mapInfos;

    game.ready = true;
    game.finished = false;
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
    
});