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

// These variables store object instances that are referenced later.
let player;
let playerAnimation;
let playerSprite;
let cameraPosition;
let generator;
let circuit;
let transparentDucts;
let endOfLevel;
let noMapChange;
let textTutorial;
let textVictory;
let fader;

// List of instances
let grounds;
let walls;
let obstacles;
let doors;
let buttons;

// Global objects
let camera;
let keyboard;

// Timer behavior (from the object Timer)
let timer;

// Dictionary of texture objects
let textures;
let texButtonOff;
let texButtonOn;

// Gameplay variables
let currMap; // Current map (can be swapped pressing Space)
let changingMap; // Is the map currently changing?
let solvedButtonsPuzzle; // Did the player solve the buttons puzzle?

// Constants
const PLAYERSPRITEWIDTH = 32; // How wide the player is
const MAPCHANGETIME = 0.4; // The amount of time divided by 2 to change maps
const OUTDIST = 2000; // Distance to be added to hidden objects
const CDIST = 1280; // Distance objects go when changing maps
const FLOORLVL = 8; // Floor level

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e));
    
    // Things that happen before the layout starts
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {

    // Shorthand for runtime.objects
    const ro = runtime.objects;
    
    // Get instances
    player = ro.Player.getFirstInstance();
    playerAnimation = ro.PlayerAnimation.getFirstInstance();
    playerSprite = ro.PlayerSprite.getFirstInstance();
    cameraPosition = ro.CameraPosition.getFirstInstance();
    generator = ro.Generator.getFirstInstance();
    circuit = ro.Circuit.getFirstInstance();
    transparentDucts = ro.TransparentDucts.getFirstInstance();
    endOfLevel = ro.EndOfLevel.getFirstInstance();
    noMapChange = ro.NoMapChange.getFirstInstance();
    textTutorial = ro.TextTutorial.getFirstInstance();
    textVictory = ro.TextVictory.getFirstInstance();
    fader = ro.Fader.getFirstInstance();
    
    // Get timer behavior
    timer = ro.Timer.getFirstInstance().behaviors.Timer;
    
    // Get list of instances
    grounds = ro.Ground.getAllInstances();
    walls = ro.Wall.getAllInstances();
    obstacles = ro.Obstacle.getAllInstances();
    doors = ro.Door.getAllInstances();
    buttons = ro.Button.getAllInstances();
    
    // IObjectInterfaces
    //...
    
    // Get global objects
    keyboard = runtime.keyboard;
    camera = ro.Camera3D;
    
    // Textures
    textures = {
        "TexFloorFront" : ro.TexFloorFront.getFirstInstance(),
        "TexFloorLeftRight" : ro.TexFloorLeftRight.getFirstInstance(),
        "TexFloorTopBottom" : ro.TexFloorTopBottom.getFirstInstance(),
        "TexWall0BottomTop" : ro.TexWall0BottomTop.getFirstInstance(),
        "TexWall0BackFront" : ro.TexWall0BackFront.getFirstInstance(),
        "TexWall0LeftRight" : ro.TexWall0LeftRight.getFirstInstance(),
        "TexWall1BottomTop" : ro.TexWall1BottomTop.getFirstInstance(),
        "TexWall1BackFront" : ro.TexWall1BackFront.getFirstInstance(),
        "TexWall1LeftRight" : ro.TexWall1LeftRight.getFirstInstance(),
        "TexWall2BottomTop" : ro.TexWall2BottomTop.getFirstInstance(),
        "TexWall2BackFront" : ro.TexWall2BackFront.getFirstInstance(),
        "TexWall2LeftRight" : ro.TexWall2LeftRight.getFirstInstance(),
        "TexWall3BottomTop" : ro.TexWall3BottomTop.getFirstInstance(),
        "TexWall3BackFront" : ro.TexWall3BackFront.getFirstInstance(),
        "TexWall3LeftRight" : ro.TexWall3LeftRight.getFirstInstance(),
        "TexWall4BottomTop" : ro.TexWall4BottomTop.getFirstInstance(),
        "TexWall4BackFront" : ro.TexWall4BackFront.getFirstInstance(),
        "TexWall4LeftRight" : ro.TexWall4LeftRight.getFirstInstance(),
        "TexBoxSides" : ro.TexBoxSides.getFirstInstance(),
        "TexBoxTop" : ro.TexBoxTop.getFirstInstance(),
        "TexDuctBackFront" : ro.TexDuctBackFront.getFirstInstance(),
        "TexDuctLeftRight" : ro.TexDuctLeftRight.getFirstInstance(),
        "TexDuctBottomTop" : ro.TexDuctBottomTop.getFirstInstance(),
        "TexExitRest": ro.TexExitRest.getFirstInstance(),
        "TexExitBottomTop" : ro.TexExitBottomTop.getFirstInstance(),
        "Circuit" : ro.Circuit.getFirstInstance()
    };
    texButtonOff = ro.TexButtonOff;
    texButtonOn = ro.TexButtonOn;
    
    // Set initial settings for the game
    setupGame();
}

