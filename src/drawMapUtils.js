import { defineGrid, extendHex, Point } from "honeycomb-grid";
import * as PIXI from "pixi.js";

export default class MapRenderer {
    constructor(elementReceiver, actionReceiver, playerUid) {
        this.app = new PIXI.Application({ transparent: true, antialias: true });
        this.Hex = extendHex({ size: 14, orientation: "flat" });
        this.camera = {
            zoom: 1,
            x: 0,
            y: 0
        };

        this.playerUid = playerUid;

        this.elementReceiver = elementReceiver;
        this.actionReceiver = actionReceiver;

        this.Grid = defineGrid(this.Hex);

        this.hexGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.hexGraphics);

        this.elementsGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.elementsGraphics);

        this.clickGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.clickGraphics);

        this.actionsGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.actionsGraphics);

        this.hoverGraphics = new PIXI.Graphics();
        this.app.stage.addChild(this.hoverGraphics);

        this.app.view.addEventListener("mousemove", ev => this.setHover(ev));
        this.app.view.addEventListener("click", ev => this.setClick(ev));
        //this.app.view.addEventListener("touchend", ev => this.setClick(ev));
        this.app.view.addEventListener("touchstart", ev => this.setClick(ev));
        this.elements = [];

        this.elementRenderer = new ElementRenderer(this.Hex, this.Grid, this.playerUid);
    }

    getView() {
        return this.app.view;
    }

    setAction(action, selectedElement) {
        if (this.actions[action.type]) {
            this.actions[action.type](action, selectedElement);
        } else {
            this.actions.default();
        }
    }
    cancelAction() {
        this.currentAction = undefined;
        this.drawAction();
    }

    isInBound(hex) {
        return (
            hex.x >= 0 &&
            hex.x < this.mapInfos.width &&
            hex.y >= 0 &&
            hex.y < this.mapInfos.height
        );
    }

    get actions() {
        return {
            default: () => {
                this.currentAction = undefined;
                this.actionReceiver(true);
                this.drawAction();
            },
            burn: (action, selectedElement) => {
                this.currentAction = Object.assign({}, action);
                let totalInertia = {
                    q: selectedElement.inertia.q,
                    r: selectedElement.inertia.r,
                    s: selectedElement.inertia.s
                }
                for (let displacement of selectedElement.displacement || []) {
                    totalInertia.q = totalInertia.q + displacement.q;
                    totalInertia.r = totalInertia.r + displacement.r;
                    totalInertia.s = totalInertia.s + displacement.s;
                }
                this.currentAction.baseHex = inertiaToHex(
                    totalInertia,
                    this.Hex(selectedElement.x, selectedElement.y),
                    this.Hex
                );
                this.currentAction.selectHex = this.grid.neighborsOf(
                    this.currentAction.baseHex
                );
                this.currentAction.resolve = (hex, action) => {
                    let goodHex = action.selectHex.find(shex => hex.equals(shex));
                    if (goodHex) {
                        let diff = {
                            q: action.baseHex.q - goodHex.q,
                            r: action.baseHex.r - goodHex.r,
                            s: action.baseHex.s - goodHex.s
                        }
                        this.currentAction = undefined;
                        this.actionReceiver(diff);
                        this.drawAction();
                    }
                };
                this.drawAction();
            },
            land: (action, selectedElement) => {
                this.currentAction = Object.assign({}, action);

                this.currentAction.baseHex = this.Hex(action.target.x, action.target.y);
                this.currentAction.selectHex = this.grid.neighborsOf(
                    this.currentAction.baseHex
                );
                this.currentAction.resolve = (hex, action) => {
                    let goodHex = action.selectHex.find(shex => shex.equals(hex));
                    if (goodHex) {
                        let diff = {
                            q: goodHex.q - action.baseHex.q,
                            r: goodHex.r - action.baseHex.r,
                            s: goodHex.s - action.baseHex.s
                        }
                        this.currentAction = undefined;
                        this.actionReceiver({
                            direction:diff,
                            position:{
                                x:action.target.x,
                                y:action.target.y
                            }
                        });
                        this.drawAction();
                    }
                }
                this.drawAction();
            },
            takeoff: (action, selectedElement) => {
                this.currentAction = Object.assign({}, action);

                this.currentAction.baseHex = this.Hex(selectedElement.x, selectedElement.y);
                this.currentAction.selectHex = this.grid.neighborsOf(
                    this.currentAction.baseHex
                );
                this.currentAction.resolve = (hex, action) => {
                    let goodHex = action.selectHex.find(shex => shex.equals(hex));
                    if (goodHex) {
                        let diff = {
                            q: goodHex.q - action.baseHex.q,
                            r: goodHex.r - action.baseHex.r,
                            s: goodHex.s - action.baseHex.s
                        }
                        this.currentAction = undefined;
                        this.actionReceiver(diff);
                        this.drawAction();
                    }
                }
                this.drawAction();
            }
        }
    }

    setClick(e) {
        let p;
        if (e.offsetX) {
            p = Point(e.offsetX, e.offsetY);
        } else if (e.touches && e.touches.length > 0) {
            let touch = e.touches[0];
            p = Point(touch.clientX, touch.clientY);
        } else {
            console.warn("unknown event type : ", e);
            return;
        }
        let hex = this.Hex().fromPoint(
            p
                .subtract(this.camera.x, this.camera.y)
                .divide(this.camera.zoom, this.camera.zoom)
        );
        console.log("click :", hex.x, hex.y)
        if (
            (this.clickHex && hex.x == this.clickHex.x && hex.y == this.clickHex.y) ||
            !this.isInBound(hex)
        ) {
            this.setClickedHex();
            return;
        }
        if (this.currentAction) {
            this.currentAction.resolve(hex, this.currentAction);
            return;
        }
        this.setClickedHex(hex);
    }

    setHover(e, y) {
        let p = Point(e.offsetX, e.offsetY);
        let hex = this.Hex().fromPoint(
            p
                .subtract(this.camera.x, this.camera.y)
                .divide(this.camera.zoom, this.camera.zoom)
        );
        if (this.hoverHex && hex.x == this.hoverHex.x && hex.y == this.hoverHex.y) {
            return;
        }
        if (!this.isInBound(hex)) {
            this.hoverGraphics.clear();
            return;
        }
        this.hoverHex = hex;
        this.hoverGraphics.clear();
        this.hoverGraphics.lineStyle(1, 0x000000);

        const point = this.hoverHex.toPoint();
        // add the hex's position to each of its corner points
        const corners = this.hoverHex.corners().map(corner =>
            corner
                .add(point)
                .multiply(this.camera.zoom, this.camera.zoom)
                .add(this.camera.x, this.camera.y)
        );
        // separate the first from the other corners
        const [firstCorner, ...otherCorners] = corners;

        // move the "pen" to the first corner
        this.hoverGraphics.moveTo(firstCorner.x, firstCorner.y);
        // draw lines to the other corners
        otherCorners.forEach(({ x, y }) => this.hoverGraphics.lineTo(x, y));
        // finish at the first corner
        this.hoverGraphics.lineTo(firstCorner.x, firstCorner.y);
    }

    setClickedHex(hex) {
        this.elementReceiver(
            hex
                ? this.elements.filter(
                    element => element.x == hex.x && element.y == hex.y
                )
                : undefined
        );
        this.clickHex = hex;
        this.drawClick();
        this.drawElements();
    }

    mapMove(x, y) {
        this.camera.x = this.camera.x + (x * 10);
        this.camera.y = this.camera.y + (y * 10);
        this.draw();
    }

    mapZoom(zoom) {
        this.camera.zoom = this.camera.zoom + (zoom / 100);
        this.draw();
    }

    setAffSize(affSize) {
        this.affSize = affSize;
        this.app.renderer.resize(affSize.width, affSize.height);
        this.draw();
    }

    setElements(elements) {
        this.elements = elements;
        this.setClickedHex(this.clickHex);
    }

    setSelectedDetailsId(id) {
        this.selectedDetailsId = id;
        this.draw();
    }

    setMapInfos(mapInfos) {
        if (!mapInfos) {
            return;
        }
        this.mapInfos = mapInfos;
        this.grid = this.Grid.rectangle({
            width: mapInfos.width,
            height: mapInfos.height
        });
        this.draw();
    }

    draw() {
        this.drawHex();
        this.drawElements();
        this.drawAction();
        this.drawClick();
    }

    drawClick() {
        this.clickGraphics.clear();
        if (this.clickHex) {
            this.clickGraphics.lineStyle(1, 0xff0000);
            this.clickGraphics.beginFill(0xcccccc, 0.3);

            const point = this.clickHex.toPoint();
            // add the hex's position to each of its corner points
            const corners = this.clickHex.corners().map(corner =>
                corner
                    .add(point)
                    .multiply(this.camera.zoom, this.camera.zoom)
                    .add(this.camera.x, this.camera.y)
            );
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

    drawAction() {
        this.actionsGraphics.clear();
        if (this.currentAction && this.currentAction.selectHex) {
            this.actionsGraphics.lineStyle(1, 0x00ff00);
            this.actionsGraphics.beginFill(0x00ff00, 0.5);

            this.currentAction.selectHex.forEach(hex => {
                if (!hex) return;
                const point = hex.toPoint();
                // add the hex's position to each of its corner points
                const corners = hex.corners().map(corner =>
                    corner
                        .add(point)
                        .multiply(this.camera.zoom, this.camera.zoom)
                        .add(this.camera.x, this.camera.y)
                );
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

    drawElements() {
        this.elementsGraphics.clear();
        this.hoverGraphics.clear();
        this.elementsGraphics.removeChildren();
        this.elementsGraphics.lineStyle(1, 0x999999);

        if (!this.grid) {
            return;
        }

        this.elements.forEach(element => {
            let hex = this.grid.get([element.x, element.y]);
            if (hex) {
                let selected = this.selectedDetailsId === element.id;
                this.elementRenderer.render(
                    this.elementsGraphics,
                    element.type,
                    element,
                    hex,
                    this.camera,
                    this.grid,
                    selected
                );
            } else {
                console.log("outside bound", element, this.grid);
            }
        });
    }

    drawHex() {
        this.hexGraphics.clear();
        this.hexGraphics.removeChildren();
        this.hoverGraphics.clear();
        this.clickGraphics.clear();
        this.hexGraphics.lineStyle(1, 0x999999);

        const style = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 8
        });

        if (!this.grid) {
            return;
        }

        this.grid.forEach(hex => {
            const point = hex.toPoint();
            // add the hex's position to each of its corner points
            const corners = hex.corners().map(corner =>
                corner
                    .add(point)
                    .multiply(this.camera.zoom, this.camera.zoom)
                    .add(this.camera.x, this.camera.y)
            );
            // separate the first from the other corners
            const [firstCorner, ...otherCorners] = corners;

            // move the "pen" to the first corner
            this.hexGraphics.moveTo(firstCorner.x, firstCorner.y);
            // draw lines to the other corners
            otherCorners.forEach(({ x, y }) => this.hexGraphics.lineTo(x, y));
            // finish at the first corner
            this.hexGraphics.lineTo(firstCorner.x, firstCorner.y);

            // let basicText = new PIXI.Text(`${hex.q} : ${hex.r} : ${hex.s}`, style);
            // let tpoint = hex.toPoint().add(hex.center()).multiply(this.camera.zoom, this.camera.zoom).add(this.camera.x, this.camera.y).subtract(10,5);
            // basicText.x = tpoint.x;
            // basicText.y = tpoint.y;
            // this.hexGraphics.addChild(basicText);
        });
        this.drawClick();
    }
}

class ElementRenderer {
    constructor(Hex, Grid, playerUid) {
        this.Hex = Hex;
        this.Grid = Grid;
        this.testgrid = this.Grid.rectangle({
            width: 200,
            height: 200
        });
        this.playerUid = playerUid;
    }

    render(ctx, type, element, hex, camera, grid, selected) {
        switch (type) {
            case "planet":
                this.planeteRenderer(ctx, element, hex, camera, grid);
                break;
            case "star":
                this.planeteRenderer(ctx, element, hex, camera, grid);
                break;
            case "base":
                this.baseRenderer(ctx, element, hex, camera, grid, selected);
                break;
            case "ship":
                this.shipRenderer(ctx, element, hex, camera, grid, selected);
                break;
            case "dirtySpace":
                this.dirtySpaceRenderer(ctx, element, hex, camera, grid, selected);
                break;
            case "gravArrow":
                this.gravArrowRenderer(ctx, element, hex, camera, grid, selected);
                break;
            default:
                this.defaultRenderer(ctx, element, hex, camera);
            //console.error("no renderer for type " + type, element);
        }
    }

    planeteRenderer(ctx, element, hex, camera, grid) {
        const point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);
        ctx.beginFill("0xD" + element.apparence.color, 1);
        ctx.drawCircle(point.x, point.y, element.apparence.radius * camera.zoom);
        ctx.endFill();


    }

    baseRenderer(ctx, element, hex, camera, grid, selected) {
        const point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);
        let base = new PIXI.Graphics();
        if(selected){
            base.lineStyle(2, 0x777777);
        }else{
            base.lineStyle(1, 0x999999);
        }
        base.beginFill("0x" + element.apparence.color, 1);
        base.drawCircle(0, -10 * camera.zoom, element.apparence.size * camera.zoom);
        base.endFill();
        base.position.set(point.x, point.y);

        let destHex = inertiaToHex(
            element.direction,
            grid.get([element.x, element.y]),
            this.Hex
        );
        let destPoint = destHex
            .toPoint()
            .add(destHex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);

        let angle = Math.atan2(destPoint.x - point.x, point.y - destPoint.y);
        var degrees = (180 * angle) / Math.PI;
        base.angle = degrees;
        console.log(selected);
        if (selected && element.surveyRange) {
            let baseSurvey = new PIXI.Graphics();
            baseSurvey.lineStyle(1, 0x999999);
            baseSurvey.beginFill(0x999999, 0.5);
            element.surveyRange.forEach(coord => {
                let hexSurvey = this.Hex(coord.x, coord.y)
                const point = hexSurvey.toPoint();
                // add the hex's position to each of its corner points
                const corners = hexSurvey.corners().map(corner =>
                    corner
                        .add(point)
                        .multiply(camera.zoom, camera.zoom)
                        .add(camera.x, camera.y)
                );
                // separate the first from the other corners
                const [firstCorner, ...otherCorners] = corners;

                // move the "pen" to the first corner
                baseSurvey.moveTo(firstCorner.x, firstCorner.y);
                // draw lines to the other corners
                otherCorners.forEach(({ x, y }) => baseSurvey.lineTo(x, y));
                // finish at the first corner
                baseSurvey.lineTo(firstCorner.x, firstCorner.y);
            });

            baseSurvey.endFill();
            ctx.addChild(baseSurvey);
        }

        ctx.addChild(base);
    }

    dirtySpaceRenderer(ctx, element, hex, camera) {
        const point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);
        let points = [{x:-5,y:-5,size:2},{x:5,y:5,size:3},{x:-5,y:5,size:1},{x:5,y:-5,size:2},{x:0,y:0,size:2}].map(p => {
            return { x: (p.x-getDice(0, 3)), y: +(p.y-getDice(0, 3)) , size:getDice(1, 3) };
        });
        for (let p of points) {
            ctx.beginFill("0xDDDDDD", 1);
            ctx.drawCircle(point.x+(p.x*camera.zoom), point.y+(p.y*camera.zoom), p.size * camera.zoom);
            ctx.endFill();
        }
    }

    shipRenderer(ctx, element, hex, camera, grid, selected) {
        if (element.destroyed) {
            return
        }
        let ship = new PIXI.Graphics();
        let point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);

        //draw ship
        ship.lineStyle(1, 0x999999);
        ship.beginFill("0xD" + element.apparence.color, 1);
        let [start, ...points] = element.apparence.path.map(p => {
            return { x: p.x * camera.zoom, y: p.y * camera.zoom };
        });
        ship.moveTo(start.x, start.y);
        for (let p of points) {
            ship.lineTo(p.x, p.y);
        }
        ship.lineTo(start.x, start.y);
        ship.endFill();
        ship.position.set(point.x, point.y);

        let totalInertia = {
            q: element.inertia.q,
            r: element.inertia.r,
            s: element.inertia.s
        }
        for (let displacement of element.displacement || []) {
            totalInertia.q = totalInertia.q + displacement.q;
            totalInertia.r = totalInertia.r + displacement.r;
            totalInertia.s = totalInertia.s + displacement.s;
        }
        //draw rotation
        let destPoint;
        let destHex;
        if(element.landed && element.owner === this.playerUid){
            let takeoffDir = {q:0,r:0,s:0};
            let takeoff = (element.plannedActions || []).find(a=>a.type == "takeoff");
            if(element.landedDirection){
                takeoffDir = element.landedDirection;
            }else{
                if(takeoff){
                    takeoffDir = takeoff.result;
                }
            }
            
            destHex = inertiaToHex(
                takeoffDir,
                grid.get([element.x, element.y]),
                this.Hex
            );
            destPoint = destHex
                .toPoint()
                .add(destHex.center())
                .multiply(camera.zoom, camera.zoom)
                .add(camera.x, camera.y);

            let angle = Math.atan2(destPoint.x - point.x, point.y - destPoint.y);
            var degrees = (180 * angle) / Math.PI;
            ship.angle = degrees;

            if(!takeoff){
                destHex = inertiaToHex(
                    {q:0,r:0,s:0},
                    grid.get([element.x, element.y]),
                    this.Hex
                );
                destPoint = destHex
                .toPoint()
                .add(destHex.center())
                .multiply(camera.zoom, camera.zoom)
                .add(camera.x, camera.y);
            }
        }else{

            destHex = inertiaToHex(
                totalInertia,
                grid.get([element.x, element.y]),
                this.Hex
            );
            destPoint = destHex
                .toPoint()
                .add(destHex.center())
                .multiply(camera.zoom, camera.zoom)
                .add(camera.x, camera.y);

            let angle = Math.atan2(destPoint.x - point.x, point.y - destPoint.y);
            var degrees = (180 * angle) / Math.PI;
            ship.angle = degrees;
        }

        

        //check for burn maneuver
        let burn = element.plannedActions
            ? element.plannedActions.find(a => a.type == "burn" || a.type == "takeoff")
            : undefined;
        if (burn && element.owner === this.playerUid && selected) {
            let burnDestHex = grid.get([element.x, element.y]);
            if (burn.type === "burn") {
                burnDestHex = inertiaToHex({
                    q: totalInertia.q - burn.result.q,
                    r: totalInertia.r - burn.result.r,
                    s: totalInertia.s - burn.result.s
                }, burnDestHex, this.Hex);
            } else {
                let takeoffdir = element.landedDirection ? element.landedDirection : burn.result;
                burnDestHex = inertiaToHex({
                    q: totalInertia.q + takeoffdir.q,
                    r: totalInertia.r + takeoffdir.r,
                    s: totalInertia.s + takeoffdir.s
                }, burnDestHex, this.Hex);
            }
            const burnDestPoint = burnDestHex
                .toPoint()
                .add(burnDestHex.center())
                .multiply(camera.zoom, camera.zoom)
                .add(camera.x, camera.y);
            ctx.lineStyle(2 * camera.zoom, burn.type === "burn" ? 0xaaaaaa : 0xaa0000);
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(burnDestPoint.x, burnDestPoint.y);
            ctx.beginFill(0x888888, 1);
            ctx.drawCircle(burnDestPoint.x, burnDestPoint.y, 3 * camera.zoom);
            ctx.endFill();
        }


        //draw trails from previous moves
        if (selected) {
            //trajectory
            let hexBetweens = this.testgrid.hexesBetween(hex, destHex);
            ctx.lineStyle(1, 0x000000, 0.3);
            ctx.beginFill(0x000000, 0.1);
            hexBetweens.shift()
            hexBetweens.forEach(hex => {
                if (!hex) {
                    return;
                }
                const point = hex.toPoint();
                // add the hex's position to each of its corner points
                const corners = hex.corners().map(corner =>
                    corner
                        .add(point)
                        .multiply(camera.zoom, camera.zoom)
                        .add(camera.x, camera.y)
                );
                // separate the first from the other corners
                const [firstCorner, ...otherCorners] = corners;

                // move the "pen" to the first corner
                ctx.moveTo(firstCorner.x, firstCorner.y);
                // draw lines to the other corners
                otherCorners.forEach(({ x, y }) => ctx.lineTo(x, y));
                // finish at the first corner
                ctx.lineTo(firstCorner.x, firstCorner.y);
            });

            ctx.lineStyle(2 * camera.zoom, 0xff0000, 1);
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(destPoint.x, destPoint.y);
            ctx.beginFill(0xff0000, 1);
            ctx.drawCircle(destPoint.x, destPoint.y, 3 * camera.zoom);
            ctx.endFill();
            for (let trail of element.trails || []) {
                //trail
                this.trailRenderer(ctx, trail, camera, grid);
            }
        }

        ctx.addChild(ship);
    }

    gravArrowRenderer(ctx, element, hex, camera, grid, selected) {
        let arrow = new PIXI.Graphics();
        let point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);

        //draw ship
        arrow.lineStyle(1, 0x999999);
        arrow.beginFill("0xD000000", 1);
        let [start, ...points] = [
            { x: 0, y: -8 },
            { x: 5, y: -2 },
            { x: 2, y: -2 },
            { x: 2, y: 2 },
            { x: -2, y: 2 },
            { x: -2, y: -2 },
            { x: -5, y: -2 }
        ].map(p => {
            return { x: p.x * camera.zoom, y: p.y * camera.zoom };
        });
        arrow.moveTo(start.x, start.y);
        for (let p of points) {
            arrow.lineTo(p.x, p.y);
        }
        arrow.lineTo(start.x, start.y);
        arrow.endFill();
        arrow.position.set(point.x, point.y);

        //draw rotation
        let destHex = inertiaToHex(
            element.direction,
            grid.get([element.x, element.y]),
            this.Hex
        );
        let destPoint = destHex
            .toPoint()
            .add(destHex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);

        let angle = Math.atan2(destPoint.x - point.x, point.y - destPoint.y);
        var degrees = (180 * angle) / Math.PI;
        arrow.angle = degrees;

        ctx.addChild(arrow);
    }

    trailRenderer(ctx, trail, camera, grid) {
        let hex = grid.get([trail.x, trail.y]);
        const point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);
        let destHex = inertiaToHex(trail.inertia, hex, this.Hex);
        const destPoint = destHex
            .toPoint()
            .add(destHex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);

        ctx.lineStyle(2 * camera.zoom, 0x777777);
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(destPoint.x, destPoint.y);

        ctx.lineStyle(3 * camera.zoom, 0x555555);
        switch (trail.burnType) {
            case "burn":
                ctx.beginFill("0xD000000", 1);
                break;
            default:
                ctx.beginFill("0xDffffff", 1);
        }
        ctx.drawCircle(point.x, point.y, 5 * camera.zoom);
        ctx.endFill();
    }

    defaultRenderer(ctx, element, hex, camera) {
        const point = hex
            .toPoint()
            .add(hex.center())
            .multiply(camera.zoom, camera.zoom)
            .add(camera.x, camera.y);
        ctx.beginFill("0xDff0000", 1);
        ctx.drawRect(
            point.x - (5 * camera.zoom) / 2,
            point.y - (5 * camera.zoom) / 2,
            5 * camera.zoom,
            5 * camera.zoom
        );
        ctx.endFill();
    }
}

const getDice = function (min, max) {
    if (typeof max === "undefined") {
        max = min;
        min = 1;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const inertiaToHex = function (inertia, oldHex, Hex) {
    return Hex({
        q: oldHex.q + inertia.q,
        r: oldHex.r + inertia.r,
        s: oldHex.s + inertia.s
    });
};
