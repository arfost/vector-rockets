const ShipClass = require('../functions/game/elements/ship.js');
const { ElementsReference } = require('../functions/game/tools.js')

describe('Testing base property initialisation on ship', () => {


    let ship;

    beforeAll(() => {
        ship = new ShipClass();
        ship.init({ x: 20, y: 27, landed: false }, "shi-1", "corvette", { color: "red", name: "clem", uid:"uid" })
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
        expect(jsonShip.apparence.color).toBe("red");
    })

    describe('action : attack', () => {
        
        let other

        beforeAll(()=>{
            other = {
                owner: 'other',
                type: 'ship',
                name: 'dummy one',
                combatStrenght: 2,
                inertia: {
                    q:0,
                    r:1,
                    s:-1
                }
            }
        })
        
        describe('attack : attribution', () => {
        
        
            test('valid for attack', () => {
                other.x = 20;
                other.y = 20;
                let result = ship.actions.attack.canDo(new ElementsReference([other]), ship)[0];
                expect(result).toBeDefined();
                expect(result.type).toBe("attack");
            })

            test('to far for attack', () => {
                other.x = 20;
                other.y = 16;
                let result = ship.actions.attack.canDo(new ElementsReference([other]), ship);
                expect(result.length).toBe(0);
            })

            test('planet between', () => {
                other.x = 20;
                other.y = 20;
                let planet = {
                    x: 20,
                    y: 24,
                    type: 'planet',
                    apparence: {
                        radius: 10
                    }
                }
                let result = ship.actions.attack.canDo(new ElementsReference([other, planet]), ship);
                expect(result.length).toBe(0);
            })
        })

        describe('attack : calcul', () => {
        
            test('simple attack', () => {
                other.x = 20;
                other.y = 24;
                other.futurHex = {
                    x:20,
                    y:25
                };
                ship.inertia = {
                    q:0,
                    r:1,
                    s:-1
                }
                ship.prepareActions();
                let result = ship.calcFireAt(other);
                expect(result.range).toBe(2);
                expect(result.relativeSpeedMalus).toBe(0);
                expect(result.combatStrenght).toBe('1/1');
            })

        })
    })

    describe('end turn attribution', () => {

        beforeEach(()=>{
            ship = new ShipClass();
            ship.init({ x: 20, y: 27, landed: false }, "shi-1", "corvette", { color: "red", name: "clem", uid:"uid" })
            ship.prepareActions({}, {});
        })
        
        test('valid for attack', () => {
            let messages = [];
            ship._ship.damageTaken = 2;
            ship.finishTurn({
                addMessage(message){
                    messages.push(message);
                }
            });
            let json = ship.jsonDesc;
            expect(json.damage).toBe(2);
        })

    })
})