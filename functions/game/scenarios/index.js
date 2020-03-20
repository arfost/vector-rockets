function getScenario(scenario){
  switch(scenario){
    case "intro":
      return new (require('./introScenario.js'))();
    default: throw new Error("this scenario doesn't exist");
  }
}

module.exports = getScenario;