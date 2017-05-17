window.addEventListener('load', pageLoaded);

var game = {
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
            "bluedoor": [23],
            "bluedoor_open": [27],
            "reddoor": [33],
            "reddoor_anim": [33,37,"reddoor_open"],
            "reddoor_open": [37]
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

var Player = {
    x: 0,
    y: 0,
    w: 19,
    h: 24,
    speed: 3,
    direction: "left",

    stopMoving() {

    },

    hitBy( opponent ) {
      console.log("Auch, I'm hit");
    },

    pickUp( item ) {
        if( ! this.items ) {
            this.items = [];
        }

        this.items.push(item);
        item.pickedUp();
    },

    useItemOn(item, other) {

        // some objects can take the item from you - if they have the appropiate method
        if( other.useItem ) {
            if( other.useItem(item) ) {
                // item sticks to other
                other.pickUp(item);
                this.items.splice( this.items.indexOf(item), 1);
            }
        }

    },

    getItem( itemName ) {
        if( this.items ) {
            return this.items.find( item => item.type == itemName );
        }
        return undefined;
    },

    moveDown() {
        this.turn("down");
        this.move(0,player.speed);
    },

    moveUp() {
        this.turn("up");
        this.move(0,-player.speed);
    },

    moveLeft() {
        this.turn("left");
        this.move(-player.speed,0);
    },

    moveRight() {
        this.turn("right");
        this.move(player.speed,0);
    },

    move( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.x += xoffset;
            this.y += yoffset;

            movedTo(this, this.x, this.y);
        }
    },

    turn( direction ) {
        if( this.direction != direction ) {
            let rotation = this.rotation;
            if( direction == "left") {
                rotation = 180;
            } else if(direction == "right") {
                rotation = 0;
            } else if(direction == "down") {
                rotation = 90;
            } else if(direction == "up") {
                rotation = -90;
            }

            // fix rotation turning more than necessary
            if( rotation-this.rotation < -180 ) {
                rotation = 360+rotation;
            }

            createjs.Tween.get(this).to({rotation: rotation}, 200);

            this.direction = direction;
        }
    }


}

class Item extends createjs.Sprite {
    constructor( spritename ) {
        super(game.sprites, spritename);
        this.type = spritename;
    }

    pickedUp() {
        console.log("Picked up " + this.type);
        // move outside of stage
        createjs.Tween.get(this)
            .to({x:game.stage.getBounds().width, y:game.stage.getBounds().height}, 1000 )
            .call( function() { game.stage.removeChild(this) });
    }


}


class Enemy extends createjs.Sprite {
    constructor( spritename ) {
        super(game.sprites, spritename);
        this.w = 16;
        this.h = 24;
        this.speed = 1;
    }

    move() {
        if(!this.moveTo( this.speed, 0 ) ) {
            this.speed = -this.speed;
        }
    }

    moveTo( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.x += xoffset;
            this.y += yoffset;
            return true;
        } else {
            return false;
        }
    }
}



function createPlayer() {
    player = new createjs.Sprite(game.sprites, "p_stopped");

    Object.assign(player, Player);
}



function startGame() {
    buildLevel( game.level );

    game.stage.addChild( player);
}

function buildLevel( level ) {
    createTiles( level );
    createEnemies( level );
    createItems( level );
}

function createTiles( level ) {
    tiles = [];

    var map = game.levels[level].map;

    for( let y=0; y < map.length; y++) {
        tiles[y] = [];
        for( let x=0; x < map[y].length; x++ ) {
            var tileId = map[y][x];

            switch(tileId) {
                case 0:
//                    tileId = "space";
                    break;
                case 23:    // blue door
//                    tileId = "bluedoor";
                    // start player position here:
                    player.x = x*64+38 + player.w/2;
                    player.y = y*64+17 + player.h/2;
                    break;
                case 33:
//                    tileId = "reddoor";
                    break;
            }


            // create sprite for this type of tile
            var tile = new createjs.Sprite(game.tiles, tileId);

            if( Number.isInteger(tileId) ) {
                tile.gotoAndStop(tileId);
            }
            tile.x = x * 64;
            tile.y = y * 64;

            tile.type = tileId;

            tiles[y][x] = tile;

            game.stage.addChild(tile);
        }
    }
}

function createEnemies( level ) {
    let enemylist = game.levels[level].enemies;

    enemies = [];

    enemylist.forEach( data => {
        let enemy = createEnemy(data);
        game.stage.addChild(enemy);
        enemies.push( enemy );
    });
}

function createEnemy( data ) {
    var enemy = null;

    if( data.type == "guard") {
        enemy = new Enemy("guard");
        enemy.x = data.grid.x*64 + data.offset.x + enemy.w/2;
        enemy.y = data.grid.y*64 + data.offset.y + enemy.h/2;
    }

    return enemy;
}


function createItems( level ) {
    items = [];

    let itemlist = game.levels[level].items;
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

    } )
}


function getTileAtPixels( xpos, ypos ) {
    x = Math.floor(x/64);
    y = Math.floor(y/64);

    return getTileAt(x,y);
}

function getTileAt( x, y ) {
    return tiles[y][x];
}


function canWalkOnTile( xpos, ypos ) {
    let canwalk = true;

    let gridx = Math.floor(xpos/64);
    let gridy = Math.floor(ypos/64);

    let tile = getTileAt(gridx,gridy);
    let tileX = xpos - gridx * 64;
    let tileY = ypos - gridy * 64;


    switch( tile.type ) {
            // plain floor
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 14:
        case 15:
        case 16:
        case 17: canwalk = true;
            break;
            // doors - only partly walkable (requires relative x and y pos)
        case 23:

        case 24:
        case 25:
        case 26:
        case 27:
            canwalk = tileY>16 && tileY<48;
            break;
        case 33:
            canwalk = tileY>16 && tileY<48 && tileX<24;
            break;

        case 34:
        case 35:
        case 36:
        case 37:
            canwalk = tileY>16 && tileY<48;
            break;
        // partly blocked
        case 43: // 24 top left
            canwalk = tileX>24 && tileY>24;
            break;
        case 44:
            canwalk = tileX<40 && tileY>24;
            break;
        case 45: // 24X 32Y
            canwalk = tileX<25 && tileY>32 || tileX>24;
            break;
        case 46:
            canwalk = tileX<40 || tileY>32;
            break;
        case 47:
            canwalk = tileY>24;
            break;
        case 48:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 58:
            canwalk = true;
            break;

        default:
            canwalk = false;
    }

    return canwalk;
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
    validposition = canWalkOnTile(left, top) && canWalkOnTile(left, bot) &&
                    canWalkOnTile(right, top) && canWalkOnTile(right, bot);

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

    switch( tile.type ) {
        case 33: // red door
            // unlock if object has a key
            let key = object.getItem("key");
            if( key ) {
                object.useItemOn(key, tile);
                console.log("Opened door with key");
                // replace sprite
                tile.gotoAndPlay("reddoor_anim");
                tile.type = 37;
            } else {
                console.log("Need a key to open door");
            }

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


    // update stage
    game.stage.update( event );
}
