/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Felipe Vaiano Calderan - Programmer
 * Twitter: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 * Twitter: @andrart7
 * E-mail: wesleymatos1989@gmail.com
 *
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

/* Define at which point in time (delay or dl) an action (act) happens
 * "t" means turn all non-falling squares
 * "b" means turn all non-falling squares and spawn 2 new squares
 * "f" means turn all non-falling squares and finish
*/
const steps = [
    {act: "t", dl: 0.000}, {act: "t", dl: 0.375}, {act: "t", dl: 0.750},
    {act: "t", dl: 1.125}, {act: "b", dl: 1.500}, {act: "t", dl: 2.000},
    {act: "t", dl: 2.375}, {act: "t", dl: 2.750}, {act: "t", dl: 3.125},
    {act: "b", dl: 3.500}, {act: "t", dl: 4.000}, {act: "t", dl: 4.375},
    {act: "t", dl: 4.750}, {act: "t", dl: 5.125}, {act: "b", dl: 5.500},
    {act: "t", dl: 6.000}, {act: "t", dl: 6.375}, {act: "t", dl: 6.750},
    {act: "t", dl: 7.125}, {act: "b", dl: 7.500}, {act: "t", dl: 8.000},
    {act: "t", dl: 8.375}, {act: "t", dl: 8.750}, {act: "t", dl: 9.125},
    {act: "b", dl: 9.500}, {act: "t", dl: 10.000}, {act: "t", dl: 10.375},
    {act: "t", dl: 10.750}, {act: "t", dl: 11.125}, {act: "b", dl: 11.500},
    {act: "t", dl: 12.000}, {act: "t", dl: 12.375}, {act: "t", dl: 12.750},
    {act: "t", dl: 13.125}, {act: "b", dl: 13.500}, {act: "t", dl: 14.000},
    {act: "t", dl: 14.375}, {act: "t", dl: 14.750}, {act: "t", dl: 15.125},
    {act: "b", dl: 15.500}, {act: "t", dl: 16.000}, {act: "t", dl: 16.125},
    {act: "t", dl: 16.375}, {act: "t", dl: 16.625}, {act: "b", dl: 16.875},
    {act: "t", dl: 18.000}, {act: "t", dl: 18.125}, {act: "t", dl: 18.375},
    {act: "t", dl: 18.625}, {act: "b", dl: 18.875}, {act: "t", dl: 20.000},
    {act: "t", dl: 20.125}, {act: "t", dl: 20.375}, {act: "t", dl: 20.625},
    {act: "b", dl: 20.875}, {act: "t", dl: 22.000}, {act: "t", dl: 22.125},
    {act: "t", dl: 22.375}, {act: "t", dl: 22.625}, {act: "b", dl: 22.875},
    {act: "t", dl: 24.000}, {act: "t", dl: 24.125}, {act: "t", dl: 24.375},
    {act: "t", dl: 24.625}, {act: "b", dl: 24.875}, {act: "t", dl: 26.000},
    {act: "t", dl: 26.125}, {act: "t", dl: 26.375}, {act: "t", dl: 26.625},
    {act: "b", dl: 26.875}, {act: "t", dl: 28.000}, {act: "t", dl: 28.125},
    {act: "t", dl: 28.375}, {act: "t", dl: 28.625}, {act: "b", dl: 28.875},
    {act: "t", dl: 30.000}, {act: "t", dl: 30.125}, {act: "t", dl: 30.375},
    {act: "t", dl: 30.625}, {act: "b", dl: 30.875}, {act: "t", dl: 40.000},
    {act: "t", dl: 40.375}, {act: "t", dl: 40.750}, {act: "t", dl: 41.125},
    {act: "b", dl: 41.500}, {act: "t", dl: 42.000}, {act: "t", dl: 42.125},
    {act: "t", dl: 42.375}, {act: "t", dl: 42.625}, {act: "b", dl: 42.875},
    {act: "t", dl: 44.000}, {act: "t", dl: 44.375}, {act: "t", dl: 44.750},
    {act: "t", dl: 45.125}, {act: "b", dl: 45.500}, {act: "t", dl: 46.000},
    {act: "t", dl: 46.125}, {act: "t", dl: 46.375}, {act: "t", dl: 46.625},
    {act: "b", dl: 46.875}, {act: "t", dl: 48.000}, {act: "t", dl: 48.375},
    {act: "t", dl: 48.750}, {act: "t", dl: 49.125}, {act: "b", dl: 49.500},
    {act: "t", dl: 50.000}, {act: "t", dl: 50.125}, {act: "t", dl: 50.375},
    {act: "t", dl: 50.625}, {act: "b", dl: 50.875}, {act: "t", dl: 52.000},
    {act: "t", dl: 52.375}, {act: "t", dl: 52.750}, {act: "t", dl: 53.125},
    {act: "b", dl: 53.500}, {act: "t", dl: 54.000}, {act: "t", dl: 54.125},
    {act: "t", dl: 54.375}, {act: "t", dl: 54.625}, {act: "b", dl: 54.875},
    {act: "t", dl: 56.000}, {act: "t", dl: 56.125}, {act: "t", dl: 56.375},
    {act: "t", dl: 56.625}, {act: "b", dl: 56.875}, {act: "t", dl: 58.000},
    {act: "t", dl: 58.375}, {act: "t", dl: 58.750}, {act: "t", dl: 59.125},
    {act: "b", dl: 59.500}, {act: "t", dl: 60.000}, {act: "t", dl: 60.125},
    {act: "t", dl: 60.375}, {act: "t", dl: 60.625}, {act: "b", dl: 60.875},
    {act: "t", dl: 62.000}, {act: "t", dl: 62.375}, {act: "t", dl: 62.750},
    {act: "t", dl: 63.125}, {act: "b", dl: 63.500}, {act: "t", dl: 64.000},
    {act: "t", dl: 64.125}, {act: "t", dl: 64.375}, {act: "t", dl: 64.625},
    {act: "b", dl: 64.875}, {act: "t", dl: 66.000}, {act: "t", dl: 66.375},
    {act: "t", dl: 66.750}, {act: "t", dl: 67.125}, {act: "b", dl: 67.500},
    {act: "t", dl: 68.000}, {act: "t", dl: 68.125}, {act: "t", dl: 68.375},
    {act: "t", dl: 68.625}, {act: "b", dl: 68.875}, {act: "t", dl: 70.000},
    {act: "t", dl: 70.375}, {act: "t", dl: 70.750}, {act: "t", dl: 71.125},
    {act: "f", dl: 71.500}
]

