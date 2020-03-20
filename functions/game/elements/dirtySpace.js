const shipReference = require('./shipReference.js')
const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });

module.exports = class {
  constructor(base, baseId) {
    base.actif = false;
    base.id = baseId;
    base.name = "dirty space";
    base.desc = "this space is dirty, po";
    this._base = base;
  }

  get jsonDesc(){
      return [this._base]
  }
}