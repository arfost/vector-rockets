const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });
/* eslint-disable no-loop-func */
const NS = "NS";
const EO = "EO";

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
                type: "planet",
                x: 18,
                y: 29
            },
            {
                apparence: {
                    color: "a30808",
                    radius: 4
                },
                name: "mars",
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
                type: "planet",
                x: 10,
                y: 8
            },
            {
                apparence: {
                    color: "ebb734",
                    radius: 2
                },
                name: "mercury",
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
                type: "planet",
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
                ship.actions = actionLib["ship"].getBaseAction(ship);
                this.elements.push(ship);
            }
        }
    };
};

module.exports.playElement = function (element, positionedElement) {
    console.log(element);
    if (element.plannedActions) {
        for (let pa of element.plannedActions) {
            element = actionLib[element.type][pa.type](
                element,
                pa.result,
                positionedElement
            );
        }
    }
    element = actionLib[element.type].base(element, positionedElement);
    element.actions = actionLib[element.type].getBaseAction(
        element,
        positionedElement
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
        burn(ship, result) {
            ship.fuel--;

            ship.inertia = {
                q: ship.inertia.q - result.q,
                r: ship.inertia.r - result.r,
                s: ship.inertia.s - result.s
            };

            return ship;
        },
        base(ship, positionedElement) {
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

            for (let displacement of ship.displacement || []) {
                ship.inertia.q = ship.inertia.q + displacement.q;
                ship.inertia.r = ship.inertia.r + displacement.r;
                ship.inertia.s = ship.inertia.s + displacement.s;
            }

            ship.displacement = [];

            let futurHex = inertiaToHex(ship.inertia, Hex(ship.x, ship.y), Hex);

            let traversedHexs = grid.hexesBetween(Hex(ship.x, ship.y), futurHex);

            traversedHexs.shift();

            for (let traversedHex of traversedHexs) {
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

            ship.x = futurHex.x;
            ship.y = futurHex.y;

            return ship;
        },
        getBaseAction(ship) {
            let actions = [];
            if (ship.fuel > 0) {
                actions.push({
                    type: "burn",
                    name: "burn"
                });
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
                    y:planet.y+arrowDesc.y
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
