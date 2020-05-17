const shipReference = require('./shipReference.json');
const { inertiaToHex, hexToInertia, getDice, reduce, getFromPositionedElements } = require('../tools.js');
const { getDamage } = require('../tables.js');
const Honeycomb = require("honeycomb-grid");
var collide = require('line-circle-collision');

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid(Hex).rectangle({ width: 200, height: 200 });

module.exports = class {

    init(base, baseId, type, player) {

        this._ship = JSON.parse(JSON.stringify({
            ...base,
            ...shipReference[type],
            actif: true,
            id: baseId,
            inertia: {
                q: 0,
                r: 0,
                s: 0
            },
            type: "ship",
            name: player.name + " - 1",
            owner: player.uid,
            logs:[]
        }))
        this._ship.apparence.color = player.color;
    }

    get id() {
        return this._ship.id;
    }

    get type() {
        return this._ship.type;
        
    }

    finishInit(positionedElements, scenario){
        
    }

    load(ship) {
        if(!ship.logs){
            ship.logs = [];
        }
        this._ship = ship;
    }

    get jsonDesc() {
        return this._ship
    }

    set futurHex(futurHex){
        this._ship.futurHex = futurHex;
    }

    get futurHex() {
        if (this._ship.futurHex) {
            return this._ship.futurHex;
        }
        throw new Error('futurHex no value for this time')
    }

    get traversedHexs() {
        if (this._ship.traversedHexs) {
            return this._ship.traversedHexs;
        }
        throw new Error('traversed hex no value for this time')
    }

    set traversedHexs(traversedHexs) {
        this._ship.traversedHexs = traversedHexs;
    }

    prepareActions(positionedElement, scenario) {
        if (this._ship.plannedActions) {
            for (let pa of this._ship.plannedActions) {
                this._ship = this.actions[pa.type].execute(
                    this._ship,
                    pa.result,
                    positionedElement,
                    scenario
                );
            }
            this._ship.doneAction = true;
        } else {
            this._ship.doneAction = false;
        }

        if (!this._ship.landed) {
            for (let displacement of this._ship.displacement || []) {
                this._ship.inertia.q = this._ship.inertia.q + displacement.q;
                this._ship.inertia.r = this._ship.inertia.r + displacement.r;
                this._ship.inertia.s = this._ship.inertia.s + displacement.s;
            }

            this._ship.displacement = [];
        }
        this._actualHex = Hex(this._ship.x, this._ship.y);
        this.futurHex = inertiaToHex(this._ship.inertia, this.actualHex, Hex);

        this.traversedHexs = grid.hexesBetween(this.actualHex, this.futurHex);
        this.traversedHexs.shift();

        this._ship.plannedActions = [];
        this._ship.damageTaken = 0;
    }

    resolveTurn(positionedElements, scenario) {

        if (!this._ship.landed) {
            
            let destPoint = this.futurHex.toPoint()
            .add(this.futurHex.center());
            
            let startPoint = this.actualHex.toPoint()
            .add(this.actualHex.center());

            let trajectoryLine = {
                start:[startPoint.x, startPoint.y],
                end:[destPoint.x, destPoint.y]
            } 
            for (let traversedHex of this.traversedHexs) {
                if (!traversedHex) {
                    continue;
                }
                for (let el of getFromPositionedElements(positionedElements, traversedHex.x + ":" + traversedHex.y, ["gravArrow", "dirtySpace", "planet", "star"])) {
                    if (el.type === "gravArrow") {
                        this._ship.displacement.push(el.direction);
                    }
                    if (el.type === "dirtySpace") {
                        if (!(Math.abs(this._ship.inertia.q) <= 1 && Math.abs(this._ship.inertia.r) <= 1 && Math.abs(this._ship.inertia.s) <= 1)) {
                            let result = getDice(1, 6) - 4;
                            if (result > 0) {
                                this._ship.damage = result;
                                this._ship.damageTaken = true;
                            }
                        }
                    }
                    if(el.type === "planet" || el.type === "star"){
                        let planetCenter = traversedHex.toPoint().add(traversedHex.center());
                        let colision = collide(trajectoryLine.start, trajectoryLine.end, [planetCenter.x, planetCenter.y], el.apparence.radius)
                        if(colision){
                            this._ship.destroyed = true;
                            this._ship.destroyedReason = 'damage';
                            scenario.addMessage(this._ship.name + ' was destroyed in a violent lithobraking');
                        }
                    }
                }
                
            }
            if ((this.futurHex.x < 0 || this.futurHex.x > scenario.scenario.mapInfos.width || this.futurHex.y < 0 || this.futurHex.y > scenario.scenario.mapInfos.height) && !this._ship.destroyed) {
                this._ship.destroyed = true;
                this._ship.destroyedReason = 'outbound';
                scenario.addMessage(this._ship.name + ' was lost in space')
            }
        }

        if(this._ship.fireAt){
            let attackResult = this.calcFireAt(this._ship.fireAt);
            scenario.addMessage(` - Attack of ${this._ship.name} on ${this._ship.fireAt.name}, range : ${attackResult.range}, relative speed : ${attackResult.relativeSpeedMalus}, combat strenght : ${attackResult.combatStrenght}, dice : ${attackResult.dice}, final result : ${attackResult.dice - (attackResult.range + attackResult.relativeSpeedMalus)} for ${attackResult.damage} damage(s)`)
            this._ship.fireAt.damageTaken = this._ship.fireAt.damageTaken + attackResult.damage;
            this._ship.logs.push({
                type:"attack",
                turn: scenario.scenario.turn,
                target:{
                    id: this._ship.fireAt.id,
                    owner: this._ship.owner,
                    name: this._ship.fireAt.name
                },
                initiator:{
                    id: this._ship.id,
                    owner: this._ship.owner,
                    name: this._ship.name
                },
                result:{
                    damage: attackResult.damage
                }
            })
            this._ship.fireAt.logs.push({
                type:"attack",
                target:{
                    id: this._ship.fireAt.id,
                    owner: this._ship.owner,
                    name: this._ship.fireAt.name
                },
                initiator:{
                    id: this._ship.id,
                    owner: this._ship.owner,
                    name: this._ship.name
                },
                result:{
                    damage: attackResult.damage
                }
            });
        }
    }
    
    finishTurn(scenario) {

        let trail = {
            x: this._ship.x,
            y: this._ship.y,
            inertia: this._ship.inertia
        };

        if (this._ship.hasBurn) {
            trail.burnType = "burn";
        }
        if (this._ship.trails) {
            this._ship.trails.push(trail);
        } else {
            this._ship.trails = [trail];
        }

        this._ship.x = this.futurHex.x;
        this._ship.y = this.futurHex.y;

        if (this._ship.takeoff) {
            this._ship.inertia.q = 0;
            this._ship.inertia.r = 0;
            this._ship.inertia.s = 0;

            this._ship.takeoff = false;
        }

        if (this._ship.damageTaken > 0) {
            this._ship.damage = this._ship.damage + this._ship.damageTaken;
            if (this._ship.damage > 6 && !this._ship.destroyed) {
                this._ship.destroyed = true;
                this._ship.destroyedReason = 'damage';
                scenario.addMessage(this._ship.name + ' was destroyed in a;')
            }
            this._ship.damageTaken = false;
        } else {
            if (this._ship.damage > 0) this._ship.damage--;
        }

        this._ship.hasBurn = false;
        delete this._ship.futurHex;
        delete this._ship.traversedHexs;
        delete this._ship.fireAt;
    }

    calcFireAt(attackedShip){
        //range calc
        let range = 10;
        let hexCible = Hex(attackedShip.futurHex.x, attackedShip.futurHex.y);
        for(let hex of [...this.traversedHexs, Hex(this.x, this.y)]){
            let dist = grid.hexesBetween(hex, hexCible).length - 1;
            if(range>dist){
                range = dist;
            }
        }
        //relative speed calc
        let arriveTarget = inertiaToHex(attackedShip.inertia, hexCible, Hex);
        let arriveAttacker = inertiaToHex(this._ship.inertia, hexCible, Hex);
        let relativeSpeed = grid.hexesBetween(arriveAttacker, arriveTarget).length - 1;
        let relativeSpeedMalus = 0;
        if(relativeSpeed>2){
            relativeSpeedMalus = relativeSpeed -2;
        }
        //combat strength relative
        let combatStrenght = reduce([this._ship.combatStrenght, attackedShip.combatStrenght]);
        
        let dice = getDice(6);
        
        let finalResult = dice - (range + relativeSpeedMalus);
        let damage = getDamage(combatStrenght.join("/"), finalResult);
        return {
            range,
            relativeSpeedMalus,
            combatStrenght: combatStrenght.join("/"),
            finalResult,
            dice,
            damage
        };
    }

    

    get actualHex(){
        return this._actualHex;
    }

    get inertia(){
        return this._ship.inertia;
    }

    set inertia(inertia){
        this._ship.inertia = inertia;
    }

    get actions() {
        return {
            land: {
                execute(ship, result) {
                    ship.landed = true;
                    ship.x = result.position.x;
                    ship.y = result.position.y;

                    ship.inertia = hexToInertia(
                        Hex(ship.x, ship.y),
                        Hex(result.position.x, result.position.y),
                        Hex
                    );
                    ship.landedDirection = result.direction;
                    ship.displacement = [];

                    return ship;
                },
                canDo(positionedElements, ship) {
                    if (ship._ship.fuel === 0 || ship._ship.damage !== 0) {
                        return []
                    }
                    let actions = [];
                    let inertia = {
                        q: ship.inertia.q,
                        r: ship.inertia.r,
                        s: ship.inertia.s,
                    }
                    for (let displacement of ship.displacement || []) {
                        inertia.q = inertia.q + displacement.q;
                        inertia.r = inertia.r + displacement.r;
                        inertia.s = inertia.s + displacement.s;
                    }

                    if (Math.abs(inertia.q) <= 1 && Math.abs(inertia.r) <= 1 && Math.abs(inertia.s) <= 1) {
                        for (let hex of grid.neighborsOf(Hex(ship.x, ship.y))) {
                            if (!hex) {
                                continue;
                            }
                                for (let el of getFromPositionedElements(positionedElements, hex.x + ':' + hex.y, "planet")) {
                                    let action = this._representation;
                                    action.name = action.name + '(' + el.name + ')';
                                    action.target = {
                                        x: hex.x,
                                        y: hex.y
                                    }
                                    actions.push(action);
                                }
                        }
                    }
                    return actions;
                },
                get _representation() {
                    return {
                        type: "land",
                        overtip: "Land on a planet, you can choose to face any hex of it, but remenber you can only take off with the ressources and help of a friendly base.",
                        name: "land"
                    }
                }
            },
            takeoff: {
                execute(ship, result) {
                    delete ship.landed;

                    ship.inertia = ship.landedDirection || result;
                    ship.takeoff = true;

                    delete ship.landedDirection;

                    return ship;
                },
                canDo(positionedElements, ship) {
                    if (ship._ship.landed) {
                        if (!ship._ship.landedDirection) {
                            return [{
                                ...this._representation,
                                free: true,
                                direct: false
                            }];
                        }
                        for (let el of getFromPositionedElements(positionedElements, ship.x + ':' + ship.y, "base")) {
                            if (
                                el.direction.q === ship._ship.landedDirection.q &&
                                el.direction.r === ship._ship.landedDirection.r &&
                                el.direction.s === ship._ship.landedDirection.s) {
                                return [this._representation];
                            }
                        }
                    }

                    return [];
                },
                get _representation() {
                    return {
                        type: "takeoff",
                        name: "take off",
                        overtip: "Take off using boosters from a friendly base to go one hex above the planet. Don't forget to burn left or right to began an orbit or you'll crash on the ground from gravity.",
                        direct: true
                    }
                }
            },
            burn: {
                execute(ship, result) {
                    ship.fuel--;

                    ship.inertia = {
                        q: ship.inertia.q - result.q,
                        r: ship.inertia.r - result.r,
                        s: ship.inertia.s - result.s
                    };

                    ship.hasBurn = true;

                    return ship;
                },
                canDo(positionedElements, ship) {
                    if (ship._ship.fuel === 0 || ship._ship.landed || ship._ship.damage !== 0) {
                        return []
                    }
                    return [this._representation]
                },
                get _representation() {
                    return {
                        type: "burn",
                        overtip: "Burn to modify your direction, but don't forget that in space you keep your inertia and braking will requiere has much fuel has accelareting.",
                        name: "burn"
                    }
                }
            },
            sabotage: {
                execute(ship, result, pe, scenario) {
                    ship.fuel--;

                    ship.damage++;
                    ship.damageTaken = true;
                    scenario.addMessage(ship.name + ' was saboted')

                    return ship;
                },
                canDo(positionedElements) {
                    return [this._representation]
                },
                get _representation() {
                    return {
                        type: "sabotage",
                        overtip: "The ship's crew decide for no good reason to destroy it, and inflige damage to itself.",
                        name: "sabotage"
                    }
                }
            },
            attack: {
                execute(ship, result, pe, scenario) {
                    let target = pe[result.x+":"+result.y].find(el=>el.id === result.id);
                    if(!target){
                        throw new Error('target is not defined');
                    }
                    ship.fireAt = target;
                    scenario.addMessage(ship.name + ' is firing is guns');
                    return ship;
                },
                canDo(positionedElements, ship) {
                    if(ship._ship.landed || ship._ship.damage !== 0){
                        return []
                    }
                    let rangeHexes = grid.hexesInRange(Hex(ship.x, ship.y), ship._ship.range, true);
                    let canAttack = [];
                    for(let rhex of rangeHexes){
                        for (let el of getFromPositionedElements(positionedElements, rhex.x + ':' + rhex.y, ["ship"])) {
                            if(el.owner !== ship.owner && !el.landed && !el.destroyed){
                                let obstruction = false;
                                let destPoint = Hex(el.x, el.y).toPoint()
                                .add(Hex(el.x, el.y).center());
                                
                                let startPoint = Hex(ship.x, ship.y).toPoint()
                                .add(Hex(ship.x, ship.y).center());

                                let trajectoryLine = {
                                    start:[startPoint.x, startPoint.y],
                                    end:[destPoint.x, destPoint.y]
                                } 
                                let traversedHexs = grid.hexesBetween(Hex(ship.x, ship.y), Hex(el.x, el.y));
                                for (let traversedHex of traversedHexs) {
                                    if (!traversedHex) {
                                        continue;
                                    }
                                    for (let el of getFromPositionedElements(positionedElements, traversedHex.x + ":" + traversedHex.y, ["planet", "star"])) {
                                        let planetCenter = traversedHex.toPoint().add(traversedHex.center());
                                        let hasColision = collide(trajectoryLine.start, trajectoryLine.end, [planetCenter.x, planetCenter.y], el.apparence.radius);
                                        if(hasColision){
                                            obstruction = true;
                                        }
                                    }
                                }
                                if(!obstruction){
                                    canAttack.push({
                                        ...this._representation,
                                        name: `${this._representation.name} ${el.name}`,
                                        result:{x:el.x, y:el.y, id:el.id}
                                    });
                                }
                            }
                        }
                        
                    }
                    return canAttack
                },
                get _representation() {
                    return {
                        type: "attack",
                        overtip: "Fire on target with all your ship guns.",
                        name: "Attack",
                        direct: true,
                        isUniquePerTurn: true
                    }
                }
            }
        }
    }

    get x() {
        return this._ship.x;
    }

    get y() {
        return this._ship.y
    }

    get owner() {
        return this._ship.owner
    }

    get destroyed() {
        return this._ship.destroyed
    }

    calculateActions(positionedElements, scenario) {
        let actions = [];
        if (this._ship.destroyed) {
            this._ship.actions = actions;
            return;
        }

        for (let actionKey in this.actions) {
            if(!scenario.forbiddenAction.includes(actionKey)){
                let action = this.actions[actionKey]
                actions = [...actions, ...action.canDo(positionedElements, this, scenario)]
            }
        }


        let id = 0;
        actions = actions.map(action => {
            action.elementId = this._ship.id;
            action.id = id++;
            return action;
        });
        this._ship.actions = actions;
    }
}
