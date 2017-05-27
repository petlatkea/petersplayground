window.addEventListener('load', pageLoaded);

var game = {
    playing: false,
    running: false,
    stage: null,
    q: null
};

var tiles = null;
var player = null;
var enemies = null;
var items = null;

function pageLoaded() {
    createStage();

    createPreloader();
}

/* PRELOADER */

function createPreloader() {
    game.q = new createjs.LoadQueue(true);

    // TODO: Progress

    game.q.on("complete", gameLoaded);

    game.q.loadManifest([
        "js/sprites.js",
        "js/tiles.js",
        {id:"tiles", src: "tiles-01.png"},
        {id:"sprites", src: "sprites-01.png"},
        {id:"levels", src: "levels.json"}
    ]);

}

// TODO: PRELOAD PROGRESS


function gameLoaded() {
    console.log("Everything is loaded");

    // build levels
    // - for now, just use game.q.levels
    game.levels = game.q.getResult("levels");

    // prepare tiles
    game.tiles = new createjs.SpriteSheet( {
        "images": [game.q.getResult("tiles")],
        "frames": {"width":64, "height":64, "regX": 0, "regY":0},
         "animations": {
            "space":[0],
            "floor":[1],
            "bluedoor_closed": [23],
            "bluedoor_opened": [27],
            "bluedoor_open": [23,27,"bluedoor_opened"],
            "reddoor_closed": [33],
            "reddoor_opened": [37],
            "reddoor_open": [33,37,"reddoor_opened"]
        },
        "framerate": 5
    });


    // prepare sprites
    game.sprites = new createjs.SpriteSheet( {
        "images": [game.q.getResult("sprites")],
        "frames": {"width":32, "height":32, "regX": 16, "regY":16},
        "animations": {
            "p_stopped": [0],
            "p_move": [0,2],
            "guard": [10],
            "hunter": [20],
            "patroller": [30],
            "chaser": [21],
            "key": [11]
        },
        "framerate": 10
    });


    initGame();
}

function initGame() {
    // register keyboard
    window.addEventListener("keydown", keyPressed);
    window.addEventListener("keyup", keyReleased);

    game.level = 0;

    createPlayer();

    startGame();
}

/* keys */

var keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};


function keyPressed( event ) {
//    console.log("keypressed: ", event);
    if( event.key == "ArrowRight" ) {
        keys.right = true;
        event.preventDefault();
    } else if( event.key == "ArrowLeft" ) {
        keys.left = true;
        event.preventDefault();
    } else if( event.key == "ArrowUp" ) {
        keys.up = true;
        event.preventDefault();
    } else if( event.key == "ArrowDown" ) {
        keys.down = true;
        event.preventDefault();
    } else if( event.key == " ") {
        keys.space = true;
        event.preventDefault();
    }
}

function keyReleased( event ) {
//    console.log("keyreleased: ", event);
    if( event.key == "ArrowRight" ) {
        keys.right = false;
        event.preventDefault();
    } else if( event.key == "ArrowLeft" ) {
        keys.left = false;
        event.preventDefault();
    } else if( event.key == "ArrowUp" ) {
        keys.up = false;
        event.preventDefault();
    } else if( event.key == "ArrowDown" ) {
        keys.down = false;
        event.preventDefault();
    } else if( event.key == " ") {
        keys.space = false;
        event.preventDefault();
    }
}

function createStage() {
    game.stage = new createjs.Stage("canvas");
//    game.stage.removeAllChildren();

    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", ticker);
}


function createPlayer() {
    player = new Player("p_stopped");
}



function startGame() {
    buildLevel( game.level );

    game.stage.addChild( player);
    game.playing = true;
}

function levelCompleted() {
    console.log("LEVEL COMPLETED");
    game.playing = false;
    // TODO: Goto next level
    game.level++;
    game.stage.removeAllChildren();

    startGame();
}

function buildLevel( level ) {
    createTiles( level );
    createEnemies( level );
    createItems( level );

    setPlayerStart( level );
}

function setPlayerStart( level ) {
    // For now, position the player at the first Entry found in the map
    // TODO: Look for an entry-object in the tiles instead
    let map = game.levels[level].map
    for( let y=0; y < map.length; y++) {
        for( let x=0; x < map[y].length; x++ ) {
            if( map[y][x] == 8 ) {
                player.x = x*64+38 + player.w/2;
                player.y = y*64+17 + player.h/2;
                break;
            }
        }
    }
}

function createTiles( level ) {
    tiles = [];

    let map = game.levels[level].map;

    for( let y=0; y < map.length; y++) {
        tiles[y] = [];
        for( let x=0; x < map[y].length; x++ ) {

            let tile = createTile(map[y][x]);
            tile.gridX = x;
            tile.gridY = y;

            tile.x = x * 64;
            tile.y = y * 64;

            tiles[y][x] = tile;

            game.stage.addChild(tile);
        }
    }
}



