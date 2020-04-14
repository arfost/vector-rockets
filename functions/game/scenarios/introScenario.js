const baseMap = require("./maps/baseMap.json");
const inflateMapElement = require("../elements/mapElements.js");
const { getPlayerColorList } = require("../tools.js");
const ShipClass = require("../elements/ship.js");
const BaseClass = require("../elements/base.js");
const Honeycomb = require("honeycomb-grid");
const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });


module.exports = class{

    addMessage(message){
        if(!this._scenario.messages){
            this._scenario.message = [];
        }
        this._scenario.messages.push(message);
    }

    load(elements, scenario){
        this._elements = elements;
        this._scenario = scenario;
        this.updatePositionedElement();
    }

    updatePositionedElement(){
        this.positionedElement = this._elements.reduce((acc, el)=>{
            acc[el.x+':'+el.y] = acc[el.x+':'+el.y] ? [el, ...acc[el.x+':'+el.y]] : [el];
            return acc
        }, {});
    }

    get elements(){
        return this._elements;
    }

    get scenario(){
        return this._scenario
    }

    get initBaseList(){
        return [{
            direction:{
                q:-1,
                r:0,
                s:1
            },
            name:"terra base 1",
            x: 17,
            y: 26
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"terra base 2",
            x: 17,
            y: 26
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"terra base 3",
            x: 17,
            y: 26
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"terra base 4",
            x: 17,
            y: 26
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            name:"terra base 5",
            x: 17,
            y: 26
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            name:"terra base 6",
            x: 17,
            y: 26
        },{
            direction:{
                q:-1,
                r:0,
                s:1
            },
            name:"luna base 1",
            x: 18,
            y: 29
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"luna base 2",
            x: 18,
            y: 29
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"luna base 3",
            x: 18,
            y: 29
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"luna base 4",
            x: 18,
            y: 29
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            name:"luna base 5",
            x: 18,
            y: 29
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            name:"luna base 6",
            x: 18,
            y: 29
        },{
            direction:{
                q:-1,
                r:0,
                s:1
            },
            name:"venus base 1",
            x: 10,
            y: 8
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"venus base 2",
            x: 10,
            y: 8
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"venus base 3",
            x: 10,
            y: 8
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"venus base 4",
            x: 10,
            y: 8
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            name:"venus base 5",
            x: 10,
            y: 8
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            name:"venus base 6",
            x: 10,
            y: 8
        },{
            direction:{
                q:-1,
                r:0,
                s:1
            },
            name:"mars base 1",
            x: 31,
            y: 5
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"mars base 2",
            x: 31,
            y: 5
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"mars base 3",
            x: 31,
            y: 5
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"mars base 4",
            x: 31,
            y: 5
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            name:"mars base 5",
            x: 31,
            y: 5
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            name:"mars base 6",
            x: 31,
            y: 5
        },{
            direction:{
                q:-1,
                r:0,
                s:1
            },
            name:"callisto base 1",
            x: 47,
            y: 13
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"callisto base 2",
            x: 47,
            y: 13
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"callisto base 3",
            x: 47,
            y: 13
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"callisto base 4",
            x: 47,
            y: 13
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            name:"callisto base 5",
            x: 47,
            y: 13
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            name:"callisto base 6",
            x: 47,
            y: 13
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"mercure base 1",
            x: 8,
            y: 17
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            name:"mercure base 2",
            x: 8,
            y: 17
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            name:"io base 1",
            x: 45,
            y: 18
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            name:"ganymede base 2",
            x: 49,
            y: 20
        }]
    }

    playTurn(players){
        let actifs = new Map();
        for(let element of this._elements){
            if(element.actif){
                let instance;
                if(element.type === "ship"){
                    instance = new ShipClass();
                }else{
                    instance = new BaseClass();
                }
                instance.load(element);
                instance.prepareActions(this.positionedElement, this);
                actifs.set(instance.id, instance);
            }
        }
        for(let instance of actifs.values()){
            if(instance.owner){
                let owner = players.find(player=>player.uid === instance.owner);
                this.checkObjectives(owner, instance, this.positionedElement);
            }
        }
        for(let instance of actifs.values()){
            instance.resolveTurn(this.positionedElement, this);
        }
        let activePlayer = {};
        for(let instance of actifs.values()){
            instance.calculateActions(this.positionedElement, this);
            if(!instance.destroyed && instance.owner){
                activePlayer[instance.owner] = true;
            }
        }
        for(let player of players){
            if(!activePlayer[player.uid]){
                player.eliminated = true;
            }
        }
        this._elements = this._elements.map(element=>{
            let inst = actifs.get(element.id);
            if(inst){
                return inst.jsonDesc;
            }else{
                return element;
            }
        })
        this._scenario.winner = this.checkVictory(players);
        this.addMessage("Turn "+this._scenario.turn+" finished");
        this._scenario.turn++;
    }

    init(players){
        let elements = [];
        for(let base of baseMap.elements){
            elements = [...elements, ...inflateMapElement(base, elements.length)]
        }

        let shipList = [];
        let baseList = [];

        for(let player of players){
            let role = this.getRole(player);
            for(let ship of role.shipList){
                let shipInstance = new ShipClass();
                shipInstance.init(ship.base, "shi"+shipList.length, ship.type, player);
                shipList.push(shipInstance);
            }

            for(let base of role.baseList){
                let baseInstance = new BaseClass();
                baseInstance.init(base.base, "bas"+baseList.length, base.type, player);
                baseList.push(baseInstance);
            }

            player.objectives = role.objectives;
        }

        for(let initBase of this.initBaseList){
            let baseInstance = new BaseClass();
            baseInstance.init(initBase, "bas"+baseList.length);
            baseList.push(baseInstance);
        }

        let positionedElement = [...elements, ...shipList, ...baseList].reduce((acc, el)=>{
            acc[el.x+':'+el.y] = acc[el.x+':'+el.y] ? [el, ...acc[el.x+':'+el.y]] : [el];
            return acc
        }, {});
        
        shipList = shipList.map(ship=>{
            ship.calculateActions(positionedElement, this);
            return ship.jsonDesc;
        })

        baseList = baseList.map(base=>{
            base.calculateActions(positionedElement, this);
            return base.jsonDesc;
        })

        this._elements = [...elements, ...shipList, ...baseList];
        this._scenario = {
            messages:["Starting"],
            name: "The solar race",
            desc: "A fast race in the solar system",
            mapInfos:baseMap.infos,
            turn: 1
        }
    }

    getRole(player){
        return {
            shipList:[{
                base: {x:17,y:26, landed:true},
                type:"corvette"
            }],
            baseList:[],
            objectives:[{
                name:"back to earth",
                code:"bearth",
                desc:"return to earth after passing near all important bodies of the map",
                done: true
            },{
                name:"close by venus",
                code:"cbvenus",
                desc:"fly in a least one gravity hex of venus",
                durable:true,
                done: false
            },{
                name:"close by mars",
                code:"cbmars",
                desc:"fly in a least one gravity hex of mars",
                durable:true,
                done: false
            },{
                name:"close by callisto",
                code:"cbcallisto",
                desc:"fly in a least one gravity hex of callisto",
                durable:true,
                done: false
            },{
                name:"close by ganymede",
                code:"cbganymede",
                desc:"fly in a least one gravity hex of ganymede",
                durable:true,
                done: false
            },{
                name:"close by mercury",
                code:"cbmercury",
                desc:"fly in a least one gravity hex of mercury",
                durable:true,
                done: false
            },{
                name:"close by sun",
                code:"cbsun",
                desc:"fly in a least one gravity hex of the sun",
                durable:true,
                done: false
            },{
                name:"close by jupiter",
                code:"cbjupiter",
                desc:"fly in a least one gravity hex of jupiter",
                durable:true,
                done: false
            }]
        }
    }

    get objectivesCheck(){
        return {
            _checkCloseBy(planet, traversedHex, positionedElements){
                let closeBy = false;
                for(let thex of traversedHex){
                    if(!thex){
                        continue;
                    }
                    for (let hex of grid.neighborsOf(Hex(thex.x, thex.y))) {
                        if (!hex) {
                          continue;
                        }
                        if (positionedElements[hex.x + ':' + hex.y]) {
                          for (let el of positionedElements[hex.x + ':' + hex.y]) {
                            if (el.name === planet) {
                            closeBy = true;
                            }   
                          }
                        }
                      }
                }
                return closeBy
            },
            cbvenus:function(ship, positionedElements){
                return this._checkCloseBy('venus', ship.traversedHex, positionedElements)
            },
            cbmars:function(ship, positionedElements){
                return this._checkCloseBy('mars', ship.traversedHex, positionedElements)
            },
            cbmercury:function(ship, positionedElements){
                return this._checkCloseBy('mercury', ship.traversedHex, positionedElements)
            },
            cbganymede:function(ship, positionedElements){
                return this._checkCloseBy('ganymede', ship.traversedHex, positionedElements)
            },
            cbcallisto:function(ship, positionedElements){
                return this._checkCloseBy('callisto', ship.traversedHex, positionedElements)
            },
            cbjupiter:function(ship, positionedElements){
                return this._checkCloseBy('jupiter', ship.traversedHex, positionedElements)
            },
            cbsun:function(ship, positionedElements){
                return this._checkCloseBy('sol', ship.traversedHex, positionedElements)
            },
            bearth:function(ship, positionedElements){
                let onEarth = false;
                if (positionedElements[ship.x + ':' + ship.y]) {
                    for (let el of positionedElements[ship.x + ':' + ship.y]) {
                      if (el.name === 'terra') {
                        onEarth = true;
                      }   
                    }
                  }
                return Boolean(ship.jsonDesc.landed && onEarth)
            }
        }
    }

    checkObjectives(player, ship, positionedElement){
        if(!player){
            return
        }
        for(let obj of player.objectives){
            if(obj.durable && obj.done){
                continue;
            }
            let toto = this.objectivesCheck[obj.code](ship, positionedElement, player);
            obj.done = toto;
        }
    }

    checkVictory(players){

        for(let player of players){
            let temoin = true;
            for(let obj of player.objectives){
                temoin = temoin && obj.done
            }
            if(temoin){
                return {
                    name:player.name,
                    nbTurn: this._scenario.turn
                }
            }
        }
        return false;
    }


}