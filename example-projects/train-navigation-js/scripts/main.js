/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * E-mail: ferreiramoreiramateus@gmail.com | X: @BonzerKitten
 *
 * Felipe Vaiano Calderan - Programmer
 * E-mail: fvcalderan@gmail.com | X: @fvcalderan
 *
 * Wesley Andrade - Artist
 * E-mail: wesleymatos1989@gmail.com | X: @andrart7
 *
 * Help us make new examples by supporting our work on
 * https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Camera view variables
let camLookTheta;
let camLookPhi;
let camLookX;
let camLookY;
let camLookZ;    

// These variables store object instances that are referenced later
let player;
let playerSpawn;
let hudTextTutorial;
let hudTextPressSpace;
let fader;
let train;
let trainDoorTop;
let trainDoorBot;
let trainSafePlayerPos;
let dynWallTop;
let dynWallBot;
let groundStation;
let groundLimit;
let groundRail;
let ceilingStation;

// List of object instances
let rails;
let ceilingRail;
let waypoints;
let transitions;
let textures;
let tiledbgs;

// Global objects
let camera;
let mouse;
let keyboard;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Gameplay variables
let inputsEnabled; // Can the player do anything?
let transitionPlaying; // Is there a transition playing?
let currentFrame; // Current animation frame for textures

// Settings
const MOUSESENSITIVITY = 0.0025; // Mouse sensitivity

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
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseDown(e));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Shorthand for runtime.objects
    const ro = runtime.objects;
    
    // Get instances
    player = ro.Player.getFirstInstance();
    playerSpawn = ro.PlayerSpawn.getFirstInstance();
    hudTextTutorial = ro.HUDTextTutorial.getFirstInstance();
    hudTextPressSpace = ro.HUDTextPressSpace.getFirstInstance();
    fader = ro.Fader.getFirstInstance();
    train = ro.TrainBase.getFirstInstance();
    trainDoorTop = ro.TrainDoorTop.getFirstInstance();
    trainDoorBot = ro.TrainDoorBottom.getFirstInstance();
    trainSafePlayerPos = ro.TrainSafePlayerPos.getFirstInstance();
    dynWallTop = ro.DynWallTop.getFirstInstance();
    dynWallBot = ro.DynWallBottom.getFirstInstance();
    groundStation = ro.GroundStation.getFirstInstance();
    groundLimit = ro.GroundLimit.getFirstInstance();
    groundRail = ro.GroundRail.getFirstInstance();
    ceilingStation = ro.CeilingStation.getFirstInstance();
    
    // Get list of rails
    rails = ro.Rail.getAllInstances();
    ceilingRail = ro.CeilingRail.getAllInstances();
    
    // Get list of waypoints
    const allWpts = ro.TrainWaypoint.getAllInstances();
    waypoints = [];
    for (let i = 0; i < allWpts.length; i++) {
        for (const wpt of allWpts) {
            if (wpt.instVars.wptID == i) {
                waypoints.push(wpt);
            }
        }
    }
    
    // Get list of transitions
    transitions = ro.TrainTransition.getAllInstances();

    // Get all textures
    textures = [
        ro.TexLight_FB, ro.TexLight_LR, ro.TexLight_TB,
        ro.TexRail0, ro.TexRail1,
        ro.TexSeat_B, ro.TexSeat_F,
        ro.TexSeatArm_F, ro.TexSeatArm_LR, ro.TexSeatArm_TB,
        ro.TexSeatBack_F, ro.TexSeatBack_LR, ro.TexSeatBack_TB,
        ro.TexSign_BF, ro.TexSign_LR_A, ro.TexSign_LR_B, ro.TexSign_TB,
        ro.TexVendingMachine1_B, ro.TexVendingMachine1_F,
        ro.TexVendingMachine1_R, ro.TexVendingMachine1_T,
        ro.TexVendingMachine2_B, ro.TexVendingMachine2_F,
        ro.TexVendingMachine2_R, ro.TexVendingMachine2_T,
        ro.TexVent_BF, ro.TexVent_TB,
        ro.TexWall_128x80_inner, ro.TexWall_128x80_outer,
        ro.TexWall_224x80_inner, ro.TexWall_224x80_outer,
        ro.TexWall_32x80_inner, ro.TexWall_32x80_outer,
        ro.TexWall_288x16, ro.TexWall_544x96, ro.TexWall_640x16,
        ro.TexWall_896x96,
    ];
    
    // Get all tiled background textures
    tiledbgs = [
        [ro.TexGroundStation0, ro.TexGroundStation1],
        [ro.TexGroundLimit0, ro.TexGroundLimit1],
        [ro.TexGroundRail0, ro.TexGroundRail1],
        [ro.TexRail0, ro.TexRail1],
        [ro.TexCeilingStation0, ro.TexCeilingStation1],
        [ro.TexCeilingRail0, ro.TexCeilingRail1],
    ];
    
    // Get global objects
    camera = ro.Camera3D;
    keyboard = runtime.keyboard;
    mouse = runtime.mouse;
    
    // Configure initial parameters for the game
    setupGame(runtime);
    
    // Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
}

