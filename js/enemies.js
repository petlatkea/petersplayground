function createEnemy( data ) {
    var enemy = null;

    switch( data.type ) {
        case "guard":
            enemy = new Guard();
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
                                    let gScore = current.g + 1; // +1 the node distance (should really be grid-distance - TODO: fix)
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

    set currentState( state ) {
        this._currentState = state;
        if( this.currentState.enterState ) {
            this.currentState.enterState();
        }
    }

    get currentState( ) {
        return this._currentState;
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