// Instances
let camPos;
let camFocus;
let launcher;
let textureTrack;
let rhythmTimer;
let textTutorial;
let textScore;
let textGameOver;

// List of instances
let squareSpawns;
let geometries;

// Global objects
let camera;
let keyboard;

// Settings
const TURNSPEED = 0.125; // How fast the squares turn

// Gameplay variables
let gameStarted; // Did the player start the game?
let gameOver; // Is the game over?
let score; // Current score

// List getters
const getSquares = (runtime) => runtime.objects.Square.getAllInstances();
const getBolts = (runtime) => runtime.objects.Bolt.getAllInstances();

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Things that happen before the layout starts
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e, runtime));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Get instances
    camPos = runtime.objects.CameraPos.getFirstInstance();
    camFocus = runtime.objects.CameraFocus.getFirstInstance();
    launcher = runtime.objects.Launcher.getFirstInstance();
    textureTrack = runtime.objects.TextureTrack.getFirstInstance();
    rhythmTimer = runtime.objects.RhythmTimer.getFirstInstance();
    textTutorial = runtime.objects.TextTutorial.getFirstInstance();
    textScore = runtime.objects.TextScore.getFirstInstance();
    textGameOver = runtime.objects.TextGameOver.getFirstInstance();
    
    // Get list of instances
    squareSpawns = runtime.objects.SquareSpawn.getAllInstances();
    geometries = runtime.objects.Geometry.getAllInstances();
    
    // Get global objects
    camera = runtime.objects.Camera3D;
    keyboard = runtime.keyboard;
    
    // Configure initial parameters for the game
    setupGame(runtime);
}

function onKeyDown(e, runtime) {
    // Check if [Space] has been pressed
    
    // If the game has already started (and is not over), control the launcher
    if (gameStarted && !gameOver) {
        if (e.key == " " && launcher.instVars.ready) {
            launcher.instVars.ready = false;
            launcher.behaviors.Tween.startTween(
                "z-elevation", launcher.zElevation - 16, 0.1, "in-back",
                {pingPong: true}
            )
        }

    // Start the game if it hasn't already
    } else if (!gameStarted) {
        if (e.key == " ") {
            // Set the game as started
            gameStarted = true;
            
            // Play the music using an event sheet function for simplicity
            runtime.callFunction("musicplay");
            
            // Start the rhythm timers
            for (let i = 0; i < steps.length; i++) {
                rhythmTimer.behaviors.Timer.startTimer(
                    steps[i].dl, "step" + i, "once"
                );
            }
            rhythmTimer.behaviors.Timer.addEventListener(
                "timer", e => processRhythm(e, runtime)
            );
            
            // Hide the tutorial
            textTutorial.behaviors.Tween.startTween(
                "opacity", 0, 0.5, "in-out-sine"
            );
            
            // Show score
            textScore.behaviors.Tween.startTween(
                "opacity", 1, 0.5, "in-out-sine"
            );
        }
        
    // If the game is over, restart it
    } else if (gameOver) {
        if (e.key == " ") {
            runtime.goToLayout(1);
        }
    }
}

