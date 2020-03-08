function getElement(element) {
  switch (element) {
    case "ship":
      return require('./ship.js');
    case "star":
      return require('./star.js');
    case "planet":
      return require('./planet.js');
    case "dirtySpace":
      return require('./dirtySpace.js');

    default: throw new Error("this element type doesn't exist");
  }
}

module.exports = getScenario;