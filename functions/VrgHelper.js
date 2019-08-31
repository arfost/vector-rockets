/* eslint-disable no-loop-func */
const NS = 'NS';
const EO = 'EO';

module.exports.newMap = function () {
    return {
        cells:[],
        mapInfos:{
            width:51,
            height:35
        }
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