function setupGame(runtime) {
    // Set initial game configuration
    
    // Set variables
    gameStarted = false;
    gameOver = false;
    score = 0;
    
    // Set camera
    camera.lookAtPosition(
        camPos.x, camPos.y, camPos.zElevation,
        camFocus.x, camFocus.y, camFocus.zElevation,
        0, 1, 0
    );
    
    // Sapawn initial squares
    spawnSquares(runtime);
}

function onTick(runtime) {
    // Code to run every tick
    
    launcherBoltCollision(runtime);
    boltSquareCollision(runtime);
    scrollFallingSquares(runtime);
    // Scroll track
    textureTrack.imageOffsetY += 0.5 * 60 * runtime.dt;
}

function launcherBoltCollision(runtime) {
    // Check collision between the launcher and the bolt

    // Check if the launcher is pushing the bolt
    if (launcher.zElevation < 236) {
    
        for (const bolt of getBolts(runtime)) {
        
            // Bolt must be idle
            if (bolt.instVars.state == "idle") {
            
                // Launch bolt to the other side of the map and set the state
                bolt.behaviors.Tween.startTween(
                    "z-elevation", 0, 0.28, "linear"
                )
                bolt.instVars.state = "launched";
                
                // Auto-destroy after a while
                bolt.behaviors.Timer.startTimer(0.5, "destroy", "once");
                bolt.behaviors.Timer.addEventListener(
                    "timer", e => {
                        if (e.tag == "destroy") {
                            bolt.behaviors.Tween.startTween(
                                "opacity", 0, 1, "in-out-sine",
                                {destroy: true}
                            );
                        }
                    }
                );
                
                // Create new bolt
                const newBolt = runtime.objects.Bolt.createInstance(
                    "World", 160, 84
                );
                newBolt.behaviors.Timer.startTimer(
                    TURNSPEED*2, "showup", "once"
                );
                newBolt.instVars.state = "spawning";
                newBolt.setSize(0, 0);
                newBolt.zElevation = 226;
                
                // Make new bolt ready to be launched and reset launcher
                newBolt.behaviors.Timer.addEventListener(
                    "timer", e => {
                        if (e.tag == "showup") {
                            launcher.instVars.ready = true;
                            newBolt.instVars.state = "idle";
                            newBolt.behaviors.Tween.startTween(
                                "scale", [1, 1], TURNSPEED/2, "in-out-sine"
                            );
                        }
                    }
                );
            }
        }
    }
}

function boltSquareCollision(runtime) {
    // Check collision between the bolt and the square
    
    for (const bolt of getBolts(runtime)) {
    
        // Only launched bolts are relevant
        if (bolt.instVars.state != "launched") {
            continue;
        }
    
        let parentSquare;

        // Conditions for a valid collision
        let cond1;
        let cond2;
        for (const s of getSquares(runtime)) {
            if (s.x == 160 && s.y == 83.9) {
                cond1 = bolt.zElevation >= s.zElevation - 6;
                cond2 = bolt.zElevation <= s.zElevation + 6;
                parentSquare = s;
                break;
            }
        }

        /* If conditions are true, the bolt stops, changes state to merged,
         * becomes child of square and player's score is updated
         */
        if (cond1 && cond2) {
            for (const t of bolt.behaviors.Tween.allTweens()) {
                t.stop();
                bolt.behaviors.Timer.stopAllTimers();
                bolt.instVars.state = "merged";
                parentSquare.addChild(
                    bolt,
                    {
                        transformX: true,
                        transformY: true,
                        transformZElevation: true,
                        destroyWithParent: true
                    }
                );
            }
            score++;
            textScore.text = ("Score: " + score);
        }
    }
}

