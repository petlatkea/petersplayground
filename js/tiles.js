function createTile(type) {
    var tile = null;

    // NOTE: The numbers used here are LEVEL-design numbers.
    //       They are not sprite-positions, and given the improved spritesheet,
    //       they hardly ever match, so please don't expect them to
    switch(type) {
        case 10: tile = new Space();
                 break;
        // plain floor
        case 11: tile = new Floor();
                 break;
        // floor with direction
        case 12:
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
            tile = new Road({12:"NS",13:"EW",14:"ESW",15:"NEW",16:"ES",17:"SW",
                              23:"NESW",24:"NES",25:"NSW",26:"NE",27:"NW"}[type]);
                 break;
        // active floor - with light
        case 28:
            tile = new FloorLight();
            break;

        // uni-directional floors
        case 39: tile = new FloorOnlyLeft();
            break;
        case 49: tile = new FloorOnlyRight();
            break;
        case 59: tile = new FloorOnlyUp();
            break;
        case 69: tile = new FloorOnlyDown();
            break;


        // plain walls
        case 31: tile = new Wall();
            break;

        case 20:
        case 21:
        case 22:
        case 30:
        case 32:
        case 40:
        case 41:
        case 42:
        case 50:
        case 51:
        case 52:
        case 60:
        case 61:
        case 62:
            let directions = {20: "ES", 21: "EW", 22: "SW", 30: "NS", 32: "NSW", 40: "NE",
                            41: "ESW", 42: "NW", 50: "E", 51:"W", 52:"S", 60:"NEW", 61:"NES",
                            62:"N"};

            tile = new Wall(directions[type]);
            break;

        // entry and exit
        case 18: tile = new Entry();
                break;
        case 19: tile = new Exit();
                break;

        // partly blocked
        case 53: // 24 top left
            tile = new P24TopLeftCorner();
            break;
        case 54:
            tile = new P24TopRightCorner();
            break;
        case 55: // 24X 32Y
            tile = new P24TopLeft();
            break;
        case 56:
            tile = new P24TopRight();
            break;
        case 57:
            tile = new P24Top();
            break;
        case 63:
            tile = new P24BottomLeftCorner();
            break;
        case 64:
            tile = new P24BottomRightCorner();
            break;

        // doors - only partly walkable (requires relative x and y pos)
        case 33: tile = new Door("blue", "closed", "keep");
                 break;

        case 34: tile = new Door("blue", "closed", "auto");
                 break;

        case 43: tile = new Door("red", "closed", "keep");
                 break;

        case 44: tile = new Door("blue", "closed", "auto");
                 break;

        default:
            console.warn("Unknown tile type: " + type);
            tile = new Tile(type);
    }

    return tile;
}

class Tile extends createjs.SpriteContainer {
    constructor(basic, overlay) {
        super(game.tiles);

        // create basic sprite
        this.sprite = new createjs.Sprite(this.spriteSheet, basic);
        this.addChild(this.sprite);
        this.type = basic;

        // create overlay if specified
        if( overlay ) {
            this.overlay = new createjs.Sprite(this.spriteSheet, overlay);
            this.addChild(this.overlay);
            this.type = overlay;
        }

        this.walkable = true;
    }

    // helper method for rotating overlay
    rotate(direction) {
        let rotation = direction;
        switch(direction) {
            case "left": rotation = 180;
                break;
            case "right": rotation = 0;
                break;
            case "up": rotation = -90;
                break;
            case "down": rotation = 90;
                break;
        }

        this.overlay.regX = 32;
        this.overlay.regY = 32;
        this.overlay.x = 32;
        this.overlay.y = 32;
        this.overlay.rotation = rotation;

    }


    canWalkOn(object,xoffset,yoffset) {
        return this.walkable;
    }

    walkOn(object,xoffset, yoffset) {
        // nothing usually happens here - implement function in subclasses, if necessary
    }

    walkOff(object,xoffset, yoffset) {
        // called whenever an object leaves this tile
    }

    // decorator-methods for sprite-handling
    // handles the overlay by default (if it exists)
    gotoAndPlay( frameOrAnimation ) {
        if( this.overlay ) {
            this.overlay.gotoAndPlay(frameOrAnimation);
        } else {
            this.sprite.gotoAndPlay(frameOrAnimation);
        }
    }

