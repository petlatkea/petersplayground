window.addEventListener('load', pageLoaded);

var game = {
    running: false,
    stage: null,
    q: null
};


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
        "frames": {"width":32, "height":32, "regX": 0, "regY":0},
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

function createPlayer() {
    game.player = new createjs.Sprite(game.sprites, "p_stopped");

}

function startGame() {

    buildLevel( game.level );

    game.stage.addChild(game.player);
}



function buildLevel( level ) {
    console.log("Build level: " + level);
    console.log( game.levels[level] );

    var map = game.levels[level].map;

    for( let y=0; y < map.length; y++) {
        for( let x=0; x < map[y].length; x++ ) {
            var tileId = map[y][x];

            switch(tileId) {
                case 0:
                    tileId = "space";
                    break;
                case 23:    // blue door
                    tileId = "bluedoor";
                    // start player position here:
                    game.player.x = x*64+32;
                    game.player.y = y*64+16;
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


function ticker( event ) {

    // move player
    if( keys.left ) {
        game.player.x--;
    } else if( keys.right ) {
        game.player.x++;
    }

    if( keys.up ) {
        game.player.y--;
    } else if( keys.down ) {
        game.player.y++;
    }



    // update stage
    game.stage.update( event );
}
