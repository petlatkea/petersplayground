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
        return Math.abs(gridposition.x*64+this.offset.x+this.w/2 - this.x) <= this.speed &&
               Math.abs(gridposition.y*64+this.offset.y+this.h/2 - this.y) <= this.speed;
    }

    setGridPosition( x, y ) {
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

class Enemy extends MovingSprite {
    constructor(spritename) {
        super(spritename);
        this.w = 16;
        this.h = 24;
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

        this.goal = this.getNextPosition();
        this.turnTowardsGrid( this.goal );
    }

    getNextPosition( index ) {
        if(!index) {
            index = this.patternIndex;
        }
        let next = index<this.pattern.length-1 ? this.pattern[index+1] : this.pattern[0];

        return next;
    }


    move() {
        // move
        this.moveInDirection();

        // test if goal is reached
        if( this.isAtGridPosition(this.goal) ) {
            // goal reached!

            // increment index
            this.patternIndex++;
            if( this.patternIndex == this.pattern.length ) {
                this.patternIndex = 0;
            }

            // sets next goal (maybe not entirely appropiate)
            this.goal = this.getNextPosition();
            this.turnTowardsGrid( this.goal );
        }
    }
}

class Chaser extends Enemy {
    constructor() {
        super("chaser");
        this.target = {x:0, y:0};
        this.speed = 1.6;
    }

    move() {
        // find player
        this.target.x = player.x;
        this.target.y = player.y;

        this.turnTowards( this.target );
        this.moveInDirection();
    }
}

class Sentry extends Enemy {
    constructor() {
        super("sentry");
        this.h = 10;

        this.rotationSpeed = .5;
        this.rotationMin = this.rotation-30;
        this.rotationMax = this.rotation+30;
        this.rotationDirection = 1;

        this.lastshot = 0;
    }

    move() {

        this.rotation += this.rotationSpeed * this.rotationDirection;

        if(this.rotationDirection >0 && this.rotation >= this.rotationMax) {
            this.rotation = this.rotationMax;
            this.rotationDirection *= -1;
        } else if( this.rotationDirection < 0 && this.rotation <= this.rotationMin) {
            this.rotation = this.rotationMin;
            this.rotationDirection *=-1;
        }


        // calculate angle from this to the player
        let angle = Math.atan2(player.y-this.y, player.x-this.x) * 180/Math.PI;

        let diff = Math.abs(this.rotation - angle);
        if( diff < 5 ) {
            this.fireShot();
        }
    }

    fireShot() {
        // can only fire a shot, if more than 100 ms has passed since last shot
        let now = Date.now();
        let timesincelast = now - this.lastshot;
        if( timesincelast > 100 ) {
            this.lastshot = now;

            // create a shot, and give it the same direction as us
            createShot(this.x+10, this.y, this.rotation,1);
        }
    }

}

class Traveller extends Enemy {
    constructor() {
        super("traveller");
        this.lastNode = null;
        this.currentNode = null;
        this.nextNode = null;
    }

    setCurrentNode( node ) {
        this.currentNode = node;
        this.setGridPosition( node.x, node.y);
    }

    setNextNode( node ) {
        this.nextNode = node;

        if( node != null ) {
            //this.calculateDirection( this.currentNode, this.nextNode );
            this.turnTowardsGrid(this.nextNode);
        }
    }


    move() {
        // if nextNode is null, calculate a new nextNode
        if( this.nextNode == null ) {
            // find all possibilities
            // remove the last node - so we don't run in circles
            let lastid = this.lastNode == null?0:this.lastNode.id;
            let possibilities = this.currentNode.connections.filter( node => node.id != lastid );
            if( possibilities.length < 1 ) {
                possibilities = this.currentNode.connections.slice();
            }

            // select a random node in the list
            this.nextNode = possibilities[ Math.floor(Math.random()*possibilities.length) ];
            //this.calculateDirection(this.currentNode, this.nextNode);
            this.turnTowardsGrid( this.nextNode ) ;
            this.lastNode = this.currentNode;

        } else {
            // move in the given direction
            this.moveInDirection();

            // check if we have reached the next node
            if( this.isAtGridPosition(this.nextNode) ) {
                this.currentNode = this.nextNode;
                this.nextNode = null;
            }
        }
    }

}
