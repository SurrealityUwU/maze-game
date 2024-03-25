import { collideRectRect } from "p5collide"; 

export default function sketch(p5) {
    const Direction = {
        UP: "UP",
        DOWN: "DOWN",
        RIGHT: "RIGHT",
        LEFT: "LEFT",
    } 
    
    var altMode = true // 0 -> Disable mapping for one player | 1 -> Disable mapping for both player
    var randomKeys = false // 1 -> Random a selection of keys for each player to use
    var roundsPerRandom = 2 
    var randomCount = 0
    var playerCount = 2
    var maxMap = 3
    var playerColors = [p5.color('red'), p5.color('cyan'), p5.color('yellow'), p5.color('green')]   
    var players = []

    var keys = [
        [
            ['q', 'w', 'e', 'r', 't', 'y'],
            ['a', 's', 'd', 'f', 'g', 'h'],
            ['z', 'x', 'c', 'v', 'b']
        ],[
            ['u', 'i', 'o', 'p', '[', ']', '\\'],
            ['j', 'k', 'l', ';', '\''],
            ['n', 'm', ',', '.', '/']
        ]]

    var removedKeys = []
    var removedKeyCoords = []    
    
    const vector_up = new p5.constructor.Vector(1, 0)
    const vector_down = new p5.constructor.Vector(-1, 0)
    const vector_right = new p5.constructor.Vector(0, 1)
    const vector_left = new p5.constructor.Vector(0, -1)
    
    const worldWidth = window.innerWidth;
    const worldHeight = window.innerHeight;
    
    
    const constPath = "/assets"
    let keyboard = p5.loadImage(constPath + "/keyboard.png")
    

    class Player {
        constructor(playerIndex) {
            this.currentActionDict = {}
            this.currentActionList = []
            this.hypothesesList = []
            this.history = []
            this.keyCoords = []
            this.keys = []
            this.score = 0
            this.index = playerIndex
        }
    }
    
    class Agent {
        constructor(initialPosition, mapping, speed, size, strokeWeight, color, playerIndex) {
            this.startPos = initialPosition.copy();
            this.position = initialPosition;
            this.mapping = mapping;
            this.speed = speed;
            this.size = size;
            this.strokeWeight = strokeWeight;
            this.color = color;
            this.playerIndex = playerIndex;
        }
    
        update(actionList) {
            var deltaLocation = delta_from_action_and_mapping(actionList, this.mapping)
            deltaLocation.mult(this.speed)

            let newPos = this.position.copy();
            newPos.add(deltaLocation)

            // let [isColliding, axis, pos] = this.isGoingToCollideWithObstacle(newPos, deltaLocation, this.size)
            // if (isColliding) {  
            //     console.log(axis)
            //     console.log(pos)
            //     if (axis === "x") {
            //         console.log("collide")
            //         this.position.x = pos
            //     } else if (axis === "y") {
            //         this.position.y = pos
                
            //     }
            // } else {
            //     // console.log("not collide")
            //     this.position.add(deltaLocation);
            // }
                this.position.add(deltaLocation);
            p5.strokeWeight(this.strokeWeight);
        }
    
        draw() {
            p5.fill(this.color)
            p5.rect(this.position.x, this.position.y, this.size, this.size)
        }
    
        isOutOfCanvas() {
            if (this.position.x > worldWidth ||
                this.position.x < 0 ||
                this.position.y > worldHeight ||
                this.position.y < 0) {
                return true
            } else {
                return false
            }
        }
        
        resetPosition(playerIndex) {
            this.startPos = p5.createVector(startPosList[mazeCount][0] - (!startingDirectionList[mazeCount] ? agentSize/2 - 20 + 40 * playerIndex : 0), startPosList[mazeCount][1] - (startingDirectionList[mazeCount] ? agentSize/2 - 20 + 40 * playerIndex : 0))
            this.position = this.startPos.copy()
        }
        
        isCollidingWithWall(wall) {
            var isColliding = false;
            let distanceX = worldWidth, distanceY = worldHeight;
            let buffer = 1.5;
            
            if (this.position.x + this.size >= wall.startPos.x && this.position.x <= wall.endPos.x &&
                this.position.y + this.size >= wall.startPos.y && this.position.y <= wall.endPos.y) {
                isColliding = true;
                
                if (wall.startPos.y === wall.endPos.y) {
                let d1 = p5.dist(this.position.x, this.position.y, this.position.x, wall.startPos.y);
                let d2 = p5.dist(this.position.x, this.position.y + this.size, this.position.x, wall.startPos.y);
        
                distanceY = (d1 < d2) ? d1 : -d2 
                
                } else if (wall.startPos.x === wall.endPos.x) {
                let d1 = p5.dist(this.position.x, this.position.y, wall.startPos.x, this.position.y);
                let d2 = p5.dist(this.position.x + this.size, this.position.y, wall.startPos.x, this.position.y);
        
                distanceX = (d1 < d2) ? d1 : -d2 
                }
            }    
    
            if (isColliding) {
                if (Math.abs(distanceX) < Math.abs(distanceY))
                    this.position.x = this.position.x + (distanceX * buffer) 
                else
                    this.position.y = this.position.y + (distanceY * buffer)
                return true
            }
            return false
        }
        
        isInGoal(goal) {
            if (collideRectRect(this.position.x + this.size / 2, this.position.y + this.size / 2, 
                                    1, 1, 
                                    goal[0], goal[1], 
                                    goal[2] - goal[0], goal[3] - goal[1])) {
                players[this.playerIndex].score += 1
                if (altMode) {
                    players[this.playerIndex].history.push(this.mapping)
                } else {
                    players[this.playerIndex].history.push(this.mapping)
                }
                console.log(players[this.playerIndex].hypothesesList)
                
                players.forEach(player => player.hypothesesList.forEach((hyp) => {
                    hyp.resetPosition(player.index);
                }))

                let i = 0
                for (const [, val] of Object.entries(Direction)) {
                    players[this.playerIndex].currentActionDict[val] = false
                    highlightGrid.splice(highlightGrid.indexOf(players[this.playerIndex].keyCoords[i]), 1)
                    i++
                }

                if (!randomKeys) {
                    let x = Math.floor(Math.random() * (3 + 1));
                    removedKeyCoords.push(players[this.playerIndex].keyCoords[x])
                    removedKeys.push(players[this.playerIndex].keys[x])
                    console.log("Removed: " + removedKeys)
                }
 

                if (!randomKeys && randomCount !== roundsPerRandom) {
                    players[this.playerIndex].keys = []
                    players[this.playerIndex].keyCoords = []
                }

                randomCount++;
                if (randomKeys && randomCount === roundsPerRandom) { 
                    generateRandomKeys(); 
                    mazeCount = ++mazeCount % maxMap
                    randomCount = 0;
                    
                    console.log(mazeCount)
                    for (let i = 0; i < playerCount; i++) {
                        players[i].hypothesesList.forEach(hyp => {
                            hyp.resetPosition(i);
                        })
                    }  

                    walls = []
                    obstacleList = []
                    mazeList[mazeCount].forEach((vec) => {
                        var wall = new Wall(p5.createVector(vec[0], vec[1]), p5.createVector(vec[2], vec[3]), weight, p5.color('black'))
                        walls.push(wall)
                    });

                    console.log(mazeCount)
                    obstacleParams[mazeCount].forEach(obs => {
                        var ob = new Obstacle(p5.createVector(obs[0][0], obs[0][1]), p5.createVector(obs[1][0], obs[1][1]), obs[2], obs[3], p5.color('black'))
                        obstacleList.push(ob);
                    })
                }
                return true;
            }
        }

        isGwwwwCollideWithObstacle(obs) {
            let buffer = 1; //px
            
            if (this.position.x + this.size >= obs.position.x - obs.size/2 && this.position.x <= obs.position.x + obs.size/2 &&
                this.position.y + this.size >= obs.position.y - obs.size/2 && this.position.y <= obs.position.y + obs.size/2) {

                let distX = worldWidth, distY = worldWidth, posX, posY;

         
                if (this.position.x > obs.position.x - obs.size/2) { // Collide Right
                    posX = obs.position.x + obs.size/2 + buffer
                    distX = p5.dist(this.position.x, 0, obs.position.x + obs.size/2, 0)
                } else if (this.position.x + this.size < obs.position.x + obs.size/2) { // Collide Left
                    posX = obs.position.x - obs.size/2 - this.size - buffer
                    distX = p5.dist(this.position.x + this.size, 0, obs.position.x - obs.size/2, 0)
                }
                
                if (this.position.y > obs.position.y - obs.size/2) { // Collide Bottom
                    posY = obs.position.y + obs.size/2 + buffer
                    distY = p5.dist(0, this.position.y, 0, obs.position.y + obs.size/2)
                } else if (this.position.y + this.size < obs.position.y + obs.size/2) { // Collide Top
                    posY = obs.position.y - obs.size/2 - this.size - buffer
                    distY = p5.dist(0, this.position.y + this.size, 0, obs.position.y - obs.size/2)
                }

                if (distX === worldWidth && distY === worldWidth) { return false }

                if (Math.abs(distX) < Math.abs(distY))
                    this.position.x = posX;
                else
                    this.position.y = posY;
                return true
                
            }
        }

        // isGoingToCollideWithObstacle(pos, deltaLocation, agentSize) {      
        //     let isGoingToCollide = [false, "", 0]
        //     // console.log(deltaLocation)
        //     obstacleList.forEach(obs => {
        //         p5.rect(obs.position.x - this.size / 2, obs.position.y - this.size / 2, obs.size, obs.size)
        //         p5.rect(pos.x, pos.y, this.size, this.size)
        //         if (collideRectRect(pos.x, pos.y, this.size, this.size, obs.position.x - this.size / 2, obs.position.y - this.size / 2, obs.size, obs.size)) {

        //             let lowestdDiff = worldWidth
        //             if (deltaLocation.x > 0) {
        //                 let diff = Math.abs((obs.position.x - obs.size/2) - (pos.x + agentSize))

        //                 isGoingToCollide = [true, "x", obs.position.x - obs.size/2 - agentSize - 1]
        //                 lowestdDiff = diff
        //             } if (deltaLocation.x < 0) {
        //                 let diff = Math.abs(pos.x - (obs.position.x + obs.size/2))
                        
        //                 if (diff < lowestdDiff) {
        //                     isGoingToCollide = [true, "x", obs.position.x + obs.size/2 + 1]
        //                     lowestdDiff = diff
        //                 }
        //                 console.log(isGoingToCollide)
        //             } if (deltaLocation.y > 0) {
        //                 let diff = Math.abs((obs.position.y - obs.size/2) - (pos.y + agentSize))
                                                
        //                 if (diff < lowestdDiff) {
        //                     isGoingToCollide = [true, "y", obs.position.y - obs.size/2 - agentSize - 1]
        //                     console.log(isGoingToCollide)
        //                 }
        //             } if (deltaLocation.y <  0) {
        //                 let diff = Math.abs(pos.y - (obs.position.y + obs.size/2))
                        
        //                 if (diff < lowestdDiff) {
        //                     isGoingToCollide = [true, "y", obs.position.y + obs.size/2 + 1]
        //                 }
        //             }
        //         }
        //     })
        //     return isGoingToCollide;
        // }
        
        isCollidingWithObstacle(obstacle) {
            // console.log("AIOWNDIAWIOD")  
            // if (!collideRectRect(this.position.x, this.position.y, this.size, this.size, obstacle.position.x, obstacle.position.y, obstacle.size, obstacle.size)) {
                // return;
            // }

            // return collideRectRect(this.position.x, this.position.y, this.size, this.size, obstacle.position.x, obstacle.position.y, obstacle.size, obstacle.size)
            
            // for (let i = 0; i < 4; i++) {
            //     var newStartPos = obstacle.position.copy()
            //     var newEndPos = obstacle.position.copy()
            //     var wall;
            //     switch (i) {
            //         case 0:
            //             newEndPos = p5.createVector(newEndPos.x + obstacle.size, newEndPos.y)
            //             break
            //         case 1:
            //             newStartPos = p5.createVector(newStartPos.x, newStartPos.y + obstacle.size)
            //             newEndPos = p5.createVector(newEndPos.x + obstacle.size, newEndPos.y + obstacle.size)
            //             break
            //         case 2:
            //             newEndPos = p5.createVector(newEndPos.x, newEndPos.y + obstacle.size)
            //             break
            //         case 3:
            //             newStartPos = p5.createVector(newStartPos.x + obstacle.size, newStartPos.y)
            //             newEndPos = p5.createVector(newEndPos.x + obstacle.size, newEndPos.y + obstacle.size)
            //             break
            //     }
            //     wall = new Wall(newStartPos, newEndPos, 1, 'green')
            //     // wall.draw()
            //     this.isCollidingWithWall(wall)
            // }
        }
    }
    
    class Wall {
        constructor(startPos, endPos, strokeWeight, color) {
            this.startPos = startPos;
            this.endPos = endPos;
            this.color = color;
            this.strokeWeight = strokeWeight;
        }
        
        update() {
            p5.strokeWeight(this.strokeWeight);
        }
        
        draw() {
            p5.line(this.startPos.x, this.startPos.y, this.endPos.x, this.endPos.y)
        }
    }

    class Obstacle {
        constructor(startPos, endPos, speed, size, color) {
            this.position = startPos.copy();
            this.startPos = startPos;
            this.endPos = endPos;
            this.size = size;
            this.color = color; 
            this.speedX = speed[0];
            this.speedY = speed[1];
            this.stop = false;
            this.start = 0;
            this.stopDuration = 100; 
        }

        update() {
            if (this.stop) {
                if (p5.millis() - this.start > this.stopDuration) {
                    this.stop = false;
                    this.start = p5.millis();
                } else {
                    return
                }
            } 
            p5.strokeWeight(this.strokeWeight);
            this.position.add(this.speedX, this.speedY);
            if ((this.speedY > 0 && this.position.y >= this.endPos.y) || (this.speedY < 0 && this.position.y <= this.endPos.y))
                this.speedY = -this.speedY
            else if ((this.speedX > 0 && this.position.x >= this.endPos.x) || (this.speedX < 0 && this.position.x <= this.endPos.x))
                this.speedX = -this.speedX
            else
                return
            
            var temp = this.startPos.copy();
            this.startPos = this.endPos.copy();
            this.endPos = temp.copy();  
            
            if(!this.stop) {
                this.stop = true;
                this.start = p5.millis();
            }
        }

        draw() {
            p5.fill(this.color)
            p5.rect(this.position.x  - this.size / 2, this.position.y - this.size / 2, this.size)
        }
        
    }
    
    
    const permutations = arr => {
        if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
            return arr.reduce(
                (acc, item, i) => acc.concat(
                    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
                    item, ...val,])
                ),[]
            );
    };
    
    
    var allMapping = []
    var walls = []
    
    var mazeList = [[[550, 50, 550, 600], [550, 50, 1000, 50], [1000, 50, 1000, 250],
                [750, 250, 1000, 250], [1000, 250, 1000, 600], [750, 250, 750, 500],
                [750, 500, 900, 500], [900, 350, 900, 500], [650, 150, 650, 600],              
                [650, 150, 900, 150], [850, 350, 900, 350], [550, 600, 1000, 600]],
                [[300, 300, 300, 400], [300, 300, 400, 300], [300, 400, 400, 400],
                [400, 100, 400, 300], [400, 100, 1300, 100], [400, 400, 400, 600],
                [400, 600, 1300, 600], [1300, 400, 1300, 600], [1300, 100, 1300, 300],
                [1300, 300, 1400, 300], [1300, 400, 1400, 400], [1400, 300, 1400, 400]],
                [[300, 100, 300, 550], [300, 100, 400, 100], [400, 100, 400, 200],
                [400, 200, 500, 200], [500, 100, 500, 200], [500, 100, 800, 100],
                [800, 100, 800, 350], [800, 350, 850, 350], [850, 100, 850, 350],
                [850, 100, 1100, 100], [1100, 100, 1100, 350], [300, 550, 600, 550],
                [600, 450, 600, 550], [400, 300, 600, 300], [400, 300, 400, 450],
                [400, 450, 500, 450], [500, 350, 500, 450], [500, 350, 700, 350],
                [600, 200, 600, 300], [600, 200, 700, 200], [700, 200, 700, 350],
                [600, 450, 850, 450], [850, 450, 850, 500], [800, 500, 850, 500],
                [800, 500, 800, 550], [800, 550, 1100, 550], [1100, 450, 1100, 550],
                [950, 450, 1100, 450], [950, 200, 950, 450], [950, 200, 1000, 200],
                [1000, 200, 1000, 350], [1000, 350, 1100, 350]]]
    var goalPosList = [[850, 350, 900, 500], [1300, 300, 1400, 400], [1000, 250, 1100, 350]]
    var startPosList = [[600, 450], [350, 350], [350, 150]] 
    var startingDirectionList = [0, 1, 0]  
    var weight = 3
    var mazeCount = 0
    // var goalPos = [650, 350, 900, 500]

    // [startX, startY], [endX, endY], [speedX, speedY], size
    var obstacleParams = [[],   
        [[[500, 200], [500, 500], [0, 5], 50], [[500, 500], [500, 200], [0, -5], 50], 
        [[600, 500], [600, 200], [0, -5], 50], [[600, 200], [600, 500], [0, 5], 50],
        [[700, 200], [700, 500], [0, 5], 50], [[700, 500], [700, 200], [0, -5], 50],
        [[800, 500], [800, 200], [0, -5], 50], [[800, 200], [800, 500], [0, 5], 50],
        [[900, 200], [900, 500], [0, 5], 50], [[900, 500], [900, 200], [0, -5], 50],
        [[1000, 500], [1000, 200], [0, -5], 50], [[1000, 200], [1000, 500], [0, 5], 50],
        [[1100, 200], [1100, 500], [0, 5], 50], [[1100, 500], [1100, 200], [0, -5], 50],
        [[1200, 500], [1200, 200], [0, -5], 50], [[1200, 200], [1200, 500], [0, 5], 50],
        [[500, 300], [1200, 300], [5, 0], 80], [[1200, 300], [500, 300], [-5, 0], 80],
        [[500, 400], [1200, 400], [5, 0], 80], [[1200, 400], [500, 400], [-5, 0], 80],
        [[500, 200], [1200, 200], [5, 0], 80], [[1200, 200], [500, 200], [-5, 0], 80],
        [[500, 500], [1200, 500], [5, 0], 80], [[1200, 500], [500, 500], [-5, 0], 80],
        ],
        [[[330, 230], [570, 230], [5, 0], 20], [[570, 270], [330, 270], [-5, 0], 20],
        [[330, 480], [570, 480], [5, 0], 20], [[570, 520], [330, 520], [-5, 0], 20],
        [[330, 330], [330, 430], [0, 5], 20], [[370, 430], [370, 330], [0, -5], 20],
        [[530, 130], [670, 130], [5, 0], 20], [[670, 170], [530, 170], [-5, 0], 20],    
        [[730, 130], [730, 320], [0, 5], 20], [[770, 320], [770, 130], [0, -5], 20],
        [[530, 380], [670, 380], [5, 0], 20], [[670, 420], [530, 420], [-5, 0], 20],
        [[730, 380], [920, 380], [5, 0], 20], [[920, 420], [730, 420], [-5, 0], 20],
        [[880, 480], [1070, 480], [5, 0], 20], [[1070, 520], [880, 520], [-5, 0], 20],
        [[880, 230], [830, 320], [0, 5], 20], [[920, 320], [920, 230], [0, -5], 20],
        [[880, 130], [1070, 130], [5, 0], 20], [[1070, 170], [880, 170], [-5, 0], 20],    
        ]
    ]
    
    var obstacleList = []

    var highlightGrid = []
    const agentSpeed = 7
    const agentSize = 20
    const agentWeight = 1

    
    for (var i = 0; i < playerCount; i++) {
        players.push(new Player(i))
    }
    
    
    p5.setup = () => {
        p5.createCanvas(worldWidth, worldHeight);
        p5.rectMode(p5.CORNER); // for collision library
        p5.ellipseMode(p5.CENTER); // for collision library
        

    
        for (var [i, [key, ]] in Object.entries(Direction).entries()) {
            players[i].currentActionDict[key] = false
        }
    
        allMapping = permutations([vector_up, vector_down, vector_right, vector_left])
    
        for (let i = 0; i < playerCount; i++) {
            allMapping.forEach(function(mapping, ) {
                createAgents(mapping, i);
            });
        }


        console.log(mazeCount)
            obstacleParams[mazeCount].forEach(obs => {
                var ob = new Obstacle(p5.createVector(obs[0][0], obs[0][1]), p5.createVector(obs[1][0], obs[1][1]), obs[2], obs[3], p5.color('black'))
                obstacleList.push(ob);
            })
        console.log(obstacleList)

        
        mazeList[mazeCount].forEach((vec) => {
            var wall = new Wall(p5.createVector(vec[0], vec[1]), p5.createVector(vec[2], vec[3]), weight, p5.color('black'))
            walls.push(wall)
        });


        if (randomKeys) {
            generateRandomKeys();
        }
        
    
        p5.frameRate(30);
    }
    
    p5.draw = () => {
        p5.background(225);

        
        for (let i = 0; i < playerCount; i++) {
            players[i].currentActionList = Object.values(players[i].currentActionDict)
        }
    
        players.forEach(player => {
            player.hypothesesList.forEach(hyp => {
                hyp.update(player.currentActionList)
            });
        })


    
        players.forEach(player => {
            player.hypothesesList = player.hypothesesList.filter(hyp => !hyp.isOutOfCanvas())
            player.hypothesesList = player.hypothesesList.filter(hyp => !hyp.isInGoal(goalPosList[mazeCount]))
            player.hypothesesList.forEach(hyp => hyp.isInGoal(goalPosList[mazeCount]))

            if (altMode) {
                player.hypothesesList = player.hypothesesList.filter(hyp => {
                    // console.log(history[0].slice(-1))
                    return !(players[0].history.slice(-1).length > 0 && players[0].history.slice(-1).every((elm, index) => {
                        // console.log(elm)
                        /*
                        0: n {x: 0, y: -1, z: 0}
                        1: n {x: 1, y: 0, z: 0}
                        2: n {x: 0, y: 1, z: 0}
                        3: n {x: -1, y: 0, z: 0
                        */
    
                        // console.log(JSON.stringify(elm))
                        //[{"x":0,"y":-1,"z":0},{"x":1,"y":0,"z":0},{"x":0,"y":1,"z":0},{"x":-1,"y":0,"z":0}]
    
    
                        // console.log(JSON.stringify(hyp.mapping[index]) === JSON.stringify(elm[index]))
                        return JSON.stringify(hyp.mapping) === JSON.stringify(elm)
                    }))
                })
            }
            
            walls.forEach(function(wall) {
                player.hypothesesList.forEach(hyp => hyp.isCollidingWithWall(wall))
            });

            obstacleList.forEach(obs => {
                player.hypothesesList.forEach(hyp => hyp.isCollidingWithObstacle(obs))
            })

            obstacleList.forEach(obs => {
                player.hypothesesList.forEach(hyp => hyp.isGoingToCollideWithObstacle(obs))
            })

        })
        
        
        players.forEach(player => {
            player.hypothesesList.forEach(hyp => {
                hyp.draw()
            });
        })

        
        obstacleList.forEach(obs => {
            obs.update();
            obs.draw();
            // console.log(obs)
        })        

        
        p5.fill(goalColor())
        p5.stroke(goalColor())
        p5.rect(goalPosList[mazeCount][0], goalPosList[mazeCount][1], goalPosList[mazeCount][2] - goalPosList[mazeCount][0], goalPosList[mazeCount][3] - goalPosList[mazeCount][1])
        
        
        
        p5.stroke(p5.color('black'))
        walls.forEach(function(wall, ) {
            wall.update();
            wall.draw()
        });
        
        p5.textSize(30)
        p5.fill(0)
        p5.stroke(0)
        p5.strokeWeight(0)

        if (altMode) {
            p5.text("History", 100, 100)
        } else {
            p5.text("P1 History", 100, 100)
            p5.text("P2 History", 1400, 100)
        }

        p5.text(players[0].score, 20, 50)
        p5.text(players[1].score, 1650, 50)
 
        let keyboardWidth = 630 // 625 : 136
        let keyboardHeight = 136
        let keyboardPos = p5.createVector(worldWidth / 2 - keyboardWidth / 2, worldHeight - keyboardHeight)
        let keySize = 40
        
        let offsetX = [1, 22, 37]
        let offsetY = [1, 8, 14]
        let highlightColor = p5.color('yellow')

        for (let j = 0; j < keys[0].length; j++) {
            for (let i = 0; i < keys[0][j].length + keys[1][j].length; i++) {
                p5.fill(playerColors[0])
                
                if (i >= keys[0][j].length) { p5.fill(playerColors[1]) }

                if (randomKeys && !players[0].keyCoords.some(coord => JSON.stringify([j, i]) === JSON.stringify(coord)) && 
                !players[1].keyCoords.some(coord => JSON.stringify([j, i]) === JSON.stringify([coord[0], coord[1] + keys[0][j].length]))) {
                    p5.fill('black')
                }

                highlightGrid.forEach(coord => {
                    if (coord[0] === j && coord[1] === i) { p5.fill(highlightColor) }
                })


                removedKeyCoords.forEach(coord => {
                    console.log(coord)
                    if (coord[0] === j && coord[1] === i) { p5.fill('black') }
                })

                p5.rect(keyboardPos.x + (keySize + 9) * i + offsetX[j], keyboardPos.y + keySize * j + offsetY[j], keySize, keySize)
            }
        }
    


        p5.image(keyboard, keyboardPos.x, keyboardPos.y, keyboardWidth, keyboardHeight);
        
        // console.log(history[0])

        players.forEach(player => {
            player.history.slice().reverse().forEach((his, i)   => {
                var dir = getDirection(his)
                let yOffset = 100
                let xOffset = 1300
    
                p5.fill(255)
                p5.strokeWeight(1)
                p5.textSize(24)
                p5.rect(140 + xOffset * player.index, 160 + yOffset * i, 30, 30) // up
                p5.rect(180 + xOffset * player.index, 200 + yOffset * i, 30, 30) // right
                p5.rect(140 + xOffset * player.index, 200 + yOffset * i, 30, 30) // down
                p5.rect(100 + xOffset * player.index, 200 + yOffset * i, 30, 30) // left
                p5.fill(0)
                p5.strokeWeight(0)    
                p5.text(dir[0], 147 + xOffset * player.index, 182 + yOffset * i) // up
                p5.text(dir[1], 187 + xOffset * player.index, 222 + yOffset * i) // right
                p5.text(dir[2], 147 + xOffset * player.index, 222 + yOffset * i) // down
                p5.text(dir[3], 107 + xOffset * player.index, 222 + yOffset * i) // left
            })
        })
    }

    function createAgents(mapping, i) {
        var agent = new Agent(p5.createVector(startPosList[mazeCount][0] - (!startingDirectionList[mazeCount] ? agentSize/2 - 20 + 40 * i : 0), startPosList[mazeCount][1] - (startingDirectionList[mazeCount] ? agentSize/2 - 20 + 40 * i : 0)), mapping, agentSpeed, agentSize, agentWeight, playerColors[i], i)
        players[i].hypothesesList.push(agent)
    }

    function generateRandomKeys() {
        players.forEach(player => {
            player.keys = []
            player.keyCoords = []
            let randomedNum = []
            let min = 0;
            let max = keys[player.index].reduce((count, row) => { return count + row.length } , 0) - 1
            while (randomedNum.length < 4) {
                let x = Math.floor(min + Math.random() * (max - min + 1));

                if (!randomedNum.includes(x)) 
                    randomedNum.push(x)
            }
            randomedNum.forEach(num => {
                let row = 0;
                while (num >= keys[player.index][row].length) {
                    num -= keys[player.index][row++].length
                }
                player.keys.push(keys[player.index][row][num])
                player.keyCoords.push([row, num])
                
            })
        })
    }
    
    function getDirection(direction) { // returned list order: up right down left
        var list = []
        direction.forEach((cord) => {
            if (cord["y"] === -1) { list.push("w") }
            else if (cord["y"] === 1) { list.push("s") }
            else if (cord["x"] === -1) { list.push("a") }
            else if (cord["x"] === 1) { list.push("d") }
        })
        return list
    }
    
    function goalColor() {
        return p5.color('green');
    }
        
    function delta_from_action_and_mapping(actionList, mapping) {
        var delta_pos = p5.createVector(0, 0);
        for (const [index, isPressed] of actionList.entries()) {
            if (isPressed) {
                delta_pos.add(mapping[index])
            }
        }
        return delta_pos
    }
    

    p5.keyPressed = () => {
        // console.log("AWIDJOAWD")
        let playerIndex = -1

        keys.forEach((playerKeyset, index) => {
            if (playerKeyset.some(row => row.includes(p5.key)))
                playerIndex = index
        })

        if (playerIndex === -1) { return false; }
        
        if (players[playerIndex].keys.length < 4 && !players[playerIndex].keys.includes(p5.key) && !removedKeys.includes(p5.key)) {
            console.log(players[playerIndex].keys)
            keys[playerIndex].forEach((row, rowIndex) => {
                row.forEach((key, colIndex) => {
                    if (key === p5.key) {
                        players[playerIndex].keys.push(key)
                        if (playerIndex === 1) {
                            colIndex += keys[0][rowIndex].length
                        }
                        players[playerIndex].keyCoords.push([rowIndex, colIndex])
                    }
                })
            })
            console.log(players[playerIndex].keys)
        }
        
        let i = 0;
        for (const [, val] of Object.entries(Direction)) {
            if (p5.key === players[playerIndex].keys[i]) {
                players[playerIndex].currentActionDict[val] = true
                let col = playerIndex === 1 ? players[playerIndex].keyCoords[i][1] +  keys[0][players[playerIndex].keyCoords[i][0]].length: players[playerIndex].keyCoords[i][1];
                highlightGrid.push([players[playerIndex].keyCoords[i][0], col])
            }
            i++
        }
        
        return false;
    }
    
    p5.keyReleased = () => {
        players.forEach((player) => {
            let i = 0
            for (const [, val] of Object.entries(Direction)) {
                if (p5.key === player.keys[i]) {
                    player.currentActionDict[val] = false
                    highlightGrid.splice(highlightGrid.indexOf(player.keyCoords[i]), 1)
                }
                i++
            }
        })

    }

    
}



