const shipReference = require('./shipReference.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  constructor(star, baseId, type) {
    star.actif = false;
    star.id = baseId;
    star.overtip = "You can land on star to refuel if your speed is of one hex by turn."
    
    let arrows = [
        {
            direction:{
                q:-1,
                r:0,
                s:1
            },
            x:1,
            y:star.x % 2 ? 1 : 0
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
            y:star.x % 2 ? 1 : 0
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            x:1,
            y:star.x % 2 ? 0 : -1
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            x:-1,
            y:star.x % 2 ? 0 : -1
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

    this._star = star;
    this._others = arrows.map(arrow=>{
        return {
            id:++baseId,
            actif:false,
            type:"gravArrow",
            direction:arrow.direction,
            x:star.x+arrow.x,
            y:star.y+arrow.y,
            name:"gravity arrow",
            overtip:"gravity arrow are here to represent the pull of gravity when near a star",
        }
    })
  }

  get jsonDesc(){
      return [...this._others, this._star]
  }
}