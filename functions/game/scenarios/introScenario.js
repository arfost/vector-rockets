const baseMap = require("./maps/baseMap.json");
const inflateMapElement = require("../elements/mapElements.js");
const { getPlayerColorList } = require("../tools.js");
const ShipClass = require("../elements/ship.js");
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

    playTurn(players){
        let actifs = new Map();
        for(let element of this._elements){
            if(element.actif){
                let instance = new ShipClass();
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
        for(let instance of actifs.values()){
            instance.calculateActions(this.positionedElement, this);
        }
        this._elements = this._elements.map(element=>{
            let inst = actifs.get(element.id);
            if(inst){
                return inst.jsonDesc;
            }else{
                return element;
            }
        })
        this.addMessage("Turn "+this._scenario.turn+" finished");
        this._scenario.turn++;
    }

    init(players){
        let elements = [];
        for(let base of baseMap.elements){
            elements = [...elements, ...inflateMapElement(base, elements.length)]
        }

        let shipList = [];

        for(let player of players){
            let role = this.getRole(player);
            for(let ship of role.shipList){
                let shipInstance = new ShipClass();
                shipInstance.init(ship.base, elements.length+shipList.length, ship.type, player);
                shipList.push(shipInstance)
            }

            player.objectives = role.objectives;
        }
        let positionedElement = [...elements, ...shipList].reduce((acc, el)=>{
            acc[el.x+':'+el.y] = acc[el.x+':'+el.y] ? [el, ...acc[el.x+':'+el.y]] : [el];
            return acc
        }, {});
        
        shipList = shipList.map(ship=>{
            ship.calculateActions(ship, positionedElement);
            return ship.jsonDesc;
        })

        this._elements = [...elements, ...shipList];
        this._scenario = {
            messages:["Starting"],
            name: "The solar race",
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
            }]
        }
    }

    get objectivesCheck(){
        return {
            _checkCloseBy(planet, traversedHex, positionedElements){
                let closeBy = false;
                for(let thex of traversedHex){
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
            bearth:function(ship, positionedElements){
                let onEarth = false;
                if (positionedElements[ship.x + ':' + ship.y]) {
                    for (let el of positionedElements[ship.x + ':' + ship.y]) {
                      if (el.name === 'earth') {
                        onEarth = true;
                      }   
                    }
                  }
                return Boolean(ship.landed && onEarth)
            }
        }
    }

    checkObjectives(player, ship, positionedElement){
        for(let obj of player.objectives){
            if(obj.durable && obj.done){
                continue;
            }
            let toto = this.objectivesCheck[obj.code](ship, positionedElement, player);
            console.log("toto : ", toto)
            obj.done = toto;
        }
    }

    checkVictory(players){
        //check all players objectives and return 
    }


}