function scrollFallingSquares(runtime) {
    // Scrolls
    
    for (const s of getSquares(runtime)) {
        if (s.instVars.falling) {
            // Scroll back the square
            s.zElevation -= 1.6 * 60 * runtime.dt;
            
            // Check if the square has to move down to simulate falling
            const fallZElev = (s.instVars.side == "left" ? 156 : 152);
            if (s.zElevation < fallZElev && s.y < 132) {
                s.y += 4 * 60 * runtime.dt;
            }
            
            // If the square is out of bounds, destroy it
            if (s.zElevation < 0) {
                s.destroy();
            }
        }
    }
}

function spawnSquares(runtime) {
    // Spawn 2 new squares on SquareSpawns
    
    for (const ss of squareSpawns) {
        // Create the square
        const s = runtime.objects.Square.createInstance("World", ss.x, ss.y);
        
        // Set elevation and side
        s.zElevation = ss.zElevation;
        s.instVars.side = ss.instVars.side;
        
        // Depending on the side, it rolls to a specific direction
        const sign = s.instVars.side == "right" ? -1 : 1;
        s.behaviors.Tween.startTween(
            "angle", s.angle + Math.PI/4 * sign, TURNSPEED, "in-out-cubic"
        );
        s.behaviors.Tween.startTween(
            "x", s.x + 16 * sign, TURNSPEED, "in-out-cubic"
        );
    }
}

function turnSquares(runtime) {
    // Turn the squares
    
    for (const s of getSquares(runtime)) {
    
        let turnAngle;
        let moveDistance;
        let heightAdjust;
        
        // If the square is still rotating/moving, snap to next position
        for (const t of s.behaviors.Tween.allTweens()) {
            if (t.isPlaying) {
                t.stop();
                // Intermediate positions
                if (s.instVars.nTurns < 4) {
                    s.angle = Math.PI/4;
                    if (s.instVars.side == "left") {
                        s.x = 88 + (s.instVars.nTurns) * 16;
                    } else {
                        s.x = 232 - (s.instVars.nTurns) * 16;
                    }
                // Final position
                } else {
                    s.angle = 0;
                    s.x = 160;
                }
            }
        }

        // Squares move differently depending on how many times they moved
        if (s.instVars.nTurns < 4) {
            turnAngle = Math.PI/2;
            moveDistance = 16;
            heightAdjust = 0;
        } else if (s.instVars.nTurns == 4) {
            turnAngle = Math.PI/4;
            moveDistance = 8;
            heightAdjust = 3;
            s.behaviors.Timer.startTimer(TURNSPEED, "fall", "once");
            s.behaviors.Timer.addEventListener(
                "timer", () => s.instVars.falling = true
            );
        } else {
            continue;
        }
        
        // Side of the square decides the direction of the movement
        const sign = s.instVars.side == "right" ? -1 : 1;
    
        // Apply the movements
        s.behaviors.Tween.startTween(
            "angle", s.angle + turnAngle * sign, TURNSPEED, "linear"
        );
        s.behaviors.Tween.startTween(
            "x", s.x + moveDistance * sign, TURNSPEED, "linear"
        );
        s.behaviors.Tween.startTween(
            "y", s.y + heightAdjust, TURNSPEED, "linear"
        );
        
        // Increment the amount of turns
        s.instVars.nTurns++;
    }
}

function processRhythm(e, runtime) {
    // Process the rhythm (turn and spawn squares)
    
    // Get current state
    const now = Number(e.tag.substr(4));
    
    // Process current state's action
    switch (steps[now].act) {
        // "b" means turn all non-falling squares and spawn 2 new squares
        case "b":
            turnSquares(runtime);
            spawnSquares(runtime);
            changeHUE(runtime);
            break;
            
        // "t" means turn all non-falling squares
        case "t":
            turnSquares(runtime);
            break;
            
        // "f" means turn all non-falling squares and finish
        case "f":
            changeHUE(runtime);
            turnSquares(runtime);
            setTimeout(() => {
                gameOver = true;
                textGameOver.text = "Your Score: " + score +
                                    "\nPress [Space] to restart...";
                textGameOver.behaviors.Tween.startTween(
                    "opacity", 1, 0.5, "in-out-sine"
                );
                
                textScore.behaviors.Tween.startTween(
                    "opacity", 0, 0.5, "in-out-sine"
                );
            }, 2000);
            break;
    }
}

function changeHUE(runtime) {
    // Change geometries HUE
    
    for (const g of geometries) {
        const fx = g.effects[0];
        const newHUE = (fx.getParameter(0) >= 2.0 ? -1.9 : 0.1);
        fx.setParameter(0, fx.getParameter(0) + newHUE);
    }
} 