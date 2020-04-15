
const ShipClass = require("./ship.js");
const BaseClass = require("./base.js");

function getElement(element) {
  switch (element) {
    case "ship":
      return new ShipClass();
    case "base":
      return new BaseClass();

    default: throw new Error("this element type doesn't exist");
  }
}

module.exports = getElement;