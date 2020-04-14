const ShipClass = require('../functions/game/elements/ship.js');

describe('Testing base property initialisation on ship', () => {


    let ship;

    beforeAll(() => {
        ship = new ShipClass();
        ship.init({ x: 17, y: 26, landed: true }, "shi-1", "corvette", { color: "red", name: "clem", uid:"uid" })
    });

    test('id assignation', () => {
        expect(ship.id).toBe("shi-1");
    })
    test('type assignation', ()=>{
        expect(ship.type).toBe("ship");
    })
    test('name assignation', ()=>{
        let jsonShip = ship.jsonDesc
        expect(jsonShip.name).toBe("clem - 1");
    })
    test('owner assignation', ()=>{
        expect(ship.owner).toBe("uid");
    })
    test('color assignation', ()=>{
        let jsonShip = ship.jsonDesc
        expect(jsonShip.apparence.color).toBe("blue");
    })
})