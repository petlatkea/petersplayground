function createEnemy( data ) {
    var enemy = null;

    switch( data.type ) {
        case "guard":
            enemy = new Guard();
            enemy.offset = data.offset;
            enemy.setAtGridPosition( data.grid.x, data.grid.y );
            break;
         case "guard2":
            enemy = new Guard2();
            enemy.offset = data.offset;
            enemy.setAtGridPosition( data.grid.x, data.grid.y );
            break;
        case "patroller":
            enemy = new Patroller( data.pattern );
            enemy.offset = data.offset;
            enemy.setPosition(0);
            break;
        case "chaser":
            enemy = new Chaser();
            enemy.offset = data.offset;
            enemy.setAtGridPosition( data.grid.x, data.grid.y );
            break;
        case "sentry":
            enemy = new Sentry();
            enemy.offset = data.offset;
            enemy.setAtGridPosition( data.grid.x, data.grid.y );
            break;
        case "traveller":
            enemy = new Traveller();
            enemy.offset = data.offset;
            enemy.setCurrentNode(getNodeWithId(data.startNode));
           break;
        case "hunter":
            enemy = new Hunter();
            enemy.offset = data.offset;
            enemy.setCurrentNode(getNodeWithId(data.startNode));
            break;

    }

    return enemy;
}


class Enemy extends MovingSprite {
    constructor(spritename) {
        super(spritename);
        this.w = 16;
        this.h = 24;
    }

    move() {
        // All subclasses must implement a move-method
    }

}

class Guard extends Enemy {
    constructor() {
        super("guard");
        // TODO: Remember direction and state
    }

    move() {
        if(!this.moveWith( this.speed, 0 ) ) {
            this.speed = -this.speed;
        }
    }

}

/* NOTE: This really should replace the Guard
   - he is kept for historical reasons, since this is a playground!
   */
