const Honeycomb = require('honeycomb-grid');

const Hex = Honeycomb.extendHex({ size: 14, orientation: 'flat' });

/* eslint-disable no-loop-func */
const NS = 'NS';
const EO = 'EO';

module.exports.newScenario = function () {
    return {
        elements:[ {
            "actif" : false,
            "apparence" : {
              "color" : "0066ff",
              "radius" : 7
            },
            "name" : "earth",
            "type" : "planet",
            "x" : 10,
            "y" : 10
          }, {
            "actif" : false,
            "apparence" : {
              "color" : "ff6600",
              "radius" : 6
            },
            "name" : "mars",
            "type" : "planet",
            "x" : 15,
            "y" : 19
          }, {
              "fuel":20,
            "actif" : true,
            "actions" : [ {
              "elementId" : 1,
              "id" : 12,
              "name" : "burn",
              "type" : "burn"
            } ],
            "apparence" : {
              "path" : [ {
                "x" : 0,
                "y" : -8
              }, {
                "x" : 5,
                "y" : 8
              }, {
                "x" : 0,
                "y" : 0
              }, {
                "x" : -5,
                "y" : 8
              } ]
            },
            "id" : 1,
            "inertia" : {
              "x" : 0,
              "y" : 0
            },
            "name" : "clement - 1",
            "trails" : [],
            "type" : "ship",
            "x" : 25,
            "y" : 15
          } ],
        mapInfos:{
            width:51,
            height:35,
            navigable:true
        },
    }
}

module.exports.playElement = function(element){
    console.log(element);
    if(element.plannedActions){
        for(let pa of element.plannedActions){
            element = actionLib[element.type][pa.type](element, pa.result)
        }
    }
    element = actionLib[element.type].base(element);
    element.actions = actionLib[element.type].getBaseAction(element);
    element.plannedActions = [];
}

const getDice = function (min, max) {
    if (typeof max === 'undefined') {
        max = min;
        min = 1;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

module.exports.getDice = getDice;

module.exports.shuffleArray = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const actionLib = {
    ship:{
        burn(ship, result){
            ship.fuel--;
            
            ship.inertia = Hex(ship.inertia).subtract(Hex(result)).cube();

            return ship;
        },
        base(ship){
            let trail = {
                x:ship.x,
                y:ship.y,
                inertia:ship.inertia
            }
            if(ship.plannedActions && ship.plannedActions.find(pa=>pa.type === 'burn')){
                trail.burnType = 'burn'
            }
            if(ship.trails){
                ship.trails.push(trail);
            }else{
                ship.trails = [trail]
            }

            let hex = Hex(ship.x, ship.y).add(Hex(ship.inertia))

            ship.x = hex.x;
            ship.y = hex.y;
            
            return ship
        },
        getBaseAction(ship){
            let actions = [];
            if(ship.fuel > 0){
                actions.push({
                    type:'burn',
                    name:'burn'
                })
            }
            let id = 0;
            actions = actions.map(action=>{
                action.elementId = ship.id;
                action.id = id++;
                return action;
            })
            return actions;
        }
    }
}