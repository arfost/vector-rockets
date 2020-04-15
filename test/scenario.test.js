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

    test('player has objectives now', () => {
        expect(players[0].objectives).toBeDefined();
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
            scenario.init(players, {ss:true});
        });
        test('ship has moved', () => {
            let ship = scenario.elements.find(el=>el.owner === players[0].uid);
            let startPoint = [{x:31,y:5},{x:17,y:26},{x:10,y:8},{x:47,y:13}].find(coord=>coord.x===ship.x && coord.y === ship.y)
            expect(startPoint).toBeDefined();
        })
    })  
})
