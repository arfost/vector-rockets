
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

const ElementsReference = class {
    constructor(elements){
        this._elements = elements.reduce((acc, el)=>{
            acc.pos[el.x+':'+el.y] = acc.pos[el.x+':'+el.y] ? [el, ...acc.pos[el.x+':'+el.y]] : [el];
            acc.type[el.type] = acc.type[el.type] ? [el, ...acc.type[el.type]] : [el];
            acc.owner[el.owner] = acc.owner[el.owner] ? [el, ...acc.owner[el.owner]] : [el];
            return acc
        }, {
            pos:{},
            type:{},
            owner:{}
        });
    }

    getElement(pos, type){
        if(type && !Array.isArray(type)){
            type = [type];
        }
        let elements = [];
        if(pos){
            if(!this._elements.pos[pos]){
                return [];
            }
            for(let el of this._elements.pos[pos]){
                if(!type || type.includes(el.type)){
                    elements.push(el);
                }
            }
        }else{
            elements = this._elements.type[type[0]] || [];
        }
        
        return elements;
    }

}

const reduce = function (fraction){
    // This would be quicker if we were looping through primes.
    // Since to determine a prime would take an `additional` 2 calculations, 
    // it's more efficient to perform the 2 here on each number
    for (var i = fraction[0]; i > 0; i--) {
      if (0 === fraction[0] % i && 0 === fraction[1] % i) {
        var numerator = (fraction[0] / i);
        var denominator = (fraction[1] / i)
        return [numerator, denominator];
      }
    }
    throw new Error("Can't reduce fraction")
  }

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
    hexToInertia: hexToInertia,
    reduce: reduce,
    ElementsReference: ElementsReference
}