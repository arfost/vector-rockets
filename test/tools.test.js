const { shuffleArray, getDice, getPlayerColorList, inertiaToHex, hexToInertia} = require('../functions/game/tools.js');


describe('Testing tools for the game', ()=>{

    test('testing tool shuffle array', ()=>{
        let base = [1, 2, 3, 4, 5, 6]
        let shuffled = shuffleArray([1, 2, 3, 4, 5, 6])
        expect(shuffled.join()).not.toBe(base.join());
        expect(shuffled.sort().join()).toBe(base.join());
    })
})
