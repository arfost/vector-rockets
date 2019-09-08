/* eslint-disable no-loop-func */
const NS = 'NS';
const EO = 'EO';

module.exports.newScenario = function () {
    return {
        cells:[ {
            "actif" : false,
            "apparence" : {
              "color" : "0066ff",
              "radius" : 7
            },
            "name" : "earth",
            "type" : "planet",
            "x" : 10,
            "y" : 10
          }, {
            "actif" : false,
            "apparence" : {
              "color" : "ff6600",
              "radius" : 6
            },
            "name" : "mars",
            "type" : "planet",
            "x" : 15,
            "y" : 19
          } ],
        mapInfos:{
            width:51,
            height:35,
            navigable:true
        },
    }
}

const getDice = function (min, max) {
    if (typeof max === 'undefined') {
        max = min;
        min = 1;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

module.exports.getDice = getDice;

module.exports.shuffleArray = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}