const Honeycomb = require("honeycomb-grid");

const Hex = Honeycomb.extendHex({ size: 14, orientation: "flat" });

const grid = Honeycomb.defineGrid().rectangle({ width: 200, height: 200 });
/* eslint-disable no-loop-func */

module.exports.newScenario = function () {
    return {
        elements: [],
        init: function (players) {
            

            for (let player of players) {
                
            }
        }
    };
};

module.exports.playElement = function (element, positionedElement, game) {
    if (element.plannedActions) {
        for (let pa of element.plannedActions) {
            element = actionLib[element.type][pa.type](
                element,
                pa.result,
                positionedElement,
                game
            );
        }
    }
    element = actionLib[element.type].base(element, positionedElement, game);
    element.actions = actionLib[element.type].getBaseAction(
        element,
        positionedElement,
        game
    );
    element.plannedActions = [];
};


