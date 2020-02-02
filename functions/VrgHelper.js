const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });
/* eslint-disable no-loop-func */

module.exports.newScenario = function () {
    return {
        elements: [],
        mapInfos: {
            width: 55,
            height: 35,
            navigable: true
        },
        baseElements: [
            {
                apparence: {
                    color: "0066ff",
                    radius: 6
                },
                name: "terra",
                desc:"the cradle of humanity, still heavily populated and powerful, but years of ressources exploitation have leave it polluted and tired, and humanity is searching new frontiers.",
                type: "planet",
                x: 17,
                y: 26
            },
            {
                apparence: {
                    color: "aaaaaa",
                    radius: 2
                },
                name: "luna",
                desc:"the natural satelite of the earth, first to see a permanent human occupation after earth, and now first h3 exploitation for earth energy",
                type: "planet",
                x: 18,
                y: 29
            },
            {
                apparence: {
                    color: "88ee00",
                    radius: 2
                },
                name: "callisto",
                desc:"second largest moon of jupiter, tidally locked to jupiter, outside her radiation zone and containing water ice and organic compounds, it naturally became the greenhouse of jupiters activities.",
                type: "planet",
                x: 47,
                y: 13
            },
            {
                apparence: {
                    color: "c88409",
                    radius: 8
                },
                name: "jupiter",
                desc:"the biggest planet of the solar system, the closest of the gaz giants, with almost 80 notables satelites and still more ressources in his rings, it was bound to attract human activities.",
                type: "planet",
                x: 47,
                y: 17
            },
            {
                apparence: {
                    color: "cccccc",
                    radius: 2
                },
                name: "Io",
                desc:"the innermost moon of jupiter, and third biggest. The radiation and heavy gravitic influence and the giant make it both a living hell of sulfur volcanoes and scorching tidal heating and a paradise for mining rare element and studying extreme physics events.",
                type: "planet",
                x: 45,
                y: 18
            },
            {
                apparence: {
                    color: "bbbbbb",
                    radius: 3
                },
                name: "ganymede",
                desc:"the biggest satelite of the solar system, bigger than mercury.",
                type: "planet",
                x: 49,
                y: 20
            },
            {
                apparence: {
                    color: "a30808",
                    radius: 4
                },
                name: "mars",
                desc:"to small to retain an atmosphere and her water, it is now a desert but underground, protected from suns rays and using deep ice cities are growing on it.",
                type: "planet",
                x: 31,
                y: 6
            },
            {
                apparence: {
                    color: "34bdeb",
                    radius: 6
                },
                name: "venus",
                desc:"the twins of the earth, if this one had a runaway global warming. Living in the 400° acide cloud of the surface is not yet possible, but some floatting cities exist in her sky.",
                type: "planet",
                x: 10,
                y: 8
            },
            {
                apparence: {
                    color: "ebb734",
                    radius: 3
                },
                name: "mercury",
                desc:"desolate, scorching hot and metal rich, living here is hard, but it as is rewards.",
                type: "planet",
                x: 8,
                y: 17
            },
            {
                apparence: {
                    color: "f6ff00",
                    radius: 10
                },
                name: "sol",
                desc:"The star of the solar system",
                type: "star",
                x: 11,
                y: 14
            }
        ],
        init: function (players) {
            for(let belement of this.baseElements){
                let elements = actionLib[belement.type].init(belement, this.elements.length);
                this.elements = [...this.elements, ...elements]
            }

            for (let player of players) {
                let ship = actionLib.ship.init(player, this.elements);
                let positionedElement = this.elements.reduce((acc, el)=>{
                    acc[el.x+':'+el.y] = acc[el.x+':'+el.y] ? [el, ...acc[el.x+':'+el.y]] : [el];
                    return acc
                }, {})
                ship.actions = actionLib["ship"].getBaseAction(ship, positionedElement);
                this.elements.push(ship);
            }
        }
    };
};

module.exports.playElement = function (element, positionedElement, game) {
    if (element.plannedActions) {
        for (let pa of element.plannedActions) {
            element = actionLib[element.type][pa.type](
                element,
                pa.result,
                positionedElement,
                game
            );
        }
    }
    element = actionLib[element.type].base(element, positionedElement, game);
    element.actions = actionLib[element.type].getBaseAction(
        element,
        positionedElement,
        game
    );
    element.plannedActions = [];
};

