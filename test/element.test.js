const getElement = require('../functions/game/elements');

test('error when requesting inexisting element', ()=>{
    let testCrea = ()=>{
        getElement('bad')
    }
    expect(testCrea).toThrow();
})

test('getting a base instance', ()=>{
    let testCrea = getElement('base')
    expect(testCrea).toBeDefined();
})