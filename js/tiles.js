function createTile(type) {
    var tile = null;

    // NOTE: The numbers used here are LEVEL-design numbers.
    //       They are not necessarily identical to the sprite-positions
    //       eventhough most of them fit the same pattern.
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
            tile = new Floor({12:"NS",13:"EW",14:"ESW",15:"NEW",16:"ES",17:"SW",
                              23:"NESW",24:"NES",25:"NSW",26:"NE",27:"NW"}[type]);
                 break;
        // active floor - with light
        case 28:
            tile = new FloorLight();
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

class Tile extends createjs.Sprite {
    constructor( spritename ) {
        super(game.tiles, spritename);
        this.type = spritename;
        this.walkable = true;
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
}

class Space extends Tile {
    constructor() {
        super("space");
        this.walkable = true;
    }
}

class Floor extends Tile {
    constructor(direction) {
        let spritename = "floor";
        if(direction) {
            spritename+="_"+direction;
        }
        super(spritename);
        this.walkable = true;
    }
}

class FloorLight extends Tile {
    constructor() {
        super("floor_light_off");
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
        super("entry");
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
        super("exit");
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
        super( color + "door_" + state);

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
        if( yoffset-object.h/2>8 && yoffset+object.h/2<64-8 ) {
            if( !this.closed || xoffset+object.w/2<28 || xoffset-object.w/2>34 ) {
                canWalk = true;
            }
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
         super("P24_ES");
     }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2>24 && yoffset-object.h/2>24;
    }
}

class P24BottomLeftCorner extends Tile {
    constructor( type ) {
         super("P24_NE");
     }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2>24 && yoffset+object.h/2<64-24;
    }
}

class P24TopRightCorner extends Tile {
    constructor( type ) {
         super("P24_SW");
     }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 && yoffset-object.h/2>24;
    }
}

class P24BottomRightCorner extends Tile {
    constructor( type ) {
         super("P24_NW");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 && yoffset+object.h/2<64-24;
    }
}


class P24TopLeft extends Tile {
    constructor() {
         super("P24_W_N");
    }

    canWalkOn(object,xoffset,yoffset) {
        return xoffset-object.w/2<25 && yoffset-object.h/2>32 || xoffset-object.w/2>24;
    }
}

class P24TopRight extends Tile {
    constructor() {
         super("P24_E_N");
     }
    canWalkOn(object,xoffset,yoffset) {
        return xoffset+object.w/2<40 || yoffset-object.h/2>32;
    }
}

class P24Top extends Tile {
    constructor() {
         super("P24_N_EW");
     }
    canWalkOn(object,xoffset,yoffset) {
        return yoffset-object.h/2>24;
    }
}