function setupGame(runtime) {
    // Setup the initial game state

    // Disable player's input and show tutorial
    inputsEnabled = false;
    
    // No transition starts playing
    transitionPlaying = false;
    
    // Current animation frame is 0
    currentFrame = 0;
    
    // Set player spawn position
    player.x = playerSpawn.x;
    player.y = playerSpawn.y;
    
    // Starting camera's spherical coordinates
    camLookTheta = Math.PI/2;
    camLookPhi = Math.PI/1.8;
    
    // Spherical coordinates converted to cartesian coordinates
    setCameraCartesian(camLookTheta, camLookPhi);
    
    // Set starting look position
    camera.lookAtPosition(
        player.x, player.y, player.zElevation + player.zHeight - 2,
        camLookX, camLookY, camLookZ, 0, 0, 1
    );
    
    // Set train initial position
    train.x = waypoints[train.instVars.currWpt].x;
    train.y = waypoints[train.instVars.currWpt].y;
    openDoor(trainDoorTop, dynWallBot);
    
    // Setup train move to event listener
    train.behaviors.MoveTo.addEventListener("arrived", e =>
    {
        // If waypoint is a train stop, open the appropriate door
        if (waypoints[train.instVars.currWpt].instVars.trainStop) {
            if (train.testOverlap(dynWallTop)) {
                openDoor(trainDoorBot, dynWallTop);
            } else {
                openDoor(trainDoorTop, dynWallBot);
            }
        
        // Otherwise, go to next waypoint
        } else {
            goToNextStation();
        }
    });
}

function onMouseDown(_) {
    // If mouse is not locket yet, lock it
    
    if (document.pointerLockElement !== mouseLocker) {
        mouseLocker.requestPointerLock();
    }
}

function onMouseMove(e) {
    // Process mouse movement
    
    // If inputs are disabled, ignore everything
    if (!inputsEnabled) {
        return;
    }
    
    // Set camera's spherical coordinates according to mouse movement
    camLookTheta += e.movementX * MOUSESENSITIVITY;
    camLookPhi = Math.max(
        Math.min(
            camLookPhi - e.movementY * MOUSESENSITIVITY, Math.PI - 0.1
        ), 0.1
    );
}

function onKeyDown(e) {
    // Check if a key has been pressed
    
    // [Space] Starts travel
    if (e.key == " " && inputsEnabled) {
        if (
            player.testOverlap(trainSafePlayerPos) &&
            !train.instVars.trainMoving
        ) {
        
            // Close doors
            closeDoor(trainDoorTop, dynWallBot);
            closeDoor(trainDoorBot, dynWallTop);
            
            // Attach player to the train
            train.addChild(player, {transformX: true, transformY: true});
            
            // Start moving
            train.instVars.trainMoving = true;
            goToNextStation();
        }
        
    // [Space] hides the tutorial and enables input
    } else if (e.key == " ") {
        inputsEnabled = true;
        hudTextTutorial.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );
        fader.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    setCamera3D();
    getKeyboardInputs();
    showPressSpaceMessage();
    playTransition(runtime);
}

function setCamera3D() {
    // Set camera position and rotation
    
    const camX = player.x; // Camera X
    const camY = player.y; // Camera Y
    const camZ = player.zElevation + player.zHeight;

    // Spherical coordinates converted to cartesian coordinates
    setCameraCartesian(camLookTheta, camLookPhi);
    
    // Apply camera settings
    camera.lookAtPosition(
        camX, camY, camZ,
        camX + camLookX,camY + camLookY, camZ + camLookZ,
        0, 0, 1
    );
}