const getDice = function (min, max) {
    if (typeof max === "undefined") {
        max = min;
        min = 1;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

module.exports.getDice = getDice;

module.exports.shuffleArray = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const actionLib = {
    ship: {
        land(ship, result){
            ship.landed = true;
            ship.x = result.x;
            ship.y = result.y;

            ship.inertia.q = 0;
            ship.inertia.r = 0;
            ship.inertia.s = 0;

            ship.displacement = [];

            ship.fuel = ship.fuelMax;
            
            
            return ship;
        },
        takeoff(ship, result){
            delete ship.landed;
            
            ship.inertia = result;
            ship.takeoff = true;

            return ship;
        },
        burn(ship, result) {
            ship.fuel--;

            ship.inertia = {
                q: ship.inertia.q - result.q,
                r: ship.inertia.r - result.r,
                s: ship.inertia.s - result.s
            };

            return ship;
        },
        base(ship, positionedElement, game) {
            let trail = {
                x: ship.x,
                y: ship.y,
                inertia: ship.inertia
            };
            if (
                ship.plannedActions &&
                ship.plannedActions.find(pa => pa.type === "burn")
            ) {
                trail.burnType = "burn";
            }
            if (ship.trails) {
                ship.trails.push(trail);
            } else {
                ship.trails = [trail];
            }
            if(!ship.landed){
                for (let displacement of ship.displacement || []) {
                    ship.inertia.q = ship.inertia.q + displacement.q;
                    ship.inertia.r = ship.inertia.r + displacement.r;
                    ship.inertia.s = ship.inertia.s + displacement.s;
                }
    
                ship.displacement = [];
    
                let futurHex = inertiaToHex(ship.inertia, Hex(ship.x, ship.y), Hex);
    
                let traversedHexs = grid.hexesBetween(Hex(ship.x, ship.y), futurHex);
                console.log("traversed hex = ", traversedHexs)
                traversedHexs.shift();
    
                for (let traversedHex of traversedHexs) {
                    if(!traversedHex){
                        continue;
                    }
                    if (positionedElement[traversedHex.x + ":" + traversedHex.y]) {
                        for (let el of positionedElement[
                            traversedHex.x + ":" + traversedHex.y
                        ]) {
                            if (el.type === "gravArrow") {
                                ship.displacement.push(el.direction);
                            }
                        }
                    }
                }
                console.log(futurHex)
                if(futurHex.x<0 || futurHex.x > game.mapInfos.width || futurHex.y < 0 || futurHex.y > game.mapInfos.height){
                    ship.destroyed = true;
                    ship.destroyedReason = 'outbound';
                    if(game.messages){
                        game.messages.push()
                    }else{
                        game.messages = [ship.name+' was lost in space']
                    }
                }
    
                ship.x = futurHex.x;
                ship.y = futurHex.y;

                if(ship.takeoff){
                    ship.inertia.q = 0;
                    ship.inertia.r = 0;
                    ship.inertia.s = 0;

                    ship.takeoff = false;
                }
            }
            
            return ship;
        },
        getBaseAction(ship, positionedElement) {
            let actions = [];
            if(ship.destroyed){
                return actions;
            }
            if (ship.fuel > 0 && !ship.landed) {
                actions.push({
                    type: "burn",
                    name: "burn"
                });
            }
            if (ship.landed) {
                actions.push({
                    type: "takeoff",
                    name: "take off"
                });
            }

            //TODO add speed test
            if(Math.abs(ship.inertia.q) <= 1 && Math.abs(ship.inertia.r) <= 1 && Math.abs(ship.inertia.s) <= 1){
                for(let hex of grid.neighborsOf(Hex(ship.x, ship.y))){
                    if(!hex){
                        continue;
                    }
                    if(positionedElement[hex.x+':'+hex.y]){
                        for(let el of positionedElement[hex.x+':'+hex.y]){
                            if(el.type === 'planet'){
                                actions.push({
                                    type: 'land',
                                    name: 'land ('+el.name+')',
                                    target:{
                                        x:hex.x,
                                        y:hex.y
                                    }
                                })
                            }
                        }
                    }
                }
            }

            let id = 0;
            actions = actions.map(action => {
                action.elementId = ship.id;
                action.id = id++;
                return action;
            });
            return actions;
        },
        init(player, elements) {
            return {
                actif: true,
                apparence: {
                    path: [
                        {
                            x: 0,
                            y: -8
                        },
                        {
                            x: 5,
                            y: 8
                        },
                        {
                            x: 0,
                            y: 0
                        },
                        {
                            x: -5,
                            y: 8
                        }
                    ]
                },
                id: elements.length,
                owner: player.uid,
                fuel: 20,
                fuelMax: 20,
                desc:"a small uniplace ship build for long fast race.",
                inertia: {
                    q: 0,
                    r: 0,
                    s: 0
                },
                name: player.name + " - 1",
                type: "ship",
                x: getDice(20) + 10,
                y: getDice(20) + 10
            };
        }
    },
    planet:{
        init(planet, baseId){
            planet.actif = false;
            planet.id = baseId;
            let elements = [planet];
            
            let arrows = [
                {
                    direction:{
                        q:-1,
                        r:0,
                        s:1
                    },
                    x:1,
                    y:planet.x % 2 ? 1 : 0
                },{
                    direction:{
                        q:0,
                        r:-1,
                        s:1
                    },
                    x:0,
                    y:1
                },{
                    direction:{
                        q:1,
                        r:-1,
                        s:0
                    },
                    x:-1,
                    y:planet.x % 2 ? 1 : 0
                },{
                    direction:{
                        q:-1,
                        r:1,
                        s:0
                    },
                    x:1,
                    y:planet.x % 2 ? 0 : -1
                },{
                    direction:{
                        q:1,
                        r:0,
                        s:-1
                    },
                    x:-1,
                    y:planet.x % 2 ? 0 : -1
                },{
                    direction:{
                        q:0,
                        r:1,
                        s:-1
                    },
                    x:0,
                    y:-1
                },
            ]

            for(let arrowDesc of arrows){
                elements.push({
                    id:++baseId,
                    actif:false,
                    type:"gravArrow",
                    direction:arrowDesc.direction,
                    x:planet.x+arrowDesc.x,
                    y:planet.y+arrowDesc.y,
                    name:"gravity arrow",
                    desc:"gravity arrow are here to represent the pull of gravity when near a planet",
                })
            }
            return elements;
        }
    },
    star:{
        init(planet, baseId){
            planet.actif = false;
            planet.id = baseId;
            let elements = [planet];
            
            let arrows = [
                {
                    direction:{
                        q:-1,
                        r:0,
                        s:1
                    },
                    x:1,
                    y:planet.x % 2 ? 1 : 0
                },{
                    direction:{
                        q:0,
                        r:-1,
                        s:1
                    },
                    x:0,
                    y:1
                },{
                    direction:{
                        q:1,
                        r:-1,
                        s:0
                    },
                    x:-1,
                    y:planet.x % 2 ? 1 : 0
                },{
                    direction:{
                        q:-1,
                        r:1,
                        s:0
                    },
                    x:1,
                    y:planet.x % 2 ? 0 : -1
                },{
                    direction:{
                        q:1,
                        r:0,
                        s:-1
                    },
                    x:-1,
                    y:planet.x % 2 ? 0 : -1
                },{
                    direction:{
                        q:0,
                        r:1,
                        s:-1
                    },
                    x:0,
                    y:-1
                },
            ]

            for(let arrowDesc of arrows){
                elements.push({
                    id:++baseId,
                    actif:false,
                    type:"gravArrow",
                    direction:arrowDesc.direction,
                    x:planet.x+arrowDesc.x,
                    y:planet.y+arrowDesc.y,
                    name:"gravity arrow",
                    desc:"gravity arrow are here to represent the pull of gravity when near a star",
                })
            }
            return elements;
        }
    }
};

const inertiaToHex = function (inertia, oldHex, Hex) {
    return Hex({
        q: oldHex.q + inertia.q,
        r: oldHex.r + inertia.r,
        s: oldHex.s + inertia.s
    });
};
const hexToInertia = function (oldHex, newHex, Hex) {
    let hex = Hex(oldHex);
    let fhex = Hex(newHex);
    return {
        q:fhex.q-hex.q,
        r:fhex.r-hex.r,
        s:fhex.s-hex.s
    };
};