function setupGame() {
    // This function sets up the game after it just (re)started

    // Initial camera position
    camera.lookAtPosition(
        player.x, cameraPosition.y, cameraPosition.zElevation,
        player.x, player.y/2, player.zElevation,
        0, 0, 1
    );
    
    // Current map
    currMap = 0;
    
    // Map is not changing right now
    changingMap = false;
    
    // Buttons puzzle started unsolved
    solvedButtonsPuzzle = false;
    
    // Hide fader
    fader.behaviors.Tween.startTween("opacity", 0, 0.5, "out-sine");
}

function onKeyDown(e) {
    // Process player inputs
    
    // Hide the tutorial
    if (e.key == " " && textTutorial.opacity > 0) {
        textTutorial.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );
    }

    /* Change maps. If an object is even, it will follow a specified path when
     * there is a change of map, else (if it is odd), it will follow another
     * path. This makes the map change animation more interesting
     */
    if (
        e.key == " " && !changingMap &&
        textTutorial.opacity == 0 && fader.opacity == 0
    ) {
        
        // NoMapChange area blocks the player from changing maps
        if (player.testOverlap(noMapChange)) {
            return;
        }
    
        currMap = +!currMap;
        
        // Start transition timer and player enters immovable state
        timer.startTimer(MAPCHANGETIME, "goAway", "once");
        changingMap = true;
        player.behaviors.EightDirection.isEnabled = false;
        player.behaviors.EightDirection.vectorX = 0;
        player.behaviors.EightDirection.vectorY = 0;
        
        // Move grounds
        for (const g of grounds) {
            g.behaviors.Tween.startTween(
                "x", g.instVars.posX + (g.instVars.isEven ? CDIST : -CDIST),
                MAPCHANGETIME, "in-sine", {"pingPong" : true}
            );
            g.behaviors.Tween.startTween(
                "opacity", 0, MAPCHANGETIME,
                "in-out-sine", {"pingPong" : true}
            );
        }
        
        // Move walls
        for (const w of walls) {
            w.behaviors.Tween.startTween(
                "z-elevation", (w.instVars.isEven ? CDIST : -CDIST),
                MAPCHANGETIME, "in-sine", {"pingPong" : true}
            );
            w.behaviors.Tween.startTween(
                "opacity", 0, MAPCHANGETIME,
                "in-out-sine", {"pingPong" : true}
            );
        }
        
        // Move obstacles
        for (const o of obstacles) {
             o.behaviors.Tween.startTween(
                "z-elevation", (o.instVars.isEven ? CDIST : -CDIST),
                MAPCHANGETIME, "in-sine", {"pingPong" : true}
            );
            o.behaviors.Tween.startTween(
                "opacity", 0, MAPCHANGETIME,
                "in-out-sine", {"pingPong" : true}
            );
        }
        
        // Move buttons
        for (const b of buttons) {
             b.behaviors.Tween.startTween(
                "z-elevation", (b.instVars.isEven ? CDIST : -CDIST),
                MAPCHANGETIME, "in-sine", {"pingPong" : true}
            );
            b.behaviors.Tween.startTween(
                "opacity", 0, MAPCHANGETIME,
                "in-out-sine", {"pingPong" : true}
            );
        }
        
        // Move doors
        for (const d of doors) {
            d.behaviors.Tween.startTween(
                "z-elevation", (d.instVars.isEven ? CDIST : -CDIST),
                MAPCHANGETIME, "in-sine", {"pingPong" : true}
            );
            d.behaviors.Tween.startTween(
                "opacity", 0, MAPCHANGETIME,
                "in-out-sine", {"pingPong" : true}
            );
        }
        
        // Move generator
        generator.behaviors.Tween.startTween(
            "z-elevation", -CDIST, MAPCHANGETIME,
            "in-sine", {"pingPong" : true}
        );
        generator.behaviors.Tween.startTween(
            "opacity", 0, MAPCHANGETIME,
            "in-out-sine", {"pingPong" : true}
        );
        
        // Move Circuit
        circuit.behaviors.Tween.startTween(
            "z-elevation", CDIST, MAPCHANGETIME,
            "in-sine", {"pingPong" : true}
        );
        circuit.behaviors.Tween.startTween(
            "opacity", 0, MAPCHANGETIME,
            "in-out-sine", {"pingPong" : true}
        );
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    processPlayerInteractions(runtime);
    processTimerEvents();
    setPlayerAnimation();
    setCamera();
}

