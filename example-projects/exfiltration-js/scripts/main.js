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

// Camera view variables
let camLookTheta;
let camLookPhi;
let camLookX;
let camLookY;
let camLookZ;    

// These variables store object instances that are referenced later.
let player;
let playerSpawn;
let playerEscapeZone;
let hudRadar;
let hudTextSuccess;
let hudTextFail;
let hudTextTutorial;
let hudFader;

// List of instances
let turrets;
let hudDots;
let playerSpotters;
let playerSafeZones;

// Global objects
let camera;
let mouse;
let keyboard;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Gameplay variables
let playerCrouching; // Is the player crouching?
let inputsDisabled; // Is the player frozen?

// Settings
const MOUSESENSITIVITY = 0.0025; // Mouse sensitivity
const CROUCHSPEED = 50; // Player crouch speed
const WALKSPEED = 100; // Player waking speed
const NUMTURRETS = 3; // Number of Turrets
const RADARDISTFACTOR = 0.05; // Radar distance factor
const RADARMAXDIST = 19; // Radar maximum scan distance
const TURRETANGLEFIX = 3.92699; // Fix turret angle
const RESETFADETIME = 3.25; // Time to fade-out-in the game
const TEXTBLINKSPEED = 0.25; // Success/Fail text blink speed

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime)
{
    // Code to run just before 'On start of layout'
    
    // Get instances
    player = runtime.objects.Player.getFirstInstance();
    playerSpawn = runtime.objects.PlayerSpawn.getFirstInstance();
    playerEscapeZone = runtime.objects.PlayerEscapeZone.getFirstInstance();
    hudRadar = runtime.objects.HUDRadar.getFirstInstance();
    hudTextSuccess = runtime.objects.HUDTextSuccess.getFirstInstance();
    hudTextFail = runtime.objects.HUDTextFail.getFirstInstance();
    hudTextTutorial = runtime.objects.HUDTextTutorial.getFirstInstance();
    hudFader = runtime.objects.HUDFader.getFirstInstance();
    
    // Get list of instances
    turrets = runtime.objects.TurretBody.getAllInstances();
    playerSpotters = runtime.objects.PlayerSpotter.getAllInstances();
    playerSafeZones = runtime.objects.PlayerSafeZone.getAllInstances();
    
    // Get global objects
    camera = runtime.objects.Camera3D;
    mouse = runtime.mouse;
    keyboard = runtime.keyboard;
    
    // Configure initial parameters for the game
    setupGame(runtime);
    
    // Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseDown(e));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}


function setupGame(runtime) {
    // Configure initial parameters for the game
    
    // Disable player's input and show tutorial
    inputsDisabled = true;
    hudTextTutorial.behaviors.Tween.startTween(
        "opacity", 1, 0.5, "in-out-sine"
    );
    
    // Set player spawn position
    player.x = playerSpawn.x;
    player.y = playerSpawn.y;
    
    // Starting camera's spherical coordinates
    camLookTheta = 0;
    camLookPhi = Math.PI/2;
    
    // Spherical coordinates converted to cartesian coordinates
    setCameraCartesian(camLookTheta, camLookPhi);
    
    // Set starting look position
    camera.lookAtPosition(
        player.x, player.y, player.zElevation + player.zHeight - 2,
        camLookX, camLookY, camLookZ, 0, 0, 1
    );
    
    // Setup player crouching state (false at the start)
    playerCrouching = false;
    
    // Setup radar dots
    hudDots = new Array(NUMTURRETS).fill(null);
    
    for (const dot of runtime.objects.HUDDot.getAllInstances()) {
        dot.destroy();
    }
    
    for (const turret of turrets) {
        hudDots[turret.instVars.id] = runtime.objects.HUDDot.createInstance(
            "HUD", hudRadar.x, hudRadar.y
        );
    }
    
    // Setup mission success text
    hudTextSuccess.isVisible = false;
    hudTextSuccess.behaviors.Flash.flash(TEXTBLINKSPEED, TEXTBLINKSPEED, 0);
    
    // Setup mission failed text
    hudTextFail.isVisible = false;
    hudTextFail.behaviors.Flash.flash(TEXTBLINKSPEED, TEXTBLINKSPEED, 0);
    
    // Setup fader
    hudFader.behaviors.Tween.startTween(
        "opacity", 0, RESETFADETIME/2, "in-out-sine"
    );
    
    // Reset view bobbing speed
    setViewBobbing(8, 4);
}

function onMouseDown(_) {
    // If mouse is not locket yet, lock it
    
    if (document.pointerLockElement !== mouseLocker) {
        mouseLocker.requestPointerLock();
    }
}

function onMouseMove(e) {
    // Process mouse movement
    
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
    
    // [Space] hides the tutorial and enables input
    if (e.key == " " && inputsDisabled) {
        inputsDisabled = false;
        hudTextTutorial.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );
    }
    
    // [C] toggles player's crouching state
    if ((e.key == "c" || e.key == "C") && !inputsDisabled) {
        playerCrouching = !playerCrouching;
    } 
}

