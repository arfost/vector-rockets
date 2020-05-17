const damageTable = {
    "4/1":{
        1:2,
        2:3,
        3:4,
        4:5,
        5:99,
        6:99
    },
    "3/1":{
        1:0,
        2:2,
        3:3,
        4:4,
        5:5,
        6:99
    },
    "2/1":{
        1:0,
        2:0,
        3:2,
        4:3,
        5:4,
        6:5
    },
    "1/1":{
        1:0,
        2:0,
        3:0,
        4:2,
        5:3,
        6:4
    },
    "1/2":{
        1:0,
        2:0,
        3:0,
        4:0,
        5:2,
        6:3
    },
    "1/4":{
        1:0,
        2:0,
        3:0,
        4:0,
        5:0,
        6:1
    }
}

const getDamage = function (battleValue, diceResult) {
    if(diceResult<1){
        return 0
    }
    if(diceResult > 6){
        diceResult = 6
    }
    let value = damageTable[battleValue] ? damageTable[battleValue] : damageTable["1/1"];
    return value[diceResult];
};

module.exports = {
    getDamage: getDamage
}