class Guard2 extends Enemy {
    constructor() {
        super("guard");
        this.debuginfo = true;

        let self = this;

        // Create tazer
        let tazer = new createjs.Sprite(game.sprites,"electricity");
        tazer.x = 20;
        tazer.visible = false;
        this.addChild(tazer);
        this.tazer = tazer;


        // Create cone of vision - if debugging is enabled
        // TODO: Maybe enable debugging on game-object
        if( this.debuginfo ) {
            var g = new createjs.Graphics();
            g.setStrokeStyle(1);
            g.beginStroke("yellow");

            // calculate x&y from degress and dist
            let dist = 200;
            let angle = 30;
            let x = Math.cos(angle/180*Math.PI)*dist;
            let y = Math.sin(angle/180*Math.PI)*dist;
            g.moveTo(0,0);
            g.lineTo(x,y);
            g.moveTo(x,-y);
            g.lineTo(0,0);
            g.arc(0,0,dist,-angle/180*Math.PI,angle/180*Math.PI);

            this.cone = new createjs.Shape(g);
            this.addChild(this.cone);
        }

        /* The Guard has five states:
           1: Walking - where he walks from one position to another
           2: Turning - where he turns around and waits a while, before walking in the other direction
           3: Watching - where he has spottet the player, and keeps an eye on it, while maybe moving a bit.
           4: Wondering - when the player disappears, and he searches for a bit, before giving up
           5: Attacking - where he attacks a player (without leaving his station!)
        */

        var Walking = {
            enterState() {
                console.log("guard WALKING");
            },

            move() {
                // check if can see player
                if( self.canSee( player ) ) {
                    console.log("I see you!");
                    self.currentState = Watching;
                } else

                // if he can move - continue to move - else, change state
                if( !self.moveInDirection() ) {
                    // console.log("Can't move further");
                    self.currentState = Turning;
                }
            }
        }

        var Turning = {
            counter: 0,

            enterState() {
                console.log("guard TURNING");
                // change direction
                // TODO: ask self to turn 180 deg
                if( self.direction == "left") {
                    self.turn("right");
                } else {
                    self.turn("left");
                }
                // start counter
                this.counter = 0;
            },

            move() {
                // increment counter
                this.counter++;

                // TODO: Make turning slower, and spot player while turning!

                // check if can see player
                if( self.canSee( player ) ) {
                    console.log("I see you!");
                    self.currentState = Watching;
                } else

                if( this.counter > game.FPS*.750 ) {
                    // done waiting - go back to walking
                    // console.log("Walk again");
                    self.currentState = Walking;
                }
            }
        }

        var Watching = {

            enterState() {
                console.log("guard WATCHING");
            },

            move() {
                let angle = Math.atan2(player.y-self.y, player.x-self.x) * 180/Math.PI;
                let dist = Math.hypot(player.y-self.y, player.x-self.x);

                // if we don't look directly at the player, rotate until we do
                let old_rotation = self.rotation;
                self.rotateTowards(angle,3);
                let isTurning = self.rotation == old_rotation;

                // if we are close enough - go to attack-mode
                if( dist < 50 ) {
                    self.currentState = Attacking;
                } else {

                    // make sure the direction is pointing to the player
                    if( Math.abs(angle) > 90 ) { // we should move left
                        self.direction = "left";
                    } else {
                        self.direction = "right";
                    }

                    // check if can move closer to player, without losing sight
                    let xoff = (self.direction=="left"?-self.speed:(self.direction=="right"?self.speed:0));
                    let yoff = (self.direction=="up"?-self.speed:(self.direction=="down"?self.speed:0));

                    // NOTE: If I don't test for both offset and offset*2, I risk flickering back and forth ...
                    // I don't really understand why ...
                    if( canMoveTo(this, self.x+xoff, self.y+yoff) && self.canSee(player,xoff,yoff) && self.canSee(player,xoff*2,yoff*2) ) {
                        self.moveInDirection();
                    }
                }

                if(!isTurning && !self.canSee(player)) {
                    console.log("Where did you go?");
                    self.currentState = Wondering;
                }
            }
        }

        var Wondering = {

            counter: 0,
            subcounter: 0,
            substate: null,

            enterState() {
                console.log("guard WONDERING");
                // remember the last direction
                this.lastDirection = self.direction;
                if( this.lastDirection == "left") {
                    this.otherDirection = "right";
                } else {
                    this.otherDirection = "left";
                }

                this.counter = 0;
            },

            move() {
                this.counter++;

                // if we suddenly see the player, go back to watching
                if( self.canSee(player) ) {
                    console.log("Oh, there you are");
                    self.currentState = Watching;
                } else if( this.counter > game.FPS*5 ) { // wonder for max 5 seconds
                    // done waiting - go back to walking
                    console.log("Walk again");

                    if( this.lastDirection == "left") {
                        self.turn("left");
                    } else {
                        self.turn("right");
                    }

                    self.currentState = Walking;
                } else {

                    // The wondering-state has three substates:
                    // 1: moving, where the guard moves randomly around
                    // 2: rotating, where the guard rotate to a random direction
                    // 3: standing, where the guard does absolutely nothing

                    function moving() {
                        if( !self.moveInDirection() ) {
                            if(self.direction == this.lastDirection ) {
                                self.direction = this.otherDirection;
                            } else {
                                self.direction = this.lastDirection;
                            }
                        } else {
                            this.substate = null;
                        }
                    }

                    function rotating() {
                        self.rotation-= this.rotatedir;
                    }

                    function standing() {
                        // do nothing
                    }

                    if( this.substate == null ) {
                        // select a random substate
                        let rnd = Math.random();
                        if( rnd < .5 ) {
                            this.substate = moving;
                        } else if( rnd <.75) {
                            this.substate = rotating;
                            this.rotatedir = Math.sign(Math.random()-.5);
                        } else {
                            this.substate = standing;
                        }

                        this.subcounter = Math.floor(Math.random()*game.FPS*.5);
                    } else {
                        // do current sub-state
                        this.substate();

                        this.subcounter--;
                        if( this.subcounter <= 0 ) {
                            this.substate = null;
                        }
                    }
                }
            }
        }

        var Attacking = {
            enterState() {
                console.log("guard ATTACKING");
                this.taze(true);
            },

            taze(on) {
                self.tazer.visible = on;
            },

            move() {
                let angle = Math.atan2(player.y-self.y, player.x-self.x) * 180/Math.PI;
                let dist = Math.hypot(player.y-self.y, player.x-self.x);

                // make sure we face the player at all times
                let isTurning = self.rotateTowards(angle,3);

                if( dist < 50 ){
                    this.taze(true);
                } else if( dist > 64 ) {
                    this.taze(false);
                    self.currentState = Watching;
                }

                if( self.rotation==angle && !self.canSee(player) ) {
                    console.log("Stop attacking - he is gone ...");
                    this.taze(false);
                    self.currentState = Wondering;
                }
            }
        }

        this.currentState = Walking;

    }

