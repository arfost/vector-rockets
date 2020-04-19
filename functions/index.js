/* eslint-disable promise/no-nesting */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const scenarioGetter = require("./game/scenarios");
const { getPlayerColorList } = require("./game/tools.js");

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

    let user = (await admin.database().ref('users/'+uid).once('value')).val();
    let colorList = getPlayerColorList();
    let game = {
        players : [{
            uid:uid,
            name:user.customName ? user.customName : user.displayName,
            color:colorList.pop()
        }],
        colorList:colorList,
    }

    gameRef.set(game);
    admin.database().ref(`status/${gameRef.key}`).set('waitingplayers')

    return gameRef.key;
    
});

exports.joinGame = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);
    let user = (await admin.database().ref('users/'+uid).once('value')).val();
    
    let game = (await gameRef.once('value')).val();

    if(game.players.length >=4){
        throw new Error('This game is at maximum capacity'); //TODO trad
    }
    game.players.push({
        uid:uid,
        name:user.customName ? user.customName : user.displayName,
        color:game.colorList.pop(),
    })
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
});

exports.quitGame = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);

    let game = (await gameRef.once('value')).val();
    
    game.players = game.players.filter(pl=>pl.uid !== uid);
    if(game.gameInfo.toPlay>=game.players.length){
        game.gameInfo.toPlay = 0;
    }


    if(game.players.length<=0){
        game = {};
        let elementsRef = admin.database().ref('elements/'+key);
        elementsRef.set([]);

        return admin.database().ref('games/'+key).set(game).then(res=>{
            return key;
        });
    }

    let validatedPlayer = 0;
    for(let player of game.players){
        if(player.validated || player.eliminated){
            validatedPlayer++;
        }
    }

    if(validatedPlayer === game.players.length){
        admin.database().ref('status/'+key).set('inturn');

        let elementsRef = admin.database().ref('elements/'+key);
        let elements = (await elementsRef.once('value')).val();

        let scenarioInstance = scenarioGetter(game.type);

        scenarioInstance.load(elements, game.scenario);

        scenarioInstance.playTurn()

        elementsRef.set(scenarioInstance.elements);
        game.scenario = scenarioInstance.scenario;

        game.players.map(player=>{
            player.validated = false;
            return player;
        })
        
        game.gameInfo.turn ++;
    }else{
        game.gameInfo.toPlay = game.players.length - validatedPlayer;
    }
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
        return key;
    });
});

exports.launchGame = functions.https.onCall(async({key, scenario}, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);
    let elementsRef = admin.database().ref('elements/'+key);

    let scenarioInstance = scenarioGetter(scenario.id);
    
    let game = (await gameRef.once('value')).val();

    game.type = scenario.id;

    scenarioInstance.init(game.players, scenario);
    
    elementsRef.set(scenarioInstance.elements);
    
    game.gameInfo = {
        turn: 1,
        toPlay:game.players.length
    }
    game.scenario = scenarioInstance.scenario;
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
      return admin.database().ref('status/'+key).set('ready')
    }).then(res=>{
      return key;
    });
    
});

exports.validateTurn = functions.https.onCall(async(key, context)=>{
    // Grab the current value of what was written to the Realtime Database.
    const uid = context.auth.uid;
    let gameRef = admin.database().ref('games/'+key);

    let game = (await gameRef.once('value')).val();

    let gameStatus = 'ready'
    
    let validatedPlayer = 0;
    for(let player of game.players){
        if(player.uid === uid){
            if(player.eliminated){
                throw new Error("You shouldn't have to validate")
            }
            player.validated = true;
        }
        if(player.validated || player.eliminated){
            validatedPlayer++;
        }
    }

    if(validatedPlayer === game.players.length){
        admin.database().ref('status/'+key).set('inturn');
        try{
            let elementsRef = admin.database().ref('elements/'+key);
            let elements = (await elementsRef.once('value')).val();
    
            let scenarioInstance = scenarioGetter(game.type);
    
            scenarioInstance.load(elements, game.scenario);
    
            scenarioInstance.playTurn(game.players)
    
            elementsRef.set(scenarioInstance.elements);
            game.scenario = scenarioInstance.scenario;
    
            if(game.scenario.winner){
                gameStatus = 'finished';
            }
    
            game.players.map(player=>{
                player.validated = false;
                return player;
            })
            game.gameInfo.toPlay = game.players.length;
        }catch(e){
            admin.database().ref('status/'+key).set('ready');
            throw e
        }
        
    }else{
        game.gameInfo.toPlay = game.players.length - validatedPlayer;
    }
    
    return admin.database().ref('games/'+key).set(game).then(res=>{
      return admin.database().ref('status/'+key).set(gameStatus)
    }).then(res=>{
        return key;
    });
    
});