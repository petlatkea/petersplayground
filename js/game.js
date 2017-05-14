window.addEventListener('load', pageLoaded);

var game = {
    running: false,
    stage: null,
    q: null
};

var player = null;

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
            "reddoor": [33,37]
        },
        "framerate": 5
    });


    // prepare sprites
    game.sprites = new createjs.SpriteSheet( {
        "images": [game.q.getResult("sprites")],
        "frames": {"width":32, "height":32, "regX": 16, "regY":16},
        "animations": {
            "p_stopped": [0],
            "p_move": [0,2]
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
    } else if( event.key == "ArrowLeft" ) {
        keys.left = true;
    } else if( event.key == "ArrowUp" ) {
        keys.up = true;
    } else if( event.key == "ArrowDown" ) {
        keys.down = true;
    } else if( event.key == " ") {
        keys.space = true;
    }
}

function keyReleased( event ) {
//    console.log("keyreleased: ", event);
    if( event.key == "ArrowRight" ) {
        keys.right = false;
    } else if( event.key == "ArrowLeft" ) {
        keys.left = false;
    } else if( event.key == "ArrowUp" ) {
        keys.up = false;
    } else if( event.key == "ArrowDown" ) {
        keys.down = false;
    } else if( event.key == " ") {
        keys.space = false;
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
    h: 27,
    speed: 3,

    moveDown() {
        this.move(0,player.speed);
    },

    moveUp() {
        this.move(0,-player.speed);
    },

    moveLeft() {
        this.move(-player.speed,0);
    },

    moveRight() {
        this.move(player.speed,0);
    },

    move( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.x += xoffset;
            this.y += yoffset;
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
    console.log("Build level: " + level);
    console.log( game.levels[level] );

    game.map = [];

    var map = game.levels[level].map;

    for( let y=0; y < map.length; y++) {
        game.map[y] = [];
        for( let x=0; x < map[y].length; x++ ) {
            var tileId = map[y][x];

            // TODO: modify id for some tiles
            game.map[y][x] = tileId;

            switch(tileId) {
                case 0:
                    tileId = "space";
                    break;
                case 23:    // blue door
                    tileId = "bluedoor";
                    // start player position here:
                    player.x = x*64+32 + player.w/2;
                    player.y = y*64+16 + player.h/2;
                    break;
                case 33:
                    tileId = "reddoor";
                    break;
            }


            // create sprite for this type of tile
            var tile = new createjs.Sprite(game.tiles, tileId);

            if( Number.isInteger(tileId) ) {
                tile.gotoAndStop(tileId);
            }
            tile.x = x * 64;
            tile.y = y * 64;
            game.stage.addChild(tile);
        }
    }
}

function getTileAt( x, y ) {
    x = Math.floor(x/64);
    y = Math.floor(y/64);

    return game.map[y][x];
}

function canWalkOnTile( tile ) {
    let canwalk = true;

    switch( tile ) {
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

        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
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

    // TODO: add Relative x and y for tiles that can be partly walked on
    validposition = canWalkOnTile( getTileAt(left, top) ) && canWalkOnTile( getTileAt(left, bot) ) &&
        canWalkOnTile( getTileAt(right, top) ) && canWalkOnTile( getTileAt(right, bot) );

    return validposition;
}

function ticker( event ) {

    // move player
    if( keys.left ) {
        player.moveLeft();
    } else if( keys.right ) {
        player.moveRight();
    }

    if( keys.up ) {
        player.moveUp();
    } else if( keys.down ) {
        player.moveDown();
    }



    // update stage
    game.stage.update( event );
}
