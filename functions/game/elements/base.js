const {inertiaToHex, hexToInertia, getDice} = require('../tools.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  
  init(base, baseId, type, player){
      
    this._base = JSON.parse(JSON.stringify({
        desc:"A resupply base",
        overtip:"A neutral base that can resupply you when orbiting above doing no action, or when landed on. Also give the boosters necessary for take off.",
        ...base,
        id: baseId,
        type: "base",
        actif: true,
        apparence:{
            color:"DDDDDD",
            size:3
        },
      }))
      if(player){
          
        base.name = player.name + " - 1";
        base.owner = player.uid;
        this._base.apparence.color = player.color;
      }
  }

  get id(){
      return this._base.id;
  }

  load(base){
      this._base = base;
  }

  get jsonDesc() {
    return this._base
  }

  resolveTurn(positionedElements, scenario) {
    let aboveHex = inertiaToHex(this._base.direction, Hex(this._base.x, this._base.y), Hex);
    if (positionedElements[aboveHex.x + ":" + aboveHex.y]) {
        for (let el of positionedElements[
            aboveHex.x + ":" + aboveHex.y
        ]) {
            if (el.type === "ship" && el.doneAction === false && (Math.abs(el.inertia.q) <= 1 && Math.abs(el.inertia.r) <= 1 && Math.abs(el.inertia.s) <= 1)) {
                this.reSupply(el, scenario);
            }
        }
    }
    if (positionedElements[this.x + ":" + this.y]) {
        for (let el of positionedElements[
            this.x + ":" + this.y
        ]) {
            if (el.type === "ship" && el.doneAction === false) {
                this.reSupply(el, scenario);
            }
        }
    }
  }

  reSupply(ship, scenario){
      if(ship.fuel<ship.fuelMax){
        ship.fuel = ship.fuelMax;  
        scenario.addMessage(ship.name + " is ressuplied by "+this.name)
      }
  }

  prepareActions(positionedElement, scenario){
    
  }

  get actions() {
    return {

    }
  }
  

  get x(){
      return this._base.x;
  }

  get y(){
    return this._base.y
  }

  get name(){
    return this._base.name
  }

  get owner(){
    return this._base.owner
  }

  get destroyed(){
    return this._base.destroyed
  }

  calculateActions(positionedElements, scenario) {
    let actions = [];
    if (this._base.destroyed) {
        this._base.actions = actions;
      return;
    }

    for(let action of Object.values(this.actions)){
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