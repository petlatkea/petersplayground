function createTile(type) {
    var tile = null;

    switch(type) {
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
        case 17: tile = new Floor(type);
                 break;
        // plain walls
        case 10:
        case 11:
        case 12:
        case 20:
        case 21:
        case 22:
        case 30:
        case 31:
        case 32:
        case 40:
        case 41:
        case 42:
        case 52: tile = new Wall(type);
            break;

        // entry and exit
        case 8: tile = new Entry(type);
                break;
        case 9: tile = new Exit(type);
                break;

        // doors - only partly walkable (requires relative x and y pos)
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38:
            tile = new Door(type);
            break;

        // partly blocked
        case 43: // 24 top left
            tile = new P24TopLeftCorner(type);
            break;
        case 44:
            tile = new P24TopRightCorner(type);
            break;
        case 45: // 24X 32Y
            tile = new P24TopLeft(type);
            break;
        case 46:
            tile = new P24TopRight(type);
            break;
        case 47:
            tile = new P24Top(type);
            break;

        // TODO: Implement the rest
        case 48:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 58:

        default:
            tile = new Tile(type);
    }




    return tile;
}

class Tile extends createjs.Sprite {
    constructor( spritename ) {
        super(game.tiles, spritename);
        this.type = spritename;
        this.gotoAndStop(this.type);
        this.walkable = true;
    }

    canWalkOn(object,xoffset,yoffset) {
        return this.walkable;
    }

    walkOn(object,xoffset, yoffset) {
        // nothing usually happens here - implement function in subclasses, if necessary
    }
}

class Floor extends Tile {
    constructor( type ) {
        super(type);
        this.walkable = true;
    }
}

class Wall extends Tile {
    constructor( type ) {
        super(type);
        this.walkable = false;
    }
}

class Entry extends Tile {
    constructor( type ) {
        super(type);
    }

    canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;

        if( xoffset>8 && yoffset>8 && yoffset<64-8) {
            canWalk = true;
        }

        return canWalk;
    }
}

class Exit extends Tile {
    constructor( type ) {
        super(type);
    }

     canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;

        if( xoffset<64-8 && yoffset>8 && yoffset<64-8) {
            canWalk = true;
        }

        return canWalk;
    }

    walkOn(object,xoffset,yoffset) {
        if( object == player && xoffset>12 && xoffset<64-8-12 && yoffset>16 && yoffset<64-16 ) {
            levelCompleted();
        }
    }

}

class Door extends Tile {
    constructor( type ) {
        super(type);
        this.closed = true;
        if( type == 23 ) {
            // blue door
            this.spriteprefix = "blue";
            this.locked = false;
        } else if( type == 33 ) {
            // red door
            this.spriteprefix = "red";
            this.locked = true;
        }
    }

    canWalkOn(object,xoffset,yoffset) {
        let canWalk = false;
        if( yoffset>8 && yoffset<64-8 ) {
            if( !this.closed || xoffset<28 || xoffset >34 ) {
                canWalk = true;
            }
        }
        return canWalk;
    }

    open() {
        var thisdoor = this;
        thisdoor.addEventListener("animationend", opened);
        thisdoor.gotoAndPlay(this.spriteprefix + "door_open");

        function opened() {
            console.log("Door is opened");
            thisdoor.removeEventListener("animationend", opened);
            thisdoor.closed = false;
        }
    }

    walkOn(object,xoffset,yoffset) {

        if( this.closed && xoffset > 20 && xoffset < 64-20 ) {
            console.log("try to open door");
            if(!this.locked) {
                console.log("Unlocked - just open it")
                // run open animation
                this.open();
            } else {
                // locked - try to unlock it
                console.log("Locked - try to unlock");
                let key = object.getItem("key");
                if( key ) {
                    object.useItemOn(key, this);
                    this.locked = false;
                    console.log("Unlocked door with key");
                    this.open();
                } else {
                    console.log("need a key to unlock this door");
                }
            }
        }
    }
}

/* ***** P24 series ***** */
/* These tiles are mostly walkable, but have a 24 pixel wall somewhere on them */


class P24TopLeftCorner extends Tile {
    canWalkOn(object,xoffset,yoffset) {
        return xoffset>24 && yoffset>24;
    }
}

class P24TopRightCorner extends Tile {
    canWalkOn(object,xoffset,yoffset) {
        return xoffset<40 && yoffset>24;
    }
}

class P24TopLeft extends Tile {
    canWalkOn(object,xoffset,yoffset) {
        return xoffset<25 && yoffset>32 || xoffset>24;
    }
}

class P24TopRight extends Tile {
    canWalkOn(object,xoffset,yoffset) {
        return xoffset<40 || yoffset>32;
    }
}

class P24Top extends Tile {
    canWalkOn(object,xoffset,yoffset) {
        return yoffset>24;
    }
}