function getKeyboardInputs() {
    // Get player's inputs
    
    // If inputs are disabled, ignore everything
    if (!inputsEnabled) {
        return;
    }
    
    // Shorthand for player's 8 Direction behavior
    const eightd = player.behaviors.EightDirection;

    // Directional inputs
    const inputRight = keyboard.isKeyDown("KeyD");
    const inputLeft = keyboard.isKeyDown("KeyA");
    const inputUp = keyboard.isKeyDown("KeyW");
    const inputDown = keyboard.isKeyDown("KeyS");
    
    // Compute axes
    const horizontalAxis = inputRight - inputLeft;
    const verticalAxis = inputUp - inputDown;
    
    // Move the player's object and increase bobbing if an axis is active
    if (horizontalAxis != 0 || verticalAxis != 0) {
        // Get the angle to move
        const axisAngle = Math.atan2(horizontalAxis, verticalAxis);
        
        // Set 8Direction movement vector
        eightd.setVector(
            Math.cos(camLookTheta + axisAngle) * eightd.maxSpeed,
            Math.sin(camLookTheta + axisAngle) * eightd.maxSpeed,
        )
    }
}

function showPressSpaceMessage() {
    // Show "press space" message when player overlaps trainSafePlayerPos

    const condition1 = player.testOverlap(trainSafePlayerPos);
    const condition2 = !train.instVars.trainMoving;
    hudTextPressSpace.isVisible = condition1 && condition2;
}

async function playTransition(runtime) {
    // Transition between textures and fog
    
    // If a transition is already playing, ignore.
    if (transitionPlaying)
        return;
    
    // Check if player is colliding with a transition block
    let collided = false;
    for (const t of transitions) {
        if (player.testOverlap(t)) {
            collided = true;
        }
    }
    
    if (!collided)
        return;
    
    // Inform that a transition is playing
    transitionPlaying = true;
    
    // Change current texture animation frame
    currentFrame = +!currentFrame;
    
    // Start fade out
    const fadeout = fader.behaviors.Tween.startTween(
        "opacity", 1, 1.0, "in-out-sine"
    );
    
    // Wait for fade out to finish
    await fadeout.finished;
    
    // Change all textures
    for (const t of textures) {
        t.getFirstInstance().animationFrame = currentFrame;
    }
    
    // Change all tiled background textures
    groundStation.setFaceObject("front", tiledbgs[0][currentFrame]);
    groundLimit.setFaceObject("front", tiledbgs[1][currentFrame]);
    groundRail.setFaceObject("front", tiledbgs[2][currentFrame]);
    for (const r of rails) {
        for (const f of ["front", "back", "left", "right", "top", "bottom"]) {
            r.setFaceObject(f, tiledbgs[3][currentFrame]);
        }
    }
    ceilingStation.setFaceObject("back", tiledbgs[4][currentFrame]);
     for (const r of ceilingRail) {
         r.setFaceObject("back", tiledbgs[5][currentFrame]);
     }
    
    // Show fog when currentFrame is 1, but hide it when currentFrame is 0
    runtime.getLayout(0).effects[0].isActive = currentFrame;
    
    // Fade back in
    const fadein = fader.behaviors.Tween.startTween(
        "opacity", 0, 1.0, "in-out-sine"
    );
    
    // Wait for fade in to finish
    await fadein.finished;
    
    // Inform that no transition is playing
    transitionPlaying = false;
}

async function openDoor(door, dynWall) {
    // Open train door
    
    // Start descending the door
    const t = door.behaviors.Tween.startTween(
        "z-elevation", -14, 1, "in-out-sine"
    );
    
    // Wait for the tween to finish
    await t.finished;
    
    // Disable collision
    door.behaviors.Solid.isEnabled = false;
    dynWall.behaviors.Solid.isEnabled = false;
    
    // Set train as stopped
    train.instVars.trainMoving = false;
}

async function closeDoor(door, dynWall) {
    // Close train door
    
    // Enable collision
    door.behaviors.Solid.isEnabled = true;
    dynWall.behaviors.Solid.isEnabled = true;
    
    // Start ascending the door
    door.behaviors.Tween.startTween(
        "z-elevation", 0, 1, "in-out-sine"
    );
}

function goToNextStation() {
    // Move train to the next station
    
    // Change current waypoint
    train.instVars.currWpt = (train.instVars.currWpt + 1) % waypoints.length;
    
    // Move to waypoint
    train.behaviors.MoveTo.moveToPosition(
        waypoints[train.instVars.currWpt].x,
        waypoints[train.instVars.currWpt].y
    );
}

function setCameraCartesian(theta, phi) {
    // Convert spherical to cartesian and set camLooks
    
    camLookX = Math.cos(theta) * Math.sin(phi);
    camLookY = Math.sin(theta) * Math.sin(phi);
    camLookZ = -Math.cos(phi);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}