function processPlayerInteractions(runtime) {
    // Player interactions with objects
    
    // If the player is behind ducts, make the ducts transparent
    for (const o of obstacles) {
        if (o.x == 80 && o.instVars.presentInMaps == 1) {
            if (player.testOverlap(transparentDucts)) {
                o.opacity = 0.4;
            } else {
                o.opacity = 1.0;
            }
        }
    }

    // If the player ends up inside an obstacle, die
    for (const o of obstacles) {
        if (player.testOverlap(o) && o.behaviors.Solid.isEnabled) {
            o.behaviors.Solid.isEnabled = false;
            player.behaviors.EightDirection.isEnabled = false;
            fader.behaviors.Tween.startTween("opacity", 1, 0.5, "in-sine");
            setTimeout(() => runtime.goToLayout("Game"), 1000);
        }
    }
    
    // When the player gets close to the generator, open the initial door
    if (dist2D(player.x, player.y, generator.x, generator.y) < 16) {
        for (const d of doors) {
            if (d.instVars.doorID == 0 && !d.instVars.isOpen) {
                d.behaviors.Tween.startTween("y", d.y - 48, 0.25, "in-sine");
                d.instVars.isOpen = true;
            }
        }
    }
    
    // Check if player pressed a button
    let bLvls = [FLOORLVL, FLOORLVL, FLOORLVL, FLOORLVL]; // zElev of each btn
    const correctLvls = [
        FLOORLVL, FLOORLVL - 3, FLOORLVL - 3, FLOORLVL - 3, FLOORLVL - 3
    ]; // correct combination of elevations for the buttons
    playerSprite.zElevation = FLOORLVL; // Assume player at floor level
    
    for (const b of buttons) {
        // Player is on top of the current button
        if (player.testOverlap(b)) {
            if (!b.instVars.playerOnTop && !solvedButtonsPuzzle) {
                
                // Press / release the button
                if (b.zElevation == FLOORLVL) {
                    b.zElevation = FLOORLVL - 3;
                } else {
                    b.zElevation = FLOORLVL;
                }
                
                // Player is currently on top of the button
                b.instVars.playerOnTop = true;
                
                b.setFaceObject(
                    "front", 
                    b.zElevation == FLOORLVL ? texButtonOff : texButtonOn
                ); // Use On/Off texture
                
            }
            // Make the player go up/down with the button
            playerSprite.zElevation = b.zElevation + b.zHeight;
            
        // Player is not on top of the current button
        } else {
            b.instVars.playerOnTop = false;
        }
        
        // Set the array of zElevations to the current button elevation
        bLvls[b.instVars.id] = b.zElevation;
    }
    
    // Check if the combination is correct
    if (JSON.stringify(bLvls) == JSON.stringify(correctLvls)) {
        for (const d of doors) {
            if (d.instVars.doorID == 1 && !d.instVars.isOpen) {
                d.behaviors.Tween.startTween("y", d.y - 48, 0.25, "in-sine");
                d.instVars.isOpen = true;
            }
        }
        solvedButtonsPuzzle = true;
    }
    
    // Player beat the level
    if (player.testOverlap(endOfLevel)) {
        endOfLevel.destroy();
        player.behaviors.EightDirection.vectorX = 0;
        player.behaviors.EightDirection.vectorY = 0;
        player.behaviors.EightDirection.isEnabled = false;
        textVictory.behaviors.Tween.startTween("opacity", 1, 1, "in-sine");
        fader.behaviors.Tween.startTween("opacity", 1, 1, "in-sine");
        setTimeout(() => runtime.goToLayout("Game"), 5000);
    }
}

