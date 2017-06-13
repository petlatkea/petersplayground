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
    // TODO: Initialize game object

    // register keyboard and/or gamepad
    game.controller = new Controller();

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
    game.level = 0;

    createStatus();

    createPlayer();

    startGame();
}

class Controller {

    constructor() {
        this.TYPE_KEYBOARD = { type: "keyboard", index: 0};
        this.TYPE_GAMEPAD = { type: "gamepad", index: 0};

        this.hasGamePads = false;
        this.preferredController = this.TYPE_KEYBOARD;

        this.registerEvents();

        // the controls-object always contains the current state of the controls,
        // from the current preferred controller - they are read in the ticker!
        this.controls =  {
            left: false,
            right: false,
            up: false,
            down: false,
            fire: false
        }
    }


    registerEvents() {
        window.addEventListener("keydown", this);
        window.addEventListener("keyup", this);

        window.addEventListener("gamepadconnected", this);
        window.addEventListener("gamepaddisconnected", this);

        // scan for gamepads every half second
        let ctrl = this;
        setInterval( function() { ctrl.scanForGamePads(); }, 500);
    }


    handleEvent( event ) {
        switch(event.type) {
            case "gamepadconnected":
                // find available gamepads
                // NOTE: In Chrome, this event is sometimes fired when a gamepad disconnects
                this.scanForGamePads();
                break;
            case "gamepaddisconnected":
                // find available gamepads, if any
                this.scanForGamePads();
                break;
            case "keydown":
                this.handleKey(event, true);
                break;

            case "keyup":
                this.handleKey(event, false);
                break;
        }
    }


    handleKey(event, active) {
        let preventDefault = true;
        switch(event.key) {
            case "ArrowRight":
                this.controls.right = active;
                break;
            case "ArrowLeft":
                this.controls.left = active;
                break;
            case "ArrowUp":
                this.controls.up = active;
                break;
            case "ArrowDown":
                this.controls.down = active;
                break;
            case " ":
                this.controls.fire = active;
                break;
            default:
                preventDefault = false;
        }
        if( preventDefault ) {
            event.preventDefault();
            this.preferredController = this.TYPE_KEYBOARD;
        }
    }


    handleGamepad() {
        // if the preferred controller is a gamepad, then check that for states
        // if not, then scan any gamepads for activity, that might make them preferred
        if( this.preferredController.type == "gamepad" ) {
            let gamepad = navigator.getGamepads()[this.preferredController.index];
            if(gamepad) {

                // check axes on this gamepad
                this.controls.left = gamepad.axes[0] < -0.5;
                this.controls.right = gamepad.axes[0] > 0.5;
                this.controls.up = gamepad.axes[1] < -0.5;
                this.controls.down = gamepad.axes[1] > 0.5;

                // check buttons (only fire-button for now)
                this.controls.fire = gamepad.buttons[0].pressed;

            } else {
                // preferred gamepad has been disconnected
                this.scanForGamePads();
                this.preferredController = this.TYPE_KEYBOARD;
            }
        } else {
            // no preferred gamepad yet - but if any is active, make it preferred
            let gamepads = navigator.getGamepads();
            for (let idx = 0; idx < gamepads.length; idx++) {
                let gamepad = gamepads[idx];
                if (gamepad != null) {

                    // scan all the buttons
                    gamepad.buttons.forEach(button => {
                        if (button.pressed) {
                            // this gamepad becomes the preferred one!
                            this.preferredController = {type: "gamepad", index: idx};
                        }
                    });
                }
            }
        }
    }


    // scan for available gamepads, used on events as well as polling
    scanForGamePads() {
        this.hasGamePads = false;
        let foundpads = navigator.getGamepads ? navigator.getGamepads() : [];

        // loop through the pads, if any are not null, then note that we have gamepads!
        // the foundpads might be an object, so we cant use foreach
        for(let i=0; i<foundpads.length; i++) {
            if( foundpads[i] != null ) {
                this.hasGamePads = true;
            }
        }

        if(!this.hasGamePads) {
            this.preferredController = this.TYPE_GAMEPAD;
        }
    }
}


