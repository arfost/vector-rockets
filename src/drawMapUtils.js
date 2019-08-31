

  var evenq_directions = [
    [[+1, +1], [+1,  0], [ 0, -1], 
     [-1,  0], [-1, +1], [ 0, +1]],
    [[+1,  0], [+1, -1], [ 0, -1], 
     [-1, -1], [-1,  0], [ 0, +1]],
]

export default function drawMap(ctx, affSize, zoom, mapInfos, mapDatas) {
    console.log(arguments)
    console.log(mapConfig)

    if(mapDatas == null){
        return;
    }
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    let hexaAngle = 0.523598776;
    let hexaSideLength = affSize.width/(mapInfos.width*1.6);

    var mapConfig = {
        hexHeight:Math.sin(hexaAngle) * (hexaSideLength ),
        hexRadius:Math.cos(hexaAngle) * (hexaSideLength ),
        hexRectangleHeight:hexaSideLength + 2 * (Math.sin(hexaAngle) * (hexaSideLength)),
        hexRectangleWidth:2 * (Math.cos(hexaAngle) * (hexaSideLength )),
        hexagonAngle:hexaAngle, // 30 degrees in radians
        sideLength:hexaSideLength,
    };
    var i,j;
    
    // ctx.fillRect(400+mapConfig.sideLength, 400+mapConfig.sideLength*0.8625, mapConfig.sideLength,mapConfig.sideLength);
    // drawHexagon(ctx, 
    //             400,
    //             400,  
    //             false,
    //             mapConfig);

    for(i = 0; i < mapInfos.height; ++i) {
        for(j = 0; j < mapInfos.width; ++j) {
            drawHexagon(
                ctx, 
                
                j * (mapConfig.sideLength + mapConfig.hexHeight),
                i * mapConfig.hexRectangleWidth + ((j % 2) * mapConfig.hexRadius),  
                false,
                mapConfig
            );
            ctx.fillText(`${j},${i}`, (j* (mapConfig.sideLength + mapConfig.hexHeight))+mapConfig.sideLength, (i* mapConfig.hexRectangleWidth + ((j % 2)* mapConfig.hexRadius)) +mapConfig.sideLength*0.8625);
        }
    }
}

function drawHexagon(ctx, x, y, hexData, mapConfig) {
    console.log("totqzdqzdo")
    ctx.beginPath();

    ctx.moveTo(x , y + mapConfig.hexRadius);

    ctx.lineTo(x + mapConfig.hexHeight, y  + mapConfig.hexRectangleWidth);
    ctx.lineTo(x + mapConfig.hexHeight + (mapConfig.sideLength) , y + mapConfig.hexRectangleWidth);
    ctx.lineTo(x + mapConfig.hexRectangleHeight, y  + mapConfig.hexRadius);
    ctx.lineTo(x + (mapConfig.sideLength) + mapConfig.hexHeight, y );
    ctx.lineTo(x + mapConfig.hexHeight, y);

    

    ctx.closePath();
    ctx.stroke();
}