    move() {
        this.currentState.move();
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
        this.setAtGridPosition( this.pattern[index].x, this.pattern[index].y );

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
        this.setAtGridPosition( node.x, node.y);
    }
/*
    setNextNode( node ) {
        this.nextNode = node;

        if( node != null ) {
            //this.calculateDirection( this.currentNode, this.nextNode );
            this.turnTowardsGrid(this.nextNode);
        }
    }
*/

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


// *****************************************************************

class Hunter extends Enemy {
    constructor() {
        super("hunter_neutral");
        let self = this;

        this.lastNode = null;
        this.currentNode = null;
        this.nextNode = null;


        var MoveToRandomTarget = {

            enterState() {
                self.gotoAndStop("hunter_neutral");
                self.speed = 1;

                // First make sure that we are on (or near) a node
                if( !self.isAtGridPosition(self.currentNode) ) {
                    self.lastNode = self.currentNode;
                    console.warn("Not positioned at currentNode");
                    self.currentNode = self.getClosestNode( self );
                    console.log("positioned at ", self.currentNode);
                }

                // Then, find a random next node
                self.getRandomNextNode();
                self.turnTowardsGrid(self.nextNode);

                console.log("random target is: ", self.nextNode);
            },


            move() {
                self.moveInDirection();
                // check if we have reached the next node
                if( self.isAtGridPosition(self.nextNode) ) {
                    console.log("Moved to random target: ", self.nextNode);
                    self.currentNode = self.nextNode;
                    // go scanning again
                    self.currentState = ScanForPrey;
                }
            }
        }

        var ScanForPrey = {

            enterState() {
                self.gotoAndPlay("hunter_searching");
                self.speed = 1;
                this.startRotation = self.rotation;
                this.currentRotation = this.startRotation;
                this.endRotation = this.startRotation+360;
                console.log("start scanning");

                // TODO: Show visual cone of scan-area
            },

            move() {
                // rotate
                this.currentRotation += 2;
                // make sure the actual rotation doesn't go above 180
                self.rotation = this.currentRotation > 180 ? this.currentRotation-360 : this.currentRotation;

                // calculate distance and angle to player
                let dist = Math.hypot(self.x-player.x, self.y-player.y);
                let angle = Math.atan2(player.y-self.y, player.x-self.x) / Math.PI*180;

                // -angle = player above, +angle = player below
                // 0-180 < 90 right, > 90 left

                if( this.currentRotation >= this.endRotation ) {
                    // done scanning - and nothing found
                    console.log("Not Found");
                    // reset rotation
                    self.rotation = this.startRotation;
                    // go to next state: Select (a new) RandomTarget
                    self.currentState = MoveToRandomTarget;


                } else if( dist < 400 && self.rotation > angle-10 && self.rotation < angle+10 ) {
                    console.log("Found!");

                    // Stop scanning, and go to chasing
                    self.currentState = StartChasing;
                }
            }
        }

        // -------

        var StartChasing = {
            enterState() {
                self.gotoAndPlay("hunter_chasing");
                self.speed = 2;

                // Find node closest to player
                let closestNode = self.getClosestNode( player );
//                console.log("Node closest to player is: ", closestNode);

                // Plan route from current node to playerNode
//                console.log("Plan route from: " , self.currentNode);

                // if it is directly connected, then it is easy
                let route = [];
                route.push( self.currentNode );

                if( self.currentNode.connections.indexOf( closestNode ) != -1 ) {
                    console.log("Directly connected!");
                    route.push( closestNode );
                } else {
                    // plan more complicated route ...

                    // TODO: Maybe don't modify the original nodes - but make a graph for this sprite
                    // create a new list of nodes
                    let graph = nodes.map( node => {
                        node.f=0;
                        node.g=0;
                        node.h=0;
                        node.parent = null;
                        return node;});

                    let start = graph.find( node => node.id == self.currentNode.id );
                    let end = graph.find( node => node.id == closestNode.id );

                    console.log("Shortest path from, to: ", start, end);

                    let path = getShortestPath( graph, start, end );

                    // TODO: Move this to Node-utils.
                    function getShortestPath( graph, start, end ) {
                        let openList = [];
                        let closedList = [];
                        openList.push( start );

                        while( openList.length > 0 ) {
                            // find node with lowest f in openlist
                            let lowindex = 0;
                            let current = openList[0];

                            openList.forEach( node => {if(node.f < current.f) {current = node;} });

                            console.log("Lowest f is ", current);

                            // if lowest f is end, then we have the entire path
                            if( current == end ) {
                                let ret = [];
                                let cur = current;
                                while( cur.parent ) {
                                    ret.unshift(cur);
                                    cur = cur.parent;
                                }
                                return ret;
                            }

                            // if not, move current from open to closed, and check neighbours (connections)
                            openList.splice(openList.indexOf(current),1);
                            closedList.push(current);

                            console.log("Neigbours are: ", current.connections);

                            current.connections.forEach( neighbour => {

                                // test that this neighbour isn't in the closedList
                                if( closedList.indexOf(neighbour) == -1 ) {
                                    // calculate the score 'g'
                                    // g should be the distance between current and this neighbour
                                    let xdist = Math.abs( current.x - neighbour.x );
                                    let ydist = Math.abs( current.y - neighbour.y );
                                    // The distance is always a 90degree angle

                                    // TODO: Doors create more weight - so maybe they should be added

                                    let gScore = current.g + Math.max(xdist,ydist);
                                    let gScoreIsBest = false;

                                    // if this neighbour isn't in the openlist,
                                    // it is the first time we see it, hence the best node!

                                    if( openList.indexOf(neighbour) == -1 ) {
                                        console.log("neighbour is best ", neighbour );
                                        gScoreIsBest = true;
                                        // h is direct distance to end
                                        neighbour.h = Math.hypot(end.x-neighbour.x, end.y-neighbour.y);
                                        openList.push(neighbour);
                                    } else if( gScore < neighbour.g ) {
                                        // neighbour is seen before, but has better g now
                                        gScoreIsBest = true;
                                    }

                                    if(gScoreIsBest) {
                                        // so far this node is the optimal path
                                        neighbour.parent = current;
                                        neighbour.g = gScore;
                                        neighbour.f = neighbour.g + neighbour.h;
                                    }

                                }

                            });




                        }

                        console.warn("Failed to find route!");
                        return [];
                    }

                    route = path;
                }

                FollowRoute.route = route;
                FollowRoute.routeIndex = 0;

            },

            move() {
                // go directly to following the route
                if( FollowRoute.route.length > 1 ) {
                    self.currentState = FollowRoute;
                } else {
                    console.warn("Route to short!!");

                    // TODO: Go into attack-mode!

                    self.currentState = Panic;
                }
            }
        }

        var Panic = {
            move() {
                // do nothing
            }
        }


        var FollowRoute = {
            route: [],
            routeIndex: 0,

            enterState() {
                console.log("Follow this route:");
                console.table( this.route );

                self.turnTowardsGrid( this.route[0] );
                self.nextNode = this.route[0];

                console.log("Go to: ", self.nextNode);
            },


            move() {
                self.moveInDirection();

                // test if goal is reached
                if( self.isAtGridPosition(self.nextNode) ) {
                    // goal reached!
                    self.lastNode = self.currentNode;
                    self.currentNode = this.next;

                    console.log("At next goal ...");

                    // increment index
                    this.routeIndex++;
                    if( this.routeIndex == this.route.length ) {
                        // End of the line - go back to searching
                        console.log("End of route");
                        self.currentState = ScanForPrey;
                    } else {
                        console.log("Next target: ", this.next);
                        this.next = this.route[this.routeIndex];
                        self.nextNode = this.next;
                        self.turnTowardsGrid( this.next );
                    }
                }
            }
        }


        this.currentState = ScanForPrey;


    }


    setCurrentNode( node ) {
        this.currentNode = node;
        this.setAtGridPosition( node.x, node.y);
    }

    // TODO: Maybe move to Node-utils ...
    getClosestNode( sprite ) {
        let gridX = (sprite.x-32) /64;
        let gridY = (sprite.y-32) /64;

        let closestNode = null;
        let closestDist = 100000000;

        // loop through all nodes, find the closest one
        nodes.forEach( node => {
            let dist = Math.hypot(gridY-node.y, gridX-node.x);
            if( dist < closestDist ) {
                closestDist = dist;
                closestNode = node;
            }
        });

        return closestNode;
    }


    getRandomNextNode() {
        // avoid selecting the last node!
        let lastid = this.lastNode == null?0:this.lastNode.id;
        let possibilities = this.currentNode.connections.filter( node => node.id != lastid );
        if( possibilities.length < 1 ) {
            possibilities = this.currentNode.connections.slice();
        }

        // select a random node in the list
        this.nextNode = possibilities[ Math.floor(Math.random()*possibilities.length) ];

        // and remember the current node as the last one
        this.lastNode = this.currentNode;

        return this.nextNode;
    }




    move() {
         this.currentState.move();
    }





}


