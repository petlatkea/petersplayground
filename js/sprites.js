class Sprite extends createjs.Container {
    constructor(spritename) {
        super();
        this.sprite = new createjs.Sprite(game.sprites, spritename);

        this.addChild(this.sprite);
        //super(game.sprites, spritename);
    }

    gotoAndPlay(frameOrAnimation) {
        return this.sprite.gotoAndPlay(frameOrAnimation);
    }

    gotoAndStop(frameOrAnimation) {
        return this.sprite.gotoAndStop(frameOrAnimation);
    }


}

class Shot extends Sprite {
    constructor(type) {
        switch (type) {
            case 1:
                super("shot_single");
                this.w = 8;
                this.h = 2;
                this.speed = 8;
                break;
            case 2:
                super("shot_double");
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
        this.direction = direction * Math.PI / 180;
    }

    move() {
        // move in direction
        let dx = Math.cos(this.direction) * this.speed;
        let dy = Math.sin(this.direction) * this.speed;

        if (canMoveTo(this, this.x + dx, this.y + dy)) {
            this.oldX = this.x;
            this.oldY = this.y;

            this.x += dx;
            this.y += dy;

            // NOTE: It is important that shots DON'T call movedto, since they don't
            // influence the floor or walls, only themselves.

            // if this shot is outside the canvas - let it die
            if (this.x + this.w / 2 < 0
             || this.y + this.h / 2 < 0
             || this.x - this.w / 2 > game.stage.getBounds().width
             || this.y - this.h / 2 > game.stage.getBounds().height) {
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
        this.offset = {
            x: 0,
            y: 0
        };
    }

    // ****** state machine support *****

    set currentState(state) {
        this._currentState = state;
        if (this.currentState.enterState) {
            this.currentState.enterState();
        }
    }

    get currentState() {
        return this._currentState;
    }

    // *******

    moveDown() {
        this.turn("down");
        this.moveWith(0, this.speed);
    }

    moveUp() {
        this.turn("up");
        this.moveWith(0, -this.speed);
    }

    moveLeft() {
        this.turn("left");
        this.moveWith(-this.speed, 0);
    }

    moveRight() {
        this.turn("right");
        this.moveWith(this.speed, 0);
    }

    moveInDirection() {
        let moved = false;
        switch (this.direction) {
            case "left":
                moved = this.moveWith(-this.speed, 0);
                break;
            case "right":
                moved = this.moveWith(this.speed, 0);
                break;
            case "down":
                moved = this.moveWith(0, this.speed);
                break;
            case "up":
                moved = this.moveWith(0, -this.speed);
                break;
        }

        return moved;
    }

    turnTowardsGrid(other) {
        this.turnTowards({
            x: other.x * 64,
            y: other.y * 64
        });
    }

    turnTowards(other) {
        let x = other.x;
        let y = other.y;

        let xd = this.x - x;
        let yd = this.y - y;
        let xd_a = Math.abs(xd);
        let yd_a = Math.abs(yd);

        if (yd_a > xd_a && yd < 0) {
            this.turn("down");
        } else if (yd_a > xd_a && yd > 0) {
            this.turn("up");
        } else if (xd_a > yd_a && xd < 0) {
            this.turn("right");
        } else if (xd_a > yd_a && xd > 0) {
            this.turn("left");
        }
    }

    turn(direction) {
        if (this.direction != direction) {
            // TODO: Change direction to angles - but accept left, right, up and down
            let rotation = this.rotation;
            let current = this.rotation;

            if (direction == "left") {
                rotation = 180;
            } else if (direction == "right") {
                rotation = 0;
            } else if (direction == "down") {
                rotation = 90;
            } else if (direction == "up") {
                rotation = -90;
            }

            // Rotate from current to rotation
            // If we are turning from top-left to another top (right or left, then use negative values!)
            if (current >= 180 && rotation > 0) {
                rotation -= 360;
            }

            // Make sure we don't turn more than 180 degrees
            if (Math.abs(rotation - current) > 180) {
                rotation = (360 - Math.abs(rotation)) * Math.sign(current);
            }

            // TODO: Sometimes rotations should prefer the direction we was facing the last time
            // If a player turns up, then left, then down, and then up again, it looks better
            // if he turns left and up, rather than right and up ...

            createjs.Tween.get(this).to({
                rotation: rotation
            }, 200).call(function () {
                // Make sure we don't end up all twisted (only turn one full circle)
                if (this.rotation >= 360) {
                    this.rotation -= 360;
                }

                // Always fix straight left to a positive value
                if (this.rotation == -180) {
                    this.rotation = 180;
                }

                //   console.log("Final rotation: " + this.rotation);

            });

            this.direction = direction;
        }
    }


    rotateTowards(angle, step = 0) {
        let didRotate = false;

        let dist = angle - this.rotation;

        if (dist < -180) {
            dist += 360;
        } else if (dist > 180) {
            dist -= 360;
        }

        if (Math.abs(dist) < step) {
            this.rotation = angle;
            didRotate = true;
        } else {
            let dir = Math.sign(dist);

            if (step == 0) {
                step = dist;
            }

            this.rotation += step * dir;
            didRotate = true;

            if (this.rotation < -180) {
                this.rotation += 360;
            } else if (this.rotation > 180) {
                this.rotation -= 360;
            }

            if (dir == 1 && this.rotation > angle ||
                dir == 0 && this.rotation < angle) {
                this.rotation = angle;
                didRotate = false;
            }

        }
        return didRotate;
    }



    moveWith(xoffset, yoffset) {
        if (canMoveTo(this, this.x + xoffset, this.y + yoffset)) {
            this.oldX = this.x;
            this.oldY = this.y;
            this.x += xoffset;
            this.y += yoffset;
            movedTo(this, this.x, this.y);
            return true;
        } else {
            return false;
        }
    }

    getMoveWithResult(xoffset, yoffset) {
        if (canMoveTo(this, this.x + xoffset, this.y + yoffset)) {
            return {
                x: this.x + xoffset,
                y: this.y + yoffset
            };
        } else {
            return {
                x: this.x,
                y: this.y
            };
        }
    }


    /* returns true if this enemy has reached a gridposition
       - where a gridposition is any object with an x and y value (in grid-coordinates)
    */
    isAtGridPosition(gridposition) {
        // calculate distance to grid (with offset)
        let dist = Math.hypot(gridposition.x * 64 + this.offset.x + this.w / 2 - this.x,
            gridposition.y * 64 + this.offset.y + this.h / 2 - this.y);

        return dist < this.w / 2;
    }

    setAtGridPosition(x, y) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x * 64 + this.offset.x + this.w / 2;
        this.y = y * 64 + this.offset.y + this.h / 2;
    }

    canSee(other, xoffset = 0, yoffset = 0) {
        let angle = Math.atan2(other.y - this.y + yoffset, other.x - this.x + xoffset) * 180 / Math.PI;
        let dist = Math.hypot(other.y - this.y + yoffset, other.x - this.x + xoffset);

        let diff = Math.abs(this.rotation - angle);

        // Make sure that negative angles become negative
        if (diff > 180) {
            diff -= 360;
        }

        // For debugging purposes only
        if( this.debuginfo) {
            dots.clear();
            dots.beginFill("orange");
        }

        //        console.log("angle: (this) " + this.rotation + " (other) " + angle + " diff: " + diff);

        // TODO: Configure vision-cone angle and distance?
        if (Math.abs(diff) < 30) {
            // other is in vision-cone - test if direct line is visible.
            let me = this;

            let visible = lineOfSight(this, dist, angle);
            if (visible) {
                // other is directly in line of sight - that was easy
                return true;
            } else {
                // other might be partly obstructed - fan out the search

                // TODO: Maybe limit scan to where the other actually is ...

                // Find all corners of the other - find the corner with the lowest and highest angle
                // then scan from lowest to highest - save some work!

                // find the lowest angle -30 degrees of the current rotation
                let angle_off = -30; // 30 degrees in each direction
                while (!visible && angle_off < 30) {
                    // if other is caught in this line - it is visible
                    visible = lineOfSight(this, dist, this.rotation + angle_off);

                    // if not - try another line
                    angle_off++;
                }

                return visible;
            }




            // raycast from x,y through dist
            function lineOfSight(from, distance, angle) {
                let tx = from.x + xoffset;
                let ty = from.y + yoffset;
                let d = 1;
                let dx = Math.cos(angle / 180 * Math.PI);
                let dy = Math.sin(angle / 180 * Math.PI);

                let dotHitOther = false;

                let dot = {
                    w: 0,
                    h: 0
                };
                while (d < distance) {
                    tx = from.x + xoffset + dx * d;
                    ty = from.y + yoffset + dy * d;

                    // For debugging purposes only
                    if( me.debuginfo) {
                        dots.drawRect(tx, ty, 1, 1);
                    }

                    let tile = getTileAtPixels(tx, ty);

                    // TODO: Make canSeeThrough method, to test for glass-barriers and such
                    if (!tile.canWalkOn(dot, tx - tile.x, ty - tile.y)) {
                        return false;
                    }

                    // the number of pixels to skip - mostly for performance
                    d += 3;
                }

                // end point must hit the other element!
                return (tx > other.x - other.w / 2 && tx < other.x + other.w / 2 &&
                    ty > other.y - other.h / 2 && ty < other.y + other.h / 2);
            }


        }
    }
}


class StationarySprite extends Sprite {
    constructor(spritename) {
        super(spritename);
    }
}

class Item extends StationarySprite {
    constructor(spritename) {
        super(spritename);
        this.type = spritename;
        this.canPickUp = true;
    }

    pickedUp() {
        this.canPickUp = false;
        console.log("Picked up " + this.type);
        // move outside of stage
        createjs.Tween.get(this).to({x: 560,y: -this.h*2}, 750).call(function () {
                // when the item has exited the canvas - remove it
                game.stage.removeChild(this);
            });
    }


}


class Player extends MovingSprite {

    constructor(spritename) {
        super(spritename);
        this.w = 19;
        this.h = 24;
        this.speed = 3;
        this.health = 100;
    }

    stopMoving() {

    }

    hitBy(opponent) {
        // TODO: Make different opponents hurt a different amount
        this.health--;
        console.log("Auch, I'm hit");
    }

    pickUp(item) {
        if (!this.items) {
            this.items = [];
        }

        this.items.push(item);
        item.pickedUp();
    }

    useItemOn(item, other) {

        // some objects can take the item from you - if they have the appropiate method
        if (other.useItem) {
            if (other.useItem(item)) {
                // item sticks to other
                other.pickUp(item);
                this.items.splice(this.items.indexOf(item), 1);
            }
        }

    }

    getItem(itemName) {
        if (this.items) {
            return this.items.find(item => item.type == itemName);
        }
        return undefined;
    }

}
