import { defineGrid, extendHex, Point } from 'honeycomb-grid';
import * as PIXI from 'pixi.js';

  var evenq_directions = [
    [[+1, +1], [+1,  0], [ 0, -1], 
     [-1,  0], [-1, +1], [ 0, +1]],
    [[+1,  0], [+1, -1], [ 0, -1], 
     [-1, -1], [-1,  0], [ 0, +1]],
]

export default class MapRenderer {
    constructor(elementReceiver, actionReceiver){
        this.app = new PIXI.Application({ transparent: true, antialias: true });
        this.Hex = extendHex({ size: 14, orientation: 'flat'  });
        this.camera = {
            zoom:1,
            x:0,
            y:0,
        }

        this.elementReceiver = elementReceiver;
        this.actionReceiver = actionReceiver;

        this.Grid = defineGrid(this.Hex);

        this.hexGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.hexGraphics);
        
        this.clickGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.clickGraphics);

        this.elementsGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.elementsGraphics);

        this.actionsGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.actionsGraphics);

        this.hoverGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.hoverGraphics);

        this.app.view.addEventListener('mousewheel', (ev)=>this.mapZoom(ev));
        
        this.app.view.addEventListener('mousemove', (ev)=>this.setHover(ev));
        this.app.view.addEventListener('click', (ev)=>this.setClick(ev));
        this.elements = [];

        this.elementRenderer = new ElementRenderer(this.Hex, this.Grid)
    }

    getView(){
        return this.app.view;
    }

    setAction(action, selectedElement){
        this.actions[action.type](action, selectedElement)
    }
    cancelAction(){
        this.currentAction = undefined;
        this.drawAction();
    }

    isInBound(hex){
        return hex.x >=0 && hex.x < this.mapInfos.width && hex.y >= 0 && hex.y < this.mapInfos.height;
    }

    get actions(){
        return {
            burn:(action, selectedElement)=>{
                this.currentAction = Object.assign({},action);
                this.currentAction.baseHex = this.Hex(selectedElement.x, selectedElement.y).add(this.Hex(selectedElement.inertia));
                this.currentAction.selectHex = this.grid.neighborsOf(this.currentAction.baseHex);
                this.currentAction.resolve = (hex, action)=>{
                    console.log(this.selectHex, hex);
                    let goodHex = action.selectHex.find(shex=>shex.equals(hex));
                    if(goodHex){
                        let diff = action.baseHex.subtract(goodHex).cube();
                        this.currentAction = undefined;
                        this.actionReceiver(diff);
                        this.drawAction();
                    }else{
                        console.log('not a good hex')
                    }
                }
                this.drawAction();
            }
        }
    }

    setClick(e){
        let p = Point(e.offsetX, e.offsetY)
        let hex = this.Hex().fromPoint(p.subtract(this.camera.x, this.camera.y).divide(this.camera.zoom, this.camera.zoom));
        if(this.clickHex && hex.x == this.clickHex.x && hex.y == this.clickHex.y || !this.isInBound(hex)){
            this.setClickedHex();
            return;
        }
        if(this.currentAction){
            this.currentAction.resolve(hex, this.currentAction);
            return;
        }
        this.setClickedHex(hex);
    }

    setHover(e, y){
        let p = Point(e.offsetX, e.offsetY)
        let hex = this.Hex().fromPoint(p.subtract(this.camera.x, this.camera.y).divide(this.camera.zoom, this.camera.zoom));
        if(this.hoverHex && hex.x == this.hoverHex.x && hex.y == this.hoverHex.y){
            return;
        }
        if(!this.isInBound(hex)){
            this.hoverGraphics.clear();
            return;
        }
        this.hoverHex = hex;
        this.hoverGraphics.clear();
        this.hoverGraphics.lineStyle(1, 0x000000);

        const point = this.hoverHex.toPoint();
        // add the hex's position to each of its corner points
        const corners = this.hoverHex.corners().map(corner => corner.add(point).multiply(this.camera.zoom, this.camera.zoom).add(this.camera.x, this.camera.y));
        // separate the first from the other corners
        const [firstCorner, ...otherCorners] = corners;
            
        // move the "pen" to the first corner
        this.hoverGraphics.moveTo(firstCorner.x, firstCorner.y);
        // draw lines to the other corners
        otherCorners.forEach(({ x, y }) => this.hoverGraphics.lineTo(x, y));
        // finish at the first corner
        this.hoverGraphics.lineTo(firstCorner.x, firstCorner.y);

    }

    setClickedHex(hex){
        this.elementReceiver(hex ? this.elements.filter(element=>element.x == hex.x && element.y == hex.y) : undefined);
        this.clickHex = hex;
        this.drawClick();
        this.drawElements();
    }

    mapZoom(ev){
        if(!this.mapInfos || !this.mapInfos.navigable){
            return;
        }
        this.camera.zoom += ev.wheelDelta/1000;
        if(this.camera.zoom < 1){
            this.camera.zoom = 1;
        }
        this.camera.x = this.affSize.width/2-ev.clientX;
        this.camera.y = this.affSize.height/2-ev.clientY;
        this.draw();
    }

    setAffSize(affSize){
        this.affSize = affSize;
        this.app.renderer.resize(affSize.width, affSize.height);
        this.draw();
    }

    setElements(elements){
        console.log(elements)
        this.elements = elements;
        this.setClickedHex(this.clickHex);
    }

    setMapInfos(mapInfos){
        if(!mapInfos){
            return;
        }
        this.mapInfos = mapInfos;
        this.grid = this.Grid.rectangle({ width: mapInfos.width, height: mapInfos.height });
        this.draw();
    }

    draw(){
        this.drawHex();
        this.drawElements();
        this.drawAction();
    }

    drawClick(){
        this.clickGraphics.clear();
        if(this.clickHex){
            this.clickGraphics.lineStyle(1, 0xff0000);
            this.clickGraphics.beginFill(0xcccccc, 1);

            const point = this.clickHex.toPoint();
            // add the hex's position to each of its corner points
            const corners = this.clickHex.corners().map(corner => corner.add(point).multiply(this.camera.zoom, this.camera.zoom).add(this.camera.x, this.camera.y));
            // separate the first from the other corners
            const [firstCorner, ...otherCorners] = corners;
                
            // move the "pen" to the first corner
            this.clickGraphics.moveTo(firstCorner.x, firstCorner.y);
            // draw lines to the other corners
            otherCorners.forEach(({ x, y }) => this.clickGraphics.lineTo(x, y));
            // finish at the first corner
            this.clickGraphics.lineTo(firstCorner.x, firstCorner.y);
            this.clickGraphics.endFill();
        }
    }

    drawAction(){
        this.actionsGraphics.clear();
        if(this.currentAction && this.currentAction.selectHex){
            this.actionsGraphics.lineStyle(1, 0x00ff00);
            this.actionsGraphics.beginFill(0x00ff00, 0.5);

            this.currentAction.selectHex.forEach(hex => {
                const point = hex.toPoint();
                // add the hex's position to each of its corner points
                const corners = hex.corners().map(corner => corner.add(point).multiply(this.camera.zoom, this.camera.zoom).add(this.camera.x, this.camera.y));
                // separate the first from the other corners
                const [firstCorner, ...otherCorners] = corners;
                    
                // move the "pen" to the first corner
                this.actionsGraphics.moveTo(firstCorner.x, firstCorner.y);
                // draw lines to the other corners
                otherCorners.forEach(({ x, y }) => this.actionsGraphics.lineTo(x, y));
                // finish at the first corner
                this.actionsGraphics.lineTo(firstCorner.x, firstCorner.y);
            });
            
            this.actionsGraphics.endFill();
            
        }
    }

    drawElements(){
        this.elementsGraphics.clear();
        this.hoverGraphics.clear();
        this.elementsGraphics.removeChildren();
        this.elementsGraphics.lineStyle(1, 0x999999);

        if(!this.grid){
            return 
        }
    
        this.elements.forEach(element => {
            let hex = this.grid.get([element.x, element.y]);
            if(hex){
                let selected = this.clickHex && hex.x == this.clickHex.x && hex.y == this.clickHex.y;
                this.elementRenderer.render(this.elementsGraphics, element.type, element, hex, this.camera, this.grid, selected);
            }else{
                console.error("outside bound", element, this.grid);
            }
        });
    }

    drawHex(){
        this.hexGraphics.clear();
        this.hoverGraphics.clear();
        this.clickGraphics.clear();
        this.hexGraphics.lineStyle(1, 0x999999);

        if(!this.grid){
            return 
        }
    
        this.grid.forEach(hex => {

            const point = hex.toPoint();
            // add the hex's position to each of its corner points
            const corners = hex.corners().map(corner => corner.add(point).multiply(this.camera.zoom, this.camera.zoom).add(this.camera.x, this.camera.y));
            // separate the first from the other corners
            const [firstCorner, ...otherCorners] = corners;
                
            // move the "pen" to the first corner
            this.hexGraphics.moveTo(firstCorner.x, firstCorner.y);
            // draw lines to the other corners
            otherCorners.forEach(({ x, y }) => this.hexGraphics.lineTo(x, y));
            // finish at the first corner
            this.hexGraphics.lineTo(firstCorner.x, firstCorner.y);

        });
        this.drawClick();
    }
}

