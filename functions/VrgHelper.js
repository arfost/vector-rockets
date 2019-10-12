const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });
/* eslint-disable no-loop-func */
const NS = "NS";
const EO = "EO";

module.exports.newScenario = function() {
  return {
    elements: [
      {
        actif: false,
        apparence: {
          color: "0066ff",
          radius: 7
        },
        name: "earth",
        type: "planet",
        x: 10,
        y: 10
      },
      {
        actif: false,
        apparence: {
          color: "ff6600",
          radius: 6
        },
        name: "mars",
        type: "planet",
        x: 15,
        y: 19
      }
    ],
    mapInfos: {
      width: 51,
      height: 35,
      navigable: true
    },
    init: function(players) {
      for (let player of players) {
        let ship = {
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
          id: this.elements.length,
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
        ship.actions = actionLib["ship"].getBaseAction(ship);
        this.elements.push(ship);
      }
    }
  };
};

module.exports.playElement = function(element, positionedElement) {
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

const getDice = function(min, max) {
  if (typeof max === "undefined") {
    max = min;
    min = 1;
  }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

module.exports.getDice = getDice;

module.exports.shuffleArray = function(a) {
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
    }
  }
};

const inertiaToHex = function(inertia, oldHex, Hex) {
  return Hex({
    q: oldHex.q + inertia.q,
    r: oldHex.r + inertia.r,
    s: oldHex.s + inertia.s
  });
};