function createEnemies( level ) {
    let enemylist = game.levels[level].enemies;

    enemies = [];

    if( enemylist ) {
        enemylist.forEach( data => {
            let enemy = createEnemy(data);
            game.stage.addChild(enemy);
            enemies.push( enemy );
        });
    }
}



function createEnemy( data ) {
    var enemy = null;

    switch( data.type ) {
        case "guard":
            enemy = new Guard();
            enemy.offset = data.offset;
            enemy.setGridPosition( data.grid.x, data.grid.y );
            break;
        case "patroller":
            enemy = new Patroller( data.pattern );
            enemy.offset = data.offset;
            enemy.setPosition(0);
            break;
        case "chaser":
            enemy = new Chaser();
            enemy.offset = data.offset;
            enemy.setGridPosition( data.grid.x, data.grid.y );
            break;
    }

    return enemy;
}



function createItems( level ) {
    items = [];

    let itemlist = game.levels[level].items;
    if( itemlist ) {
        itemlist.forEach( data => {
            var item = null;

            switch( data.type ) {
                case "key":
                    item = new Item("key");
                    item.h = 15;
                    item.w = 17;
                    break;
                              }

            item.x = data.grid.x*64 + data.offset.x + item.w/2;
            item.y = data.grid.y*64 + data.offset.y + item.h/2;

            game.stage.addChild( item );
            items.push(item);

        } );
    }
}


function getTileAtPixels( xpos, ypos ) {
    x = Math.floor(x/64);
    y = Math.floor(y/64);

    return getTileAt(x,y);
}

function getTileAt( x, y ) {
    return tiles[y][x];
}


function canWalkOnTile(object, xpos, ypos ) {
    let gridx = Math.floor(xpos/64);
    let gridy = Math.floor(ypos/64);

    let tile = getTileAt(gridx,gridy);
    let tileX = xpos - gridx * 64;
    let tileY = ypos - gridy * 64;

    return tile.canWalkOn(object,tileX,tileY)
}

/* return if the given position is valid for the object */
function canMoveTo( object, xpos, ypos ) {
    let validposition = true;

    // find the list of tile-coordinates that the object touches (from the given position)
    // top left
    let top = ypos-object.h/2;
    let left = xpos-object.w/2;
    let bot = ypos+object.h/2;
    let right = xpos+object.w/2;

    // find tile at x, y
    // add Relative x and y for tiles that can be partly walked on
    validposition = canWalkOnTile(object,left, top) && canWalkOnTile(object,left, bot) &&
                    canWalkOnTile(object,right, top) && canWalkOnTile(object,right, bot);

    return validposition;
}

/* called after an object has been moved - takes care of what happens then */
function movedTo(object, xpos, ypos) {
    let top = ypos-object.h/2;
    let left = xpos-object.w/2;
    let bot = ypos+object.h/2;
    let right = xpos+object.w/2;

    walkOnTile(object,left,top);
    walkOnTile(object,left,bot);
    walkOnTile(object,right,top);
    walkOnTile(object,right,bot);
}

function walkOnTile(object,xpos,ypos) {
    let gridx = Math.floor(xpos/64);
    let gridy = Math.floor(ypos/64);

    let tile = getTileAt(gridx,gridy);
    let tileX = xpos - gridx * 64;
    let tileY = ypos - gridy * 64;

    if( tile ) {
        tile.walkOn(object, tileX, tileY);
    }
}

function hitTest( objA, objB ) {
    if( objB.x-objB.regX < objA.x-objA.regX+objA.w &&
        objB.x-objB.regX+objB.w > objA.x-objA.regX &&
        objB.y-objB.regY+objB.h > objA.y-objA.regY &&
        objB.y-objB.regY < objA.y-objA.regY+objA.h ) {
        return true;
    } else {
        return false;
    }
}



function ticker( event ) {

    if( game.playing ) {



    if( player ) {
        // move player
        if( keys.left ) {
            player.moveLeft();
        } else if( keys.right ) {
            player.moveRight();
        } else

        if( keys.up ) {
            player.moveUp();
        } else if( keys.down ) {
            player.moveDown();
        } else {
            // no movement at all
            player.stopMoving();
        }
    }

    if( enemies ) {
        // move enemies, and test for collisions
        enemies.forEach( enemy => {
            enemy.move()
            // test collision with player
            if( hitTest( enemy, player) ) {
                player.hitBy( enemy );
            }
        });
    }

    if( items ) {
        // check if touching any item
        items.forEach( item => {
            if( hitTest(player, item) ) {
                player.pickUp( item );
            }
        })
    }

    }

    // update stage
    game.stage.update( event );
}