    gotoAndStop( frameOrAnimation ) {
        if( this.overlay ) {
            this.overlay.gotoAndStop(frameOrAnimation);
        } else {
            this.sprite.gotoAndStop(frameOrAnimation);
        }
    }

    addEventListener(type, listener, useCapture) {
        super.addEventListener(type, listener, useCapture);
        if(this.overlay) {
            this.overlay.addEventListener(type,listener,useCapture);
        } else {
            this.sprite.addEventListener(type,listener,useCapture);
        }
    }

    removeEventListener(type, listener, useCapture) {
        super.removeEventListener(type, listener, useCapture);
        if(this.overlay) {
            this.overlay.removeEventListener(type,listener,useCapture);
        } else {
            this.sprite.removeEventListener(type,listener,useCapture);
        }
    }


}

class Space extends Tile {
    constructor() {
        super("space");
        this.walkable = true;
    }
}

class Floor extends Tile {
    constructor(type) {
        let spritename = "floor";
        if(type) {
            spritename+="_"+type;
        }
        super(spritename);
        this.walkable = true;
    }
}

class Road extends Tile {
    constructor(direction) {
        let spritename = direction;
        let rotation = 0;
        switch (direction) {
            case "NS":
                break;
            case "EW":
                rotation = 90;
                break;
            case "ESW":
                rotation = 90;
                break;
            case "NEW":
                rotation = -90;
                break;
            case "NSW":
                rotation = 180;
                break;
            case "NES":
                rotation = 0;
                break;
            case "ES": rotation = 0;
                break;
            case "SW":
                rotation = 90;
                break;
            case "NE":
                rotation = -90;
                break;
            case "NW":
                rotation = 180;
                break;
            case "NESW":
                rotation = 0;
                break;

        }

        spritename = "road_"+spritename;

        // create basic floor and road-pattern
        super("floor", spritename);
        // rotate pattern in the desired direction
        this.rotate(rotation);
    }
}

class FloorLight extends Tile {
    constructor() {
        super("floor", "floor_light_off");
        this.turnedOn = false;

        // keep track on all the objects on this tile
        this.objectsOn = [];

        this.walkable = true;
    }

    turnOn() {
        this.turnedOn = true;
        this.gotoAndStop("floor_light_on");
    }

    turnOff() {
        this.turnedOn = false;
        this.gotoAndStop("floor_light_off");
    }

    // Walk on - something happens!
    walkOn(object,xoffset, yoffset) {
        if( xoffset > 4 && xoffset < 60 && yoffset > 4 && yoffset < 60) {

            if( this.objectsOn.indexOf(object) == -1 ) {
                this.objectsOn.push(object);
            }

            if(!this.turnedOn) {
                this.turnOn();
            }
        }
    }

    walkOff(object,xoffset, yoffset) {
        this.objectsOn.splice(this.objectsOn.indexOf(object),1);
        // only turn off, if all objects on the tile has gone
        if( this.turnedOn && this.objectsOn.length == 0) {
            this.turnOff();
        }
    }

}


class Wall extends Tile {
    constructor(direction) {
        let spritename = "wall";
        if(direction) {
            spritename+="_"+direction;
        }
        super(spritename);
        this.walkable = false;
    }
}

class Entry extends Tile {
    constructor() {
        super("floor", "entry");
    }

    canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;

        if( (xoffset-object.w/2)>8 && yoffset-object.h/2>8 && yoffset+object.h/2<64-8) {
            canWalk = true;
        }

        return canWalk;
    }
}

class Exit extends Tile {
    constructor( type ) {
        super("floor", "exit");
        this.triggered = false;
    }

     canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;

        if( xoffset+object.w/2<64-8 && yoffset-object.h/2>8 && yoffset+object.h/2<64-8) {
            canWalk = true;
        }

        return canWalk;
    }

    walkOn(object,xoffset,yoffset) {
        if( !this.triggered && object == player && xoffset>16 && xoffset<64-8-16 && yoffset>16 && yoffset<64-16 ) {
            this.triggered = true;
            levelCompleted();
        }
    }

}