function onTick(runtime) {
    // Code to run every tick
    
    setCamera3D(runtime);
    getKeyboardInputs();
    updateRadar();
    spotPlayer(runtime);
    playerEscape(runtime);
}

function setCamera3D(runtime) {
    // Set camera position and rotation
    
    const camX = player.x; // Camera X
    const camY = player.y; // Camera Y
    const camZ = lerp(
        camera.getCameraPosition()[2],
        player.zElevation + player.zHeight - (playerCrouching ? 16 : 2),
        0.2 * 60 * runtime.dt
    ); // Camera Z (lerp is for smooth crouching/standing)

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
    
    // If the tutorial is being displayed, ignore everything
    if (inputsDisabled) {
        return;
    }
    
    // Shorthand for player's 8 Direction behavior
    const eightd = player.behaviors.EightDirection;
    
    // Is the player crouching?
    eightd.maxSpeed = playerCrouching ? CROUCHSPEED : WALKSPEED;

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
        
        // Increase view bobbing speed
        setViewBobbing(2, 1);
    
    // Otherwise make the player stationary and view bobbing slow
    } else {
        eightd.setVector(0, 0);
        setViewBobbing(8, 4);
    }
}

function updateRadar() {
    // Update radar dots
    
    for (const turret of turrets) {
        // Get angle and distance between player and turret
        const params = [player.x, player.y, turret.x, turret.y]
        const a = angleBetween(...params) - camLookTheta - Math.PI/2;
        const d = distanceBetween(...params) * RADARDISTFACTOR;
        
        // Update dots on the radar according to new angle and distance
        const dot = hudDots[turret.instVars.id];      
        dot.x = hudRadar.x + Math.cos(a) * d;
        dot.y = hudRadar.y + Math.sin(a) * d;
        dot.angle = turret.angle - camLookTheta - Math.PI/2 - TURRETANGLEFIX;
        dot.isVisible = d < RADARMAXDIST;
    }
}

function spotPlayer(runtime) {
    // Turrets spot player if they have them in sight
    
    // For each spotter
    for (const ps of playerSpotters) {
    
        // Check if the player is overlapping this spotter
        if (
            player.testOverlap(ps) &&
            !hudTextFail.behaviors.Flash.isFlashing
        ) {
            // Assume that the player is not safe
            let playerSafe = false; 
            
            // Check if the player is inside a safe zone
            for (const sz of playerSafeZones) {
                if (player.testOverlap(sz)) {
                    // Deal with player crouching state
                    playerSafe = (sz.instVars.crouchingOnly && playerCrouching)
                                 || !sz.instVars.crouchingOnly;
                }
            }
            
            // If the player is not safe, then it is game over
            if (!playerSafe) {
                gameOver(runtime, hudTextFail);
            }    
        }
    }
}

function playerEscape(runtime) {
    // Player escaped successfully
    
    if (
        player.testOverlap(playerEscapeZone) &&
        !hudTextSuccess.behaviors.Flash.isFlashing
    ) {
        gameOver(runtime, hudTextSuccess);
    }
}

function gameOver(runtime, activeText) {
    // Start game over procedures
    
    // Show fail / success text
    activeText.isVisible = true;
    
    // Start flashing the text
    activeText.behaviors.Flash.flash(0.33, 0.33, Number.MAX_SAFE_INTEGER);
    hudFader.behaviors.Tween.startTween(
        "opacity", 1, RESETFADETIME/2, "in-out-sine"
    );

    // Fix Z-Ordering
    hudFader.moveToTop();
    activeText.moveToTop();

    // Disable player movement
    inputsDisabled = true;

    // Decrease view bobbing speed
    setViewBobbing(8, 4);

    // Call restart
    setTimeout(() => setupGame(runtime), RESETFADETIME*1000);
}

function setCameraCartesian(theta, phi) {
    // Convert spherical to cartesian and set camLooks
    
    camLookX = Math.cos(theta) * Math.sin(phi);
    camLookY = Math.sin(theta) * Math.sin(phi);
    camLookZ = -Math.cos(phi);
}

function setViewBobbing(h, v) {
    // Set view bobbing

    hudRadar.behaviors.SineH.period = h;
    hudRadar.behaviors.SineV.period = v;
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function distanceBetween(x1, y1, x2, y2) {
    // Calculate 2D distance between two coordinates

    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function angleBetween(x1, y1, x2, y2) {
    // Calculate 2D angle between two coordinates
    
    return Math.atan2(y2 - y1, x2 - x1);
}