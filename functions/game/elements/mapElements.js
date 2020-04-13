const inflate = {
    planet:function(planet, baseId){
        
        planet.actif = false;
        planet.id = baseId;
        planet.overtip = "You can land on planet if your speed is of one hex by turn. Beware, you can only take of from a friendly base."

        return [planet, ...getGravityWell(planet, baseId)]
    },
    star:function(star, baseId){
        
        star.actif = false;
        star.id = baseId;

        return [star, ...getGravityWell(star, baseId)]
    },
    dirtySpace:function(dirtySpace, baseId){
            
        dirtySpace.actif = false;
        dirtySpace.id = baseId;
        dirtySpace.name = "dirty space";
        dirtySpace.desc = "this space is dirty, po"

        return [dirtySpace];
    }
}

const getGravityWell = function(heavyBody, baseId){

    let arrows = [
        {
            direction:{
                q:-1,
                r:0,
                s:1
            },
            x:1,
            y:heavyBody.x % 2 ? 1 : 0
        },{
            direction:{
                q:0,
                r:-1,
                s:1
            },
            x:0,
            y:1
        },{
            direction:{
                q:1,
                r:-1,
                s:0
            },
            x:-1,
            y:heavyBody.x % 2 ? 1 : 0
        },{
            direction:{
                q:-1,
                r:1,
                s:0
            },
            x:1,
            y:heavyBody.x % 2 ? 0 : -1
        },{
            direction:{
                q:1,
                r:0,
                s:-1
            },
            x:-1,
            y:heavyBody.x % 2 ? 0 : -1
        },{
            direction:{
                q:0,
                r:1,
                s:-1
            },
            x:0,
            y:-1
        },
    ]
    return arrows.map(arrow=>{
        return {
            id:++baseId,
            actif:false,
            type:"gravArrow",
            direction:arrow.direction,
            x:heavyBody.x+arrow.x,
            y:heavyBody.y+arrow.y,
            name:"gravity arrow",
            overtip:"gravity arrow are here to represent the pull of gravity when near a heavy body",
        }
    })

    
}

module.exports = function(base, baseId){
    return inflate[base.type](base, baseId);
}