class Door extends Tile {
    constructor( color, state="closed", type="keep" ) {
        super("floor", color + "door_" + state);

        if( color == "blue" ) {
            this.locked = false;
        } else {
            this.locked = true;
        }

        this.color = color;
        this.autoclose = type == "auto";
        this.closed = state == "closed";
    }

    canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;
        if( !this.closed || xoffset+object.w/2<28 || xoffset-object.w/2>34 ) {
            canWalk = true;
        }
        return canWalk;
    }

    open() {
        var thisdoor = this;
        thisdoor.addEventListener("animationend", opened);
        thisdoor.gotoAndPlay(this.color + "door_opening");

        function opened() {
            // console.log("Door is opened");
            thisdoor.removeEventListener("animationend", opened);
            thisdoor.closed = false;
        }
    }

    close() {
        var thisdoor = this;
        thisdoor.gotoAndPlay(this.color + "door_closing");
        // Mark the door as closed immediately - to avoid players getting stuck inside it
        thisdoor.closed = true;
    }



    walkOn(object,xoffset,yoffset) {
        if( this.closed && xoffset+object.w/2> 20 && xoffset-object.w/2 < 64-20 ) {
            // console.log("try to open door");
            if(!this.locked) {
                // console.log("Unlocked - just open it")
                // run open animation
                this.open();
            } else {
                // locked - try to unlock it
                // console.log("Locked - try to unlock");
                let key = object.getItem("key");
                if( key ) {
                    object.useItemOn(key, this);
                    this.locked = false;
                    // console.log("Unlocked door with key");
                    this.open();
                } else {
                    console.log("need a key to unlock this door");
                }
            }
        } else {
            // TODO: You shouldn't be able to close a door if someone else is standing in it!

            // if object is leaving an open door
            if(!this.closed && (xoffset+object.w/2 < 8 && object.x < object.oldX || xoffset-object.w/2 > 64-8 && object.x > object.oldX) ) {
                // leaving - close it if autoclose is on
                if( this.autoclose ) {
                    this.close();
                }
            }
        }
    }
}

/* ***** P24 series ***** */
/* These tiles are mostly walkable, but have a 24 pixel wall somewhere on them */

class P24TopLeftCorner extends Tile {
     constructor( type ) {
         super("floor", "P24_ES");
     }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2>24 && yoffset-object.h/2>24;
    }
}

class P24BottomLeftCorner extends Tile {
    constructor( type ) {
         super("floor", "P24_NE");
     }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2>24 && yoffset+object.h/2<64-24;
    }
}

class P24TopRightCorner extends Tile {
    constructor( type ) {
         super("floor", "P24_SW");
     }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 && yoffset-object.h/2>24;
    }
}

class P24BottomRightCorner extends Tile {
    constructor( type ) {
         super("floor", "P24_NW");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 && yoffset+object.h/2<64-24;
    }
}

class P24TopLeft extends Tile {
    constructor() {
         super("floor", "P24_W_N");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2<25 && yoffset-object.h/2>32 || xoffset-object.w/2>24;
    }
}

class P24TopRight extends Tile {
    constructor() {
         super("floor","P24_E_N");
         this.overlay.x = 40;
    }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 || yoffset-object.h/2>32;
    }
}

class P24Top extends Tile {
    constructor() {
         super("floor", "P24_N_EW");
     }
    canWalkOn(object,xoffset,yoffset) {
        return yoffset-object.h/2>24;
    }
}

/* ***** Uni-directional types ***** */
class FloorOnlyLeft extends Tile {
    constructor() {
        super("floor", "floor_only_left");
        this.rotate("left");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset <= object.x-this.x;
    }
}

class FloorOnlyRight extends Tile {
    constructor() {
        super("floor", "floor_only_right");
        this.rotate("right");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset >= object.x-this.x;
    }
}

class FloorOnlyUp extends Tile {
    constructor() {
        super("floor","floor_only_up");
        this.rotate("up");
    }

    canWalkOn(object,xoffset,yoffset) {
        return yoffset <= object.y-this.y;
    }
}

class FloorOnlyDown extends Tile {
    constructor() {
        super("floor","floor_only_down");
        this.rotate("down");
    }

    canWalkOn(object,xoffset,yoffset) {
        return yoffset >= object.y-this.y;
    }
}
