import { defineGrid, extendHex } from 'honeycomb-grid';
import * as PIXI from 'pixi.js';

  var evenq_directions = [
    [[+1, +1], [+1,  0], [ 0, -1], 
     [-1,  0], [-1, +1], [ 0, +1]],
    [[+1,  0], [+1, -1], [ 0, -1], 
     [-1, -1], [-1,  0], [ 0, +1]],
]

export default class MapRenderer {
    constructor(){
        this.app = new PIXI.Application({ transparent: true, antialias: true });
        this.Hex = extendHex({ size: 14, orientation: 'flat' });
        this.camera = {
            zoom:1,
            x:40,
            y:15,
        }
        this.Grid = defineGrid(this.Hex);
        this.hexGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.hexGraphics);

        this.cellsGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.cellsGraphics);
        this.app.view.addEventListener('mousewheel', (ev)=>this.mapZoom(ev));
        this.cells = [];
    }

    getView(){
        return this.app.view;
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

    setCells(cells){
        console.log(cells)
        this.cells = cells;
        this.drawCells();
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
        this.drawCells();
    }

    drawCells(){
        this.cellsGraphics.clear();
        this.cellsGraphics.removeChildren();
        this.cellsGraphics.lineStyle(1, 0x999999);

        if(!this.grid){
            return 
        }
    
        this.cells.forEach(cell => {
            let hex = this.grid.get([cell.x, cell.y]);
            if(hex){

            }else{
                console.log(cell, this.grid)
                throw new Error(`hex outside grid : ${cell.X}, ${cell.y}`)
            }
            ElementRenderer.render(this.cellsGraphics, cell.type, cell, hex, this.camera, this.grid);
        });
    }

    drawHex(){
        this.hexGraphics.clear();
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
        
    }
}

class ElementRenderer {
    static render(ctx, type, element, hex, camera, grid){
        switch(type){
            case "planet":
                    ElementRenderer.planeteRenderer(ctx, element, hex, camera);
                break;
            case "ship":
                    ElementRenderer.shipRenderer(ctx, element, hex, camera, grid);
                break;
            default:
                ElementRenderer.defaultRenderer(ctx, element, hex, camera);
                console.error("no renderer for type "+ type, element);
        }
    }

    static planeteRenderer(ctx, element, hex, camera){
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        ctx.beginFill('0xD'+element.apparence.color, 1);
        ctx.drawCircle(point.x, point.y, element.apparence.radius*camera.zoom);
        ctx.endFill();
    }

    static shipRenderer(ctx, element, hex, camera, grid){
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
        
        //draw trajectory and rotation
        let destHex = grid.get([element.x+element.inertia.x, element.y+element.inertia.y]);
        const destPoint = destHex.toPoint().add(destHex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        ctx.lineStyle(2*camera.zoom, 0xff0000);
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(destPoint.x, destPoint.y);
        ctx.beginFill(0xff0000, 1);
        ctx.drawCircle(destPoint.x, destPoint.y, 3*camera.zoom);
        ctx.endFill();
        let angle = Math.atan2(destPoint.x-point.x, point.y-destPoint.y);
        var degrees = 180*angle/Math.PI;
        ship.angle = degrees;

        //draw trails from previous moves
        if(element.trails){
            for(let trail of element.trails){
                ElementRenderer.trailRenderer(ctx, trail, camera, grid)
            }
        }
        
        ctx.addChild(ship);
    }

    static trailRenderer(ctx, trail, camera, grid){
        let hex = grid.get([trail.x, trail.y]);
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        let destHex = grid.get([trail.x+trail.inertia.x, trail.y+trail.inertia.y]);
        const destPoint = destHex.toPoint().add(destHex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);

        ctx.lineStyle(2*camera.zoom, 0x777777);
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(destPoint.x, destPoint.y);

        ctx.lineStyle(3*camera.zoom, 0x000000);
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

    static defaultRenderer(ctx, element, hex, camera){
        const point = hex.toPoint().add(hex.center()).multiply(camera.zoom, camera.zoom).add(camera.x, camera.y);
        ctx.beginFill('0xDff0000', 1);
        ctx.drawRect(point.x-(5*camera.zoom/2), point.y-(5*camera.zoom/2), 5*camera.zoom,5*camera.zoom);
        ctx.endFill();
    }
}