window.addEventListener('load', pageLoaded);

var game = {
    FPS: 60,
    playing: false,
    running: false,
    stage: null,
    q: null
};

var tiles = null;
var nodes = null;
var player = null;
var enemies = null;
var items = null;
var shots = null;

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
//        "js/sprites.js",
//        "js/enemies.js",
//        "js/tiles.js",
        {id:"tilesprites", src: "tiles.json", type:"spritesheet"},
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
    game.tiles = game.q.getResult("tilesprites");

    // prepare sprites
    // TODO: Move spritesheet to JSON
    game.sprites = new createjs.SpriteSheet( {
        "images": [game.q.getResult("sprites")],
        "frames": {"width":32, "height":32, "regX": 16, "regY":16},
        "animations": {
            "p_stopped": [0],
            "p_move": [0,2],
            "guard": [10],
            "hunter": [20],
            "patroller": [30],
            "traveller": [31],
            "chaser": [21],
            "sentry":[22],
            "key": [11],
            "shot_double": [1],
            "shot_single": [2],
            "electricity": {
              "frames": [3,4,5]
            },
            "hunter_neutral": [20],
            "hunter_searching": {
                "frames": [25,26,27,28,29,28,27,26]
                },
            "hunter_chasing": {
                "frames": [35,36]
            }
        },
        "framerate": 5
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

    let canvas = document.querySelector("#canvas");
    game.stage.width = canvas.width;
    game.stage.height = canvas.height;

    createjs.Ticker.setFPS(game.FPS);
    createjs.Ticker.on("tick", ticker);
}


function createPlayer() {
    player = new Player("p_stopped");
}



function startGame() {
    game.stage.removeAllChildren();

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

    document.title = game.levels[level].nr + ": " + game.levels[level].name;

    createTiles( level );
    createNodeGraph( level );

    createEnemies( level );
    createItems( level );

    shots = [];

    setPlayerStart( level );

    // Debugging
    dots = new createjs.Graphics();
    game.stage.addChild( new createjs.Shape(dots));
}

var dots = null;

function setPlayerStart( level ) {
    // Find the first Entry object in the tiles - position the player there
    for( let y=0; y<tiles.length; y++) {
        for( let x=0; x<tiles[y].length; x++) {
            if( tiles[y][x] instanceof Entry ) {
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

class Node {
    constructor( id, x, y ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.connections = [];
    }

    connectTo( otherNode ) {
        if( this.connections.indexOf( otherNode ) != -1 ) {
//            console.log(this.id + " is already connected to " + otherNode.id);
        } else {
            this.connections.push( otherNode );
            otherNode.connectTo( this );
        }
    }
}

function getNodeWithId( id ) {
    return nodes.find( node => node.id == id);
}

function createNodeGraph( level ) {
    nodes = [];

    if( game.levels[level].nodes ) {

        // pass over all the nodes two times: 1 create nodes, 2 create connections
        let nodedefs = game.levels[level].nodes;
        // pass 1
        nodedefs.forEach( nodedef => {
            let node = new Node(nodedef.id, nodedef.x, nodedef.y);
            nodes.push(node);
        });

        // pass 2
        nodedefs.forEach( nodedef => {
            let node = getNodeWithId(nodedef.id);
            nodedef.connections.forEach( connect => {
                let connected = getNodeWithId(connect);
                node.connectTo( connected );
            });
        });
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
    x = Math.floor(xpos/64);
    y = Math.floor(ypos/64);

    return getTileAt(x,y);
}

function getTileAt( x, y ) {
    return tiles[y][x];
}


/* return if the given position is valid for the object */
function canMoveTo( object, xpos, ypos ) {
    let validposition = true;

    // find the list of tile-coordinates that the object touches (from the given position)
    // find leftmost, rightmost, top and bottom tile
    let leftTile = Math.floor((xpos-object.w/2)/64);
    let rightTile = Math.floor((xpos+object.w/2)/64);
    let topTile = Math.floor((ypos-object.h/2)/64);
    let bottomTile = Math.floor((ypos+object.h/2)/64);

    for( let x=leftTile; x <= rightTile; x++ ) {
        for( let y=topTile; y <= bottomTile; y++ ) {
            let tile = getTileAt(x,y);
            validposition = validposition & tile.canWalkOn(object, xpos-tile.x, ypos-tile.y );
        }
    }

    return validposition;
}

/* called just before an object is being moved - takes care of what happens then */
function movedTo(object, xpos, ypos) {
    let leftTile = Math.floor((xpos-object.w/2)/64);
    let rightTile = Math.floor((xpos+object.w/2)/64);
    let topTile = Math.floor((ypos-object.h/2)/64);
    let bottomTile = Math.floor((ypos+object.h/2)/64);

    let oldTiles = object.tiles;
    object.tiles = [];

    for( let x=leftTile; x <= rightTile; x++ ) {
        for( let y=topTile; y <= bottomTile; y++ ) {
            let tile = getTileAt(x,y);
            tile.walkOn(object, xpos-tile.x, ypos-tile.y );
            object.tiles.push(tile);
        }
    }

    // track changes to tiles
    if( oldTiles ) {
        oldTiles.forEach( tile => {
            // if this tile doesn't exist in the new array, we have left a tile
            if(object.tiles.indexOf(tile) == -1) {
                tile.walkOff(object, xpos-tile.x, ypos-tile.y);
            }
        })
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

function createShot(startX, startY, direction, type) {
    let shot = new Shot(type);

    shot.setPosition(startX, startY);
    shot.setDirection(direction);

    game.stage.addChild(shot);

    shots.push(shot);
}

function removeShot( shot ) {
    shots.splice(shots.indexOf(shot),1);
    game.stage.removeChild(shot);
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

        if( shots ) {
            shots.forEach( shot => {
                shot.move();
                // TODO: enemy hittest - maybe enemies should hurt eachother ... or themselves
                if( hitTest( shot, player) ) {
                    player.hitBy( shot );
                    removeShot(shot);
                }
            });
        }

    }

    // update stage
    game.stage.update( event );
}
