const shipReference = require('./shipReference.json')
const {inertiaToHex, hexToInertia, getDice} = require('../tools.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  
  init(base, baseId, type, player){
      
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
        owner: player.uid
      }))
      this._ship.apparence.color = player.color;
  }

  get id(){
      return this._ship.id;
  }

  load(ship){
      this._ship = ship;
  }

  get jsonDesc() {
    return this._ship
  }

  get futurHex(){
    if(this._futurHex){
        return this._futurHex;
    }
    throw new Error('futurHex no value for this time')
  }
  get traversedHex(){
    if(this._traversedHexs){
        return this._traversedHexs;
    }
    throw new Error('traversed hex no value for this time')
  }

  resolveTurn(positionedElements, scenario) {

    if (!this._ship.landed) {

      for (let traversedHex of this._traversedHexs) {
        if (!traversedHex) {
          continue;
        }
        if (positionedElements[traversedHex.x + ":" + traversedHex.y]) {
          for (let el of positionedElements[
            traversedHex.x + ":" + traversedHex.y
          ]) {
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
          }
        }
      }
      if ((this._futurHex.x < 0 || this._futurHex.x > scenario.scenario.mapInfos.width || this._futurHex.y < 0 || this._futurHex.y > scenario.scenario.mapInfos.height) && !this._ship.destroyed) {
        this._ship.destroyed = true;
        this._ship.destroyedReason = 'outbound';
        scenario.addMessage(this._ship.name + ' was lost in space')
      }

      
    }
    
    this._ship.x = this._futurHex.x;
      this._ship.y = this._futurHex.y;

      if (this._ship.takeoff) {
        this._ship.inertia.q = 0;
        this._ship.inertia.r = 0;
        this._ship.inertia.s = 0;

        this._ship.takeoff = false;
      }

      if (this._ship.damageTaken) {
        if (this._ship.damage > 6) {
          this._ship.destroyed = true;
          this._ship.destroyedReason = 'damage';
          scenario.addMessage(this._ship.name + ' was destroyed in an artistic fireball')
        }
        this._ship.damageTaken = false;
      } else {
        if (this._ship.damage > 0) this._ship.damage--;
      }
  }

  prepareActions(positionedElement, scenario){
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
    }else{
        this._ship.doneAction = false;
    }

    let trail = {
        x: this._ship.x,
        y: this._ship.y,
        inertia: this._ship.inertia
      };
  
      if (
        this._ship.plannedActions &&
        this._ship.plannedActions.find(pa => pa.type === "burn")
      ) {
        trail.burnType = "burn";
      }
      if (this._ship.trails) {
        this._ship.trails.push(trail);
      } else {
        this._ship.trails = [trail];
      }

    if (!this._ship.landed) {
      for (let displacement of this._ship.displacement || []) {
        this._ship.inertia.q = this._ship.inertia.q + displacement.q;
        this._ship.inertia.r = this._ship.inertia.r + displacement.r;
        this._ship.inertia.s = this._ship.inertia.s + displacement.s;
      }

      this._ship.displacement = [];

    }
    this._futurHex = inertiaToHex(this._ship.inertia, Hex(this._ship.x, this._ship.y), Hex);

    this._traversedHexs = grid.hexesBetween(Hex(this._ship.x, this._ship.y), this._futurHex);
    this._traversedHexs.shift();
    
    this._ship.plannedActions = [];
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
              if (positionedElements[hex.x + ':' + hex.y]) {
                for (let el of positionedElements[hex.x + ':' + hex.y]) {
                  if (el.type === 'planet') {
                    let action = this._representation;
                    action.name = action.name + '(' + el.name + ')';
                    action.target = {
                      x: hex.x,
                      y: hex.y
                    }
                    actions.push(action)
                  }
                }
              }
            }
          }
          return actions;
        },
        get _representation(){
          return {
            type: "land",
            name: "land"
          }
        }
      },
      takeoff: {
        execute(ship, result) {
            console.log(ship)
          delete ship.landed;

          ship.inertia = ship.landedDirection || result;
          ship.takeoff = true;

          delete ship.landedDirection;

          return ship;
        },
        canDo(positionedElements, ship) {
            if(ship.landed){
                if(!ship.landedDirection){
                    return [{
                        ...this._representation,
                        free:true,
                        direct:false
                    }];
                }
                for(let el of positionedElements[ship.x + ':' + ship.y]){
                    if( 
                        el.type === "base" && 
                        el.direction.q === ship.landedDirection.q && 
                        el.direction.r === ship.landedDirection.r && 
                        el.direction.s === ship.landedDirection.s){
                        return [this._representation];
                    }
                }
            }
            
          return [];
        },
        get _representation(){
          return {
            type: "takeoff",
            name: "take off",
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

          return ship;
        },
        canDo(positionedElements, ship) {
          if(ship.fuel > 0 && !ship.landed && ship.damage === 0){
            return [this._representation]
          }
          return []
        },
        get _representation(){
          return {
            type: "burn",
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
        get _representation(){
          return {
            type: "sabotage",
            name: "sabotage"
          }
        }
      },
    }
  }
  

  get x(){
      return this._ship.x;
  }

  get y(){
    return this._ship.y
  }

  get owner(){
    return this._ship.owner
  }

  get destroyed(){
    return this._ship.destroyed
  }

  calculateActions(positionedElements, scenario) {
    let actions = [];
    if (this._ship.destroyed) {
        this._ship.actions = actions;
      return;
    }

    for(let action of Object.values(this.actions)){
      actions = [...actions, ...action.canDo(positionedElements, this._ship)]
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