class ElementRenderer {

    constructor(Hex, Grid){
        this.Hex = Hex;
        this.Grid = Grid;
    }

    render(ctx, type, element, hex, camera, grid, selected){
        switch(type){
            case "planet":
                    this.planeteRenderer(ctx, element, hex, camera);
                break;
            case "ship":
                this.shipRenderer(ctx, element, hex, camera, grid, selected);
                break;
            default:
                this.defaultRenderer(ctx, element, hex, camera);
                console.error("no renderer for type "+ type, element);
        }
    }

    planeteRenderer(ctx, element, hex, camera){
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        ctx.beginFill('0xD'+element.apparence.color, 1);
        ctx.drawCircle(point.x, point.y, element.apparence.radius*camera.zoom);
        ctx.endFill();
    }

    shipRenderer(ctx, element, hex, camera, grid, selected){
        let ship = new PIXI.Graphics();
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);

        //draw ship
        ship.lineStyle(1, 0x999999);
        ship.beginFill('0xD00ff00', 1);
        let [start, ...points] = element.apparence.path.map(p => {return {x:p.x*camera.zoom, y:p.y*camera.zoom}});
        ship.moveTo(start.x, start.y);
        for(let p of points){
            ship.lineTo(p.x, p.y)
        }
        ship.lineTo(start.x, start.y);
        ship.endFill();
        ship.position.set(point.x, point.y);
        