function createStage() {
    game.stage = new createjs.Stage("canvas");

    createjs.Ticker.setFPS(game.FPS);
    createjs.Ticker.on("tick", ticker);
}

function createStatus() {
    const height = 22;
    const margin = 4;

    const FONT = height + "px bioliquid";
    const COLOR = "#eae0a7";

    game.status = new createjs.Stage("status");
    const bottom = game.status.canvas.height;

    // create fixed texts
    let text = new createjs.Text("Health", FONT, COLOR);
    text.x = margin;
    text.y = bottom-margin-height;
    game.status.addChild(text);

    const left = text.getMeasuredWidth();

    text = new createjs.Text("Items", FONT, COLOR);
    text.x = 500;
    text.y = bottom-margin-height;
    game.status.addChild(text);

    text = new createjs.Text("Level", FONT, COLOR);
    text.x = 4;
    text.y = bottom-height*2-margin;
    game.status.addChild(text);

    text = new createjs.Text("Score", FONT, COLOR);
    text.x = 500-14;
    text.y = bottom-height*2-margin;
    game.status.addChild(text);

    // create dynamic texts
    let levelNr = new createjs.Text("MM", FONT, "#FFFFFF");
    levelNr.x = left+height;
    levelNr.y = bottom-height*2-margin;
    levelNr.textAlign = "right";
    game.status.addChild(levelNr);

    let levelName = new createjs.Text("Her WWWWWW", FONT, "#FFFFFF");
    levelName.x = levelNr.x + levelNr.getMeasuredWidth()-30;
    levelName.y = levelNr.y;
    levelName.textAlign = "left";
    game.status.addChild(levelName);

    let scoreText = new createjs.Text("000008", FONT, "#FFFFFF");
    scoreText.x = 640-margin;
    scoreText.y = levelNr.y;
    scoreText.textAlign = "right";
    game.status.addChild(scoreText);

    // create healthbar
    let g = new createjs.Graphics();
    g.beginLinearGradientFill(["#ff0000","#ffb100","#00ff00"], [0.05, 0.4, 1], 0, 0, 400, 0);
    let bar = g.rect(0,0,400,height-margin).command;
    let healthBar = new createjs.Shape(g);
    healthBar.y = bottom-height;
    healthBar.x = left+height/2+margin;
    game.status.addChild(healthBar);

    // store dynamic texts in game-object
    game.statusTexts = {
        nr: levelNr,
        name: levelName,
        score: scoreText,
        itemY: bottom-height+10,
        health: bar
    };

    createjs.Ticker.on("tick", statusTicker);
}

function updateStatus() {
    // update levelNr
    game.statusTexts.nr.text = game.levels[game.level].nr;

    // update level text
    game.statusTexts.name.text = game.levels[game.level].name;

    // update items - if any
    if( player.items ) {
        player.items.forEach((item,index) => {
            // if item isn't on any stage, add it to this
            if(!item.stage) {
                game.status.addChild(item);
                item.x = 560 + index*18;
                item.y = game.statusTexts.itemY;
            }
        });
    }

    // TODO: update score

    // update health (health is 0-100, bar is 0-400)
    game.statusTexts.health.w = player.health*4;

}

function createPlayer() {
    player = new Player("p_stopped");
}



