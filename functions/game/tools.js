
const inertiaToHex = function (inertia, oldHex, Hex) {
    return Hex({
        q: oldHex.q + inertia.q,
        r: oldHex.r + inertia.r,
        s: oldHex.s + inertia.s
    });
};
const hexToInertia = function (oldHex, newHex, Hex) {
    let hex = Hex(oldHex);
    let fhex = Hex(newHex);
    return {
        q:fhex.q-hex.q,
        r:fhex.r-hex.r,
        s:fhex.s-hex.s
    };
};

const getPlayerColorList = function(){
    let colorList = ['00ff00', 'ff0000', '0000ff', '000000', 'ffff00', '00ffff', 'ff00ff'];
    colorList = shuffleArray(colorList)
    return colorList;
}

const getDice = function (min, max) {
    if (typeof max === "undefined") {
        max = min;
        min = 1;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const shuffleArray = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {
    shuffleArray: shuffleArray,
    getDice: getDice,
    getPlayerColorList: getPlayerColorList,
    inertiaToHex: inertiaToHex,
    hexToInertia: hexToInertia
}