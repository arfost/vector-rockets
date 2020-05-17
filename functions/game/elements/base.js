const { inertiaToHex, hexToInertia, getDice, getFromPositionedElements } = require('../tools.js')
var collide = require('line-circle-collision');
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid(Hex).rectangle({ width: 200, height: 200 });

module.exports = class {

    init(base, baseId, type, player) {

        this._base = JSON.parse(JSON.stringify({
            desc: "A resupply base",
            overtip: "A neutral base that can resupply you when orbiting above doing no action, or when landed on. Also give the boosters necessary for take off.",
            ...base,
            id: baseId,
            type: "base",
            actif: true,
            range:2,
            apparence: {
                color: "DDDDDD",
                size: 3
            },
        }))
        if (player) {

            base.name = player.name + " - 1";
            base.owner = player.uid;
            this._base.apparence.color = player.color;
        }
    }

    get id() {
        return this._base.id;
    }

    load(base) {
        this._base = base;
    }

    get jsonDesc() {
        return this._base
    }

    set futurHex(futurHex) {
        this._base.futurHex = futurHex;
    }

    get futurHex() {
        if (this._base.futurHex) {
            return this._base.futurHex;
        }
        throw new Error('futurHex no value for this time')
    }

    get traversedHexs() {
        if (this._base.traversedHexs) {
            return this._base.traversedHexs;
        }
        throw new Error('traversed hex no value for this time')
    }

    set traversedHexs(traversedHexs) {
        this._base.traversedHexs = traversedHexs;
    }

    resolveTurn(positionedElements, scenario) {
        let aboveHex = inertiaToHex(this._base.direction, Hex(this._base.x, this._base.y), Hex);
        for (let el of getFromPositionedElements(positionedElements, aboveHex.x + ":" + aboveHex.y, "ship")) {
            if (el.doneAction === false && (Math.abs(el.inertia.q) <= 1 && Math.abs(el.inertia.r) <= 1 && Math.abs(el.inertia.s) <= 1) && !el.destroyed) {
                this.reSupply(el, scenario);
            }
        }
        if (positionedElements[this.x + ":" + this.y]) {
            for (let el of getFromPositionedElements(positionedElements, this.x + ":" + this.y, "ship")) {
                if (el.doneAction === false && !el.destroyed) {
                    this.reSupply(el, scenario);
                }
            }
        }
        if(scenario.reportLogAction){
            for(let surHex of this._base.surveyRange){
                for (let el of getFromPositionedElements(positionedElements, surHex.x + ":" + surHex.y, "ship")) {
                    for(let entry of el.logs){
                        if(scenario.reportLogAction.types.includes(entry.type)){
                            scenario.reportLogAction.reportLog(entry, el);
                        }
                    }
                }
            }
        }
    }

    finishTurn(scenario) { }

    reSupply(ship, scenario) {
        if (ship.fuel < ship.fuelMax) {
            ship.fuel = ship.fuelMax;
            scenario.addMessage(ship.name + " is ressuplied by " + this.name)
        }
    }

    finishInit(positionedElements, scenario){
        let aboveHex = inertiaToHex(this._base.direction, Hex(this._base.x, this._base.y), Hex);
        let surveyedHexs = grid.hexesInRange(aboveHex, this._base.range, false);
        let startPoint = aboveHex.toPoint().add(aboveHex.center());
        surveyedHexs = surveyedHexs.filter(hex=>{
            let obstruction = false;
            let destPoint = hex.toPoint().add(hex.center());
            
            let trajectoryLine = {
                start:[startPoint.x, startPoint.y],
                end:[destPoint.x, destPoint.y]
            }
            const traversedHexs = grid.hexesBetween(hex, aboveHex);
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
            return !obstruction;
        })
        surveyedHexs.push(aboveHex);
        this._base.surveyRange = surveyedHexs;
    }

    prepareActions(positionedElements, scenario) {}

    get actions() {
        return {}
    }

    get x() {
        return this._base.x;
    }

    get y() {
        return this._base.y
    }

    get name() {
        return this._base.name
    }

    get owner() {
        return this._base.owner
    }

    get destroyed() {
        return this._base.destroyed
    }

    calculateActions(positionedElements, scenario) {
        let actions = [];
        if (this._base.destroyed) {
            this._base.actions = actions;
            return;
        }

        for (let action of Object.values(this.actions)) {
            actions = [...actions, ...action.canDo(positionedElements, this._base)]
        }


        let id = 0;
        actions = actions.map(action => {
            action.elementId = this._base.id;
            action.id = id++;
            return action;
        });
        this._base.actions = actions;
    }
}