        //draw rotation
        let destHex = grid.get([element.x, element.y]).add(this.Hex(element.inertia));
        const destPoint = destHex.toPoint().add(destHex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        
        let angle = Math.atan2(destPoint.x-point.x, point.y-destPoint.y);
        var degrees = 180*angle/Math.PI;
        ship.angle = degrees;

        //check for burn maneuver
        let burn = element.plannedActions ? element.plannedActions.find(a=>a.type == 'burn') : undefined;
        if(burn){
            let burnDestHex = grid.get([element.x, element.y]);
            burnDestHex = burnDestHex.add(this.Hex(element.inertia));
            burnDestHex = burnDestHex.subtract(this.Hex(burn.result));
            const burnDestPoint = burnDestHex.toPoint().add(burnDestHex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
            ctx.lineStyle(2*camera.zoom, 0xaaaaaa);
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(burnDestPoint.x, burnDestPoint.y);
            ctx.beginFill(0x888888, 1);
            ctx.drawCircle(burnDestPoint.x, burnDestPoint.y, 3*camera.zoom);
            ctx.endFill();
        }

        //draw trails from previous moves
        if(selected){
            //trajectory 
            ctx.lineStyle(2*camera.zoom, 0xff0000);
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(destPoint.x, destPoint.y);
            ctx.beginFill(0xff0000, 1);
            ctx.drawCircle(destPoint.x, destPoint.y, 3*camera.zoom);
            ctx.endFill();
            for(let trail of element.trails || []){
                
                //trail
                this.trailRenderer(ctx, trail, camera, grid)
            }
        }
        
        ctx.addChild(ship);
    }

    trailRenderer(ctx, trail, camera, grid){
        let hex = grid.get([trail.x, trail.y]);
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        let destHex = hex.add(this.Hex(trail.inertia))
        const destPoint = destHex.toPoint().add(destHex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);

        ctx.lineStyle(2*camera.zoom, 0x777777);
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(destPoint.x, destPoint.y);

        ctx.lineStyle(3*camera.zoom, 0x555555);
        switch(trail.burnType){
            case "burn":
                    ctx.beginFill('0xD000000', 1);
                break;
            default:
                ctx.beginFill('0xDffffff', 1);
        }
        ctx.drawCircle(point.x, point.y, 5*camera.zoom);
        ctx.endFill();
    }

    defaultRenderer(ctx, element, hex, camera){
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        ctx.beginFill('0xDff0000', 1);
        ctx.drawRect(point.x-(5*camera.zoom/2), point.y-(5*camera.zoom/2), 5*camera.zoom,5*camera.zoom);
        ctx.endFill();
    }
}