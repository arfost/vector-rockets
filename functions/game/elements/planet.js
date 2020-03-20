const shipReference = require('./shipReference.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  constructor(planet, baseId, type) {
    planet.actif = false;
    planet.id = baseId;
    planet.overtip = "You can land on planet to refuel if your speed is of one hex by turn."
    
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

    this._planet = planet;
    this._others = arrows.map(arrow=>{
        return {
            id:++baseId,
            actif:false,
            type:"gravArrow",
            direction:arrow.direction,
            x:planet.x+arrow.x,
            y:planet.y+arrow.y,
            name:"gravity arrow",
            overtip:"gravity arrow are here to represent the pull of gravity when near a planet",
        }
    })
  }

  get jsonDesc(){
      return [...this._others, this._planet]
  }
}