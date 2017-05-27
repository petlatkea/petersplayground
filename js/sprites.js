class Sprite extends createjs.Sprite {
    constructor(spritename) {
        super(game.sprites, spritename);
    }
}


class MovingSprite extends Sprite {
    constructor(spritename) {
        super(spritename);
        this.speed = 1;
        this.direction = "left";
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

    moveWith( xoffset, yoffset ) {
        if( canMoveTo(this, this.x+xoffset, this.y+yoffset) ) {
            this.x += xoffset;
            this.y += yoffset;
            movedTo( this, this.x, this.y);
            return true;
        } else {
            return false;
        }
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

class Enemy extends MovingSprite {
    constructor(spritename) {
        super(spritename);
        this.w = 16;
        this.h = 24;
        this.offset = {x:0, y:0};
    }


    setGridPosition( x, y ) {
        this.x = x*64 + this.offset.x + this.w/2;
        this.y = y*64 + this.offset.y + this.h/2;
    }


    move() {
        if(!this.moveWith( this.speed, 0 ) ) {
            this.speed = -this.speed;
        }
    }

}

class Guard extends Enemy {
    constructor() {
        super("guard");
        // TODO: Remember direction and state
    }

}

class Patroller extends Enemy {
    constructor( pattern ) {
        super("patroller");
        this.pattern = pattern;
        this.patternIndex = 0;
    }

    setPosition( index ) {
        this.patternIndex = index;
        this.setGridPosition( this.pattern[index].x, this.pattern[index].y );

        this.goal = this.calculateDirection(index);
    }

    calculateDirection(index) {
        let current = this.pattern[index];
        let next = index<this.pattern.length-1 ? this.pattern[index+1] : this.pattern[0];

        if( current.x == next.x && current.y < next.y ) {
            this.turn("down");
        } else if( current.x == next.x && current.y > next.y ) {
            this.turn("up");
        } else if( current.y == next.y && current.x < next.x ) {
            this.turn("right");
        } else if( current.y == next.y && current.x > next.x ) {
            this.turn("left");
        }

        return next;
    }

    move() {

        // move
        this.moveInDirection();

        // test if goal is reached

//        console.log( Math.abs(this.goal.x*64+this.offset.x - this.x) );

//        console.log(Math.abs(this.goal.y*64+this.offset.y+this.h/2 - this.y));

        if( Math.abs(this.goal.x*64+this.offset.x+this.w/2 - this.x) <= this.speed &&
            Math.abs(this.goal.y*64+this.offset.y+this.h/2 - this.y) <= this.speed ) {
            // goal reached!

            // increment index
            this.patternIndex++;
            if( this.patternIndex == this.pattern.length ) {
                this.patternIndex = 0;
            }

            // sets next goal (maybe not entirely appropiate)
            this.goal = this.calculateDirection(this.patternIndex);
        }
    }

}