function processTimerEvents() {
    // Check for timer events
    
    if (timer.hasFinished("goAway")) {
    
        // Map is changing, therefore, change textures
        for (const [_, v] of Object.entries(textures)) {
            v.setAnimation(currMap.toString());
        }
        
        // Leave only the correct obstacles for this map
        for (const o of obstacles) {
            if (o.instVars.presentInMaps != 2) {
                o.x = o.x < OUTDIST/2 ? o.x + OUTDIST : o.x - OUTDIST;
                o.behaviors.Solid.isEnabled = !o.behaviors.Solid.isEnabled;
            }
        }
        
        // Leave only the correct buttons for this map
        for (const b of buttons) {
            if (b.instVars.presentInMaps != 2) {
                b.x = b.x < OUTDIST/2 ? b.x + OUTDIST : b.x - OUTDIST;
            }
        }
        
        
        timer.startTimer(MAPCHANGETIME, "comeBack", "once");
    }
    
    // Map is not changing anymore, so player can move again
     if (timer.hasFinished("comeBack")) {
        changingMap = false;
        player.behaviors.EightDirection.isEnabled = true;
    }
}

function setPlayerAnimation() {
    // Set player animation according to current movement
    
    // Shorthand for player's 8 Direction behavior
    const ed = player.behaviors.EightDirection;
    
    // Moving left
    if (ed.vectorX < 0) {
        playerAnimation.setAnimation("Move");
        playerSprite.width = -PLAYERSPRITEWIDTH;
    
    // Moving right
    } else if (ed.vectorX > 0.1) { // Fix floating point error
        playerAnimation.setAnimation("Move");
        playerSprite.width = PLAYERSPRITEWIDTH;
    
    // Moving up or down
    } else if (ed.vectorY != 0) {
        playerAnimation.setAnimation("Move");
    
    // Idle
    } else {
        playerAnimation.setAnimation("Idle");
    }
}

function setCamera() {
    // Camera moves when the player moves
    
    const cameraX = lerp(camera.getCameraPosition()[0], player.x, 0.1);
    const cameraLookX = lerp(
        camera.getLookPosition()[0], 320 + (player.x - 320)/1.3, 0.1
    );
    const cameraLookY = lerp(camera.getLookPosition()[1], player.y/2, 0.1);
    
    camera.lookAtPosition(
        cameraX, cameraPosition.y, cameraPosition.zElevation,
        cameraLookX, cameraLookY, player.zElevation,
        0, 0, 1
    );
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function dist2D(x1, y1, x2, y2) {
    // Helper function to return 2D euclidean distance between 2 points
    
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}