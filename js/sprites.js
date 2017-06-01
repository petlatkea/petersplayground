class Sprite extends createjs.Sprite {
    constructor(spritename) {
        super(game.sprites, spritename);
    }
}

class Shot extends Sprite {
    constructor(type) {
        switch(type) {
            case 1: super("shot_single");
                this.w = 8;
                this.h = 2;
                this.speed = 8;
                break;
            case 2: super("shot_double");
                this.w = 8;
                this.h = 9;
                this.speed = 8;
                break;
        }
    }


    setPosition(x, y) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x;
        this.y = y;
    }

    setDirection(direction) {
        this.rotation = direction;
        this.direction = direction * Math.PI/180;
    }

    move() {
        // move in direction
        let dx = Math.cos(this.direction)*this.speed;
        let dy = Math.sin(this.direction)*this.speed;

        if( canMoveTo(this, this.x+dx, this.y+dy) ) {
            this.oldX = this.x;
            this.oldY = this.y;

            this.x+=dx;
            this.y+=dy;

            // if this shot is outside the canvas - let it die
            if( this.x+this.w/2 < 0 || this.y+this.h/2 < 0 || this.x-this.w/2 > game.stage.width || this.y-this.h/2 > game.stage.height) {
                removeShot(this);
            }

        } else {
            // if this shot can't move anymore - let it die
            removeShot(this);
        }
    }
}


class MovingSprite extends Sprite {
    constructor(spritename) {
        super(spritename);
        this.speed = 1;
        this.direction = "left";
        this.offset = {x:0, y:0};
    }

    moveDown() {
        this.turn("down");
        this.moveWith(0,this.speed);
    }

    moveUp() {
        this.turn("up");
        this.moveWith(0,-this.speed);
    }

    moveLeft() {
        this.turn("left");
        this.moveWith(-this.speed,0);
    }

    moveRight() {
        this.turn("right");
        this.moveWith(this.speed,0);
    }

    moveInDirection() {
        switch( this.direction ) {
            case "left":
                this.moveWith(-this.speed,0);
                break;
            case "right":
                this.moveWith(this.speed,0);
                break;
            case "down":
                this.moveWith(0,this.speed);
                break;
            case "up":
                this.moveWith(0,-this.speed);
                break;
        }
    }

    turnTowardsGrid( other ) {
        this.turnTowards( {x:other.x*64,y:other.y*64} );
    }

    turnTowards( other ) {
        let x = other.x;
        let y = other.y;

        let xd = this.x - x;
        let yd = this.y - y;
        let xd_a = Math.abs(xd);
        let yd_a = Math.abs(yd);

        if( yd_a > xd_a && yd < 0 ) {
            this.turn("down");
        } else if( yd_a > xd_a && yd > 0 ) {
            this.turn("up");
        } else if( xd_a > yd_a && xd < 0 ) {
            this.turn("right");
        } else if( xd_a > yd_a && xd > 0 ) {
            this.turn("left");
        }
    }

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

            if( Math.abs(rotation - this.rotation) > 180 ) {
                rotation = (360-Math.abs(rotation)) * Math.sign(this.rotation);
            }

            createjs.Tween.get(this).to({rotation: rotation}, 200).call( function() {
                if( this.rotation >= 360 ) {
                    this.rotation-= 360;
                }
                if( this.rotation == -180 ) {
                    this.rotation = 180;
                }
            });

            this.direction = direction;
        }
    }

    moveWith( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.oldX = this.x;
            this.oldY = this.y;
            this.x += xoffset;
            this.y += yoffset;
            movedTo( this, this.x, this.y);
            return true;
        } else {
            return false;
        }
    }


    /* returns true if this enemy has reached a gridposition
       - where a gridposition is any object with an x and y value (in grid-coordinates)
    */
    isAtGridPosition( gridposition ) {
        // calculate distance to grid (with offset)
        let dist = Math.hypot(gridposition.x*64+this.offset.x+this.w/2-this.x,
                              gridposition.y*64+this.offset.y+this.h/2-this.y);

        return dist < this.w/2;




        /*
        return Math.abs(gridposition.x*64+this.offset.x+this.w/2 - this.x) <= this.speed &&
               Math.abs(gridposition.y*64+this.offset.y+this.h/2 - this.y) <= this.speed;*/
    }

    setAtGridPosition( x, y ) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x*64 + this.offset.x + this.w/2;
        this.y = y*64 + this.offset.y + this.h/2;
    }
}


class StationarySprite extends Sprite {
    constructor(spritename) {
        super(spritename);
    }
}

class Item extends StationarySprite {
    constructor( spritename ) {
        super(spritename);
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


class Player extends MovingSprite {

    constructor(spritename) {
        super(spritename);
        this.w = 19;
        this.h = 24;
        this.speed = 3;
    }

    stopMoving() {

    }

    hitBy( opponent ) {
      console.log("Auch, I'm hit");
    }

    pickUp( item ) {
        if( ! this.items ) {
            this.items = [];
        }

        this.items.push(item);
        item.pickedUp();
    }

    useItemOn(item, other) {

        // some objects can take the item from you - if they have the appropiate method
        if( other.useItem ) {
            if( other.useItem(item) ) {
                // item sticks to other
                other.pickUp(item);
                this.items.splice( this.items.indexOf(item), 1);
            }
        }

    }

    getItem( itemName ) {
        if( this.items ) {
            return this.items.find( item => item.type == itemName );
        }
        return undefined;
    }

}
