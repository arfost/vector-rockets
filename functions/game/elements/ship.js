const shipReference = require('./shipReference.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  constructor(base, baseId, type) {
    this._ship = {
      ...base,
      ...shipReference[type],
      id: baseId,
      inertia: {
        q: 0,
        r: 0,
        s: 0
      },
      type: "ship",
    }
  }

  get ship() {
    return this._ship
  }

  baseTurn(positionedElements, scenario) {
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

      let futurHex = inertiaToHex(this._ship.inertia, Hex(this._ship.x, this._ship.y), Hex);

      let traversedHexs = grid.hexesBetween(Hex(this._ship.x, this._ship.y), futurHex);
      traversedHexs.shift();

      for (let traversedHex of traversedHexs) {
        if (!traversedHex) {
          continue;
        }
        if (positionedElement[traversedHex.x + ":" + traversedHex.y]) {
          for (let el of positionedElement[
            traversedHex.x + ":" + traversedHex.y
          ]) {
            if (el.type === "gravArrow") {
              ship.displacement.push(el.direction);
            }
            if (el.type === "dirtySpace") {
              if (!(Math.abs(ship.inertia.q) <= 1 && Math.abs(ship.inertia.r) <= 1 && Math.abs(ship.inertia.s) <= 1)) {
                let result = getDice(1, 6) - 4;
                if (result > 0) {
                  ship.damage = result;
                  ship.damageTaken = true;
                }
              }
            }
          }
        }
      }
      if ((futurHex.x < 0 || futurHex.x > game.mapInfos.width || futurHex.y < 0 || futurHex.y > game.mapInfos.height) && !ship.destroyed) {
        this._ship.destroyed = true;
        this._ship.destroyedReason = 'outbound';
        game.messages.push(this._ship.name + ' was lost in space')
      }

      this._ship.x = futurHex.x;
      this._ship.y = futurHex.y;

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
          game.messages.push(this._ship.name + ' was destroyed in an artistic fireball')
        }
        this._ship.damageTaken = false;
      } else {
        if (this._ship.damage > 0) this._ship.damage--;
      }
    }
  }

  get actions() {
    return {
      land: {
        execute(ship, result) {
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
      
          //TODO add speed test
          if (Math.abs(inertia.q) <= 1 && Math.abs(inertia.r) <= 1 && Math.abs(inertia.s) <= 1) {
            for (let hex of grid.neighborsOf(Hex(this._ship.x, this._ship.y))) {
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
          delete ship.landed;

          ship.inertia = result;
          ship.takeoff = true;

          return ship;
        },
        canDo(positionedElements, ship) {
          if(ship.landed){
            return [this._representation]
          }
          return []
        },
        get _representation(){
          return {
            type: "takeoff",
            name: "take off"
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
        execute(ship, result, pe, game) {
          ship.fuel--;

          ship.damage++;
          ship.damageTaken = true;
          game.messages.push(ship.name + ' was erter')

          return ship;
        },
        canDo(positionedElements) {
          return [this._representation]
        },
        _representation(){
          return {
            type: "burn",
            name: "burn"
          }
        }
      },
    }
  }

  getActions(positionedElements, scenario) {
    let actions = [];
    if (this._ship.destroyed) {
      return actions;
    }

    for(let action of this.actions){
      actions = [...actions, ...action.canDo(positionedElements, this._ship)]
    }
    

    let id = 0;
    actions = actions.map(action => {
      action.elementId = this._ship.id;
      action.id = id++;
      return action;
    });
    return actions;
  }
}