function startGame() {
    game.stage.removeAllChildren();

    buildLevel( game.level );

    buildStars();

    game.stage.addChild( player);

    resetCamera();

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


var starfields = [];

function buildStars() {
    // Big part of the starfield code is inspired by:
    // https://www.igorkromin.net/index.php/2013/05/13/generate-a-nice-looking-star-field-with-easeljs-and-html5-canvas/
    // especially the size-decision

    // create star-container for all star-fields
    let container = new createjs.Container();

    let speeds = [.1,.05,.02,.01];

    // create 4 star fields (Shape), and add them to the container
    for( let i=0; i<4; i++ ) {
        starfields[i] = new createjs.Shape();
        starfields[i].speed = speeds[i];
        container.addChild(starfields[i]);
    }

    // create stars, position them randomly on the 4 fields
    const s_width = Math.max(game.stage.getBounds().width, game.stage.canvas.width);
    const s_height = Math.max(game.stage.getBounds().height, game.stage.canvas.height);

    // create 5 stars pr tile
    let count = s_width/64 * s_height/64 *5;
    console.log("Create %d stars", count);

    // different random colors
    let colors = ["#d3e6ff", "#ffffff", "#fff28b", "#c7f4fa", "#9eb3e3"];

    for( let i=0; i <count; i++) {
        let type = Math.floor(Math.random()*4);

        let sizecat = Math.random();
        let size = 3;
        if( sizecat < .9 ) {
            // small
            size = 1+Math.random()*3;
        } else {
            // large
            size = 3 + Math.random()*4;
            // large stars are always the slowest type
            type = speeds.length-1;
        }

        // create each star as a polystar
        starfields[type].graphics.beginFill(colors[Math.floor(Math.random()*colors.length)]).drawPolyStar(
            Math.random()*(s_width-size),
            Math.random()*(s_height-size),
            size,
            5 + Math.round(Math.random() * 2), // number of sides
            0.9, // pointyness
            Math.random() * 360 // rotation of the star
        );
    }

    // remember the current size of the starfields
    let bounds = container.getBounds();

    // before adding their clones next to them ...
    for( let i=0; i<4; i++ ) {
        // cache
        starfields[i].cache(0,0, s_width, s_height);

        // create clone
        starfields[i].myclone = starfields[i].clone(false);
        starfields[i].myclone.x = starfields[i].getBounds().width;
        container.addChild(starfields[i].myclone);
    }

    container.setBounds(bounds);

    // add the starfields before anything else
    game.stage.addChildAt(container,0);
}

function moveStars() {
    const s_width = Math.max(game.stage.getBounds().width, game.stage.canvas.width);
    const s_height = Math.max(game.stage.getBounds().height, game.stage.canvas.height);

    // move starfields at their individual speeds
    starfields.forEach( starfield => {
        starfield.x-=starfield.speed;
        starfield.myclone.x-=starfield.speed;
        if( starfield.x < -s_width ) {
            starfield.x = s_width;
        }
        if( starfield.myclone.x < -s_width ) {
            starfield.myclone.x = s_width;
        }

    })
}


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
    let x = Math.floor(xpos/64);
    let y = Math.floor(ypos/64);

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

// CAMERA

function resetCamera() {
    game.stage.regX = 0;
    game.stage.regY = 0;
}


function moveCamera() {
    const xoffset = player.x-game.stage.regX;
    const yoffset = player.y-game.stage.regY;

    const xmargin = 192;
    const ymargin = 192;

    const c_height = game.stage.canvas.height;
    const s_height = game.stage.getBounds().height;

    const c_width = game.stage.canvas.width;
    const s_width = game.stage.getBounds().width;


    if( xoffset > c_width-xmargin && game.stage.regX <= s_width-c_width-player.speed ) {
        game.stage.regX+=player.speed;
    } else if( xoffset < xmargin && game.stage.regX > 0 ) {
        game.stage.regX-=player.speed;
    }


    if( yoffset > c_height-ymargin && game.stage.regY <= s_height-c_height-player.speed ) {
        game.stage.regY+=player.speed;
    } else if( yoffset < ymargin && game.stage.regY > 0) {
        game.stage.regY-=player.speed;
    }

}


function ticker( event ) {

    if( game.controller.hasGamePads ) {
        game.controller.handleGamepad();
    }

    if( game.playing ) {

        if( player ) {
            // move player
            if( game.controller.controls.left ) {
                player.moveLeft();
            } else if( game.controller.controls.right ) {
                player.moveRight();
            } else

            if( game.controller.controls.up ) {
                player.moveUp();
            } else if( game.controller.controls.down ) {
                player.moveDown();
            } else {
                // no movement at all
                player.stopMoving();
            }
        }

        moveCamera();

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
                if( item.canPickUp && hitTest(player, item) ) {
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

        moveStars();
    }



    // update stage
    game.stage.update( event );
}

function statusTicker(event) {
    // update status
    updateStatus();
    game.status.update( event );
}
