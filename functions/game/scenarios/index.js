function getScenario(scenario){
  switch(scenario){
    case "base":
      return require('./base.js');
    default: throw new Error("this scenario doesn't exist");
  }
}

module.exports = getScenario;