const getScenario = require('../functions/game/scenarios/index.js');

test('error when requesting inexisting scenario', ()=>{
    let testCrea = ()=>{
        getScenario('bad')
    }
    expect(testCrea).toThrow();
})

describe('Testing intro scenario', () => {


    let scenario;
    let players;

    beforeAll(() => {
        players = [{
            "name" : "Arfost",
            "color" : "red",
            "uid": "uid"
          }]
        scenario = getScenario("intro");
        scenario.init(players, {ss:true});
    });

    test('correct number of elements', () => {
        let elements = scenario.elements;
        expect(elements.length).toBe(178);
    })
    describe('testing objs', ()=>{
        test('player has objectives now', () => {
            expect(players[0].objectives).toBeDefined();
        })

        test('player has return to earth obj', () => {
            expect(players[0].objectives.find(obj=>obj.code==="bterra")).toBeDefined();
        })

        test('player has cbvenus obj', () => {
            expect(players[0].objectives.find(obj=>obj.code==="cbvenus")).toBeDefined();
        })
    })
    

    test('starting message in message', () => {
        let messages = scenario.scenario.messages;
        expect(messages).toContain("Starting");
    })

    test('turn is one', () => {
        let turn = scenario.scenario.turn;
        expect(turn).toBe(1);
    })

    describe('player ship verification', () => {
        let ship
        beforeAll(()=>{
            ship = scenario.elements.find(el=>el.owner === players[0].uid);
        })
        test('ship is created in scenario', ()=>{
            
            expect(ship).toBeDefined();
        })
        
        test('ship is correctly placed', () => {
            expect(ship.x).toBe(17);
            expect(ship.y).toBe(26);
        })

        test('action are correctly defined', ()=>{
            expect(ship.actions.length).toBe(2);
            let takeoff = ship.actions.find(a=>a.type === "takeoff");
            expect(takeoff).toBeDefined();

            expect(takeoff.free).toBe(true);
            expect(takeoff.direct).toBe(false);
        })
    })

    describe('scenario can function normally', () => {
        
        beforeAll(()=>{
            scenario.updatePositionedElement();
            scenario.playTurn(players);
        })
        test('end turn message in message', () => {
            let messages = scenario.scenario.messages;
            expect(messages).toContain("Turn 1 finished");
        })
    
        test('turn is two', () => {
            let turn = scenario.scenario.turn;
            expect(turn).toBe(2);
        })
    })

    describe('trying action for ship', () => {
        
        beforeAll(()=>{
            let jsonScenar = scenario.scenario;
            let jsonElement = scenario.elements;

            let ship = jsonElement.find(el=>el.owner === players[0].uid);
            let takeoff = ship.actions.find(a=>a.type === "takeoff");
            ship.plannedActions = [{
                ...takeoff,
                result:{
                    q:1,
                    r:-1,
                    s:0
                }
            }]
            scenario.load(jsonElement, jsonScenar);
            scenario.playTurn(players);

        })
        test('ship has moved', () => {
            let ship = scenario.elements.find(el=>el.owner === players[0].uid);
            expect(ship.x).toBe(18);
            expect(ship.y).toBe(26);
        })
    })  

    describe('testing init with no same start option', () => {
        
        beforeAll(() => {
            players = [{
                "name" : "Arfost",
                "color" : "red",
                "uid": "uid"
              }]
            scenario = getScenario("intro");
            scenario.init(players, {ss:false});
        });
        test('ship is in one of random start point', () => {
            let ship = scenario.elements.find(el=>el.owner === players[0].uid);
            let startPoint = [{x:31,y:5},{x:17,y:26},{x:10,y:8},{x:47,y:13}].find(coord=>coord.x===ship.x && coord.y === ship.y)
            expect(startPoint).toBeDefined();
        })
    })

    describe('complete attack', () => {
        
        beforeAll(() => {
            players = [{
                "name" : "Arfost",
                "color" : "red",
                "uid": "uid"
              },{
                "name" : "Dummy",
                "color" : "blue",
                "uid": "dummuid"
              }]
            scenario = getScenario("intro");
            scenario.init(players, {ss:true, weaponsAvailable:true});
            
            let jsonScenar = scenario.scenario;
            let jsonElement = scenario.elements;

            let ship = jsonElement.find(el=>el.owner === players[0].uid);
            let takeoff = ship.actions.find(a=>a.type === "takeoff");
            ship.plannedActions = [{
                ...takeoff,
                result:{
                    q:1,
                    r:-1,
                    s:0
                }
            }]
            ship = jsonElement.find(el=>el.owner === players[1].uid);
            takeoff = ship.actions.find(a=>a.type === "takeoff");
            ship.plannedActions = [{
                ...takeoff,
                result:{
                    q:0,
                    r:-1,
                    s:1
                }
            }]
            scenario.load(jsonElement, jsonScenar);
            scenario.playTurn(players);
        });
        test('ships can attack', () => {
            let ship = scenario.elements.find(el=>el.owner === players[0].uid);
            let attack = ship.actions.find(a=>a.type === "attack");
            expect(attack).toBeDefined();
        })
        test('actions can work correctly', () => {
            let jsonScenar = scenario.scenario;
            let jsonElement = scenario.elements;

            let ship = jsonElement.find(el=>el.owner === players[0].uid);
            let ship2 = jsonElement.find(el=>el.owner === players[1].uid);

            let attack = ship.actions.find(a=>a.type === "attack");
            ship.plannedActions = [{
                ...attack,
                result:{
                    x:ship2.x,
                    y:ship2.y,
                    id:ship2.id
                }
            }]
            let attack2 = ship2.actions.find(a=>a.type === "attack");
            ship2.plannedActions = [{
                ...attack2,
                result:{
                    x:ship.x,
                    y:ship.y,
                    id:ship.id
                }
            }]
            scenario.load(jsonElement, jsonScenar);
            scenario.playTurn(players);
            expect(scenario.scenario.messages).toContain("Arfost - 1 is firing is guns");
        })
    })
})
