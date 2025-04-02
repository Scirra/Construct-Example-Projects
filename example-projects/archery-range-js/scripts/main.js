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
let camLookX; // X position the camera will look at
let camLookY; // Y position the camera will look at
let camLookZ; // Z position the camera will look at
let currLookY; // Current Y position the camera is looking at
let currLookZ; // Current Z position the camera is looking at

// These variables store object instances that are referenced later.
let player;
let arrow;
let arrow2;
let bowUI;
let crosshairUI;
let scoreText;
let tutorialText;

// IObjectInterfaces
let camera;
let mouse;

// List of instances
let playerPos;
let shotCalcs;
let tree;
let bush;

// Textures
let tex;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Gameplay variables
let aOff; // Aim offset
let arrowLaunched; // Has the arrow been launched?
let currTarget; // Target the player is currently facing
let score; // Current player score
let breathingPattern; // How the camera moves when the player breathes
let gameOver; // Is the game over?

// Settings
const MOUSESENSITIVITY = 20; // Mouse sensitivity
const CURVEFACTOR = 0.45 // Breathing curve factor
const CURVESPEED = 0.035 // Breathing curve speed
const LERPFACTOR = 0.2; // Lerp factor

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Get instances
    player = runtime.objects.Player.getFirstInstance();
    arrow = runtime.objects.ArrowPart1.getFirstInstance();
    arrow2 = runtime.objects.ArrowPart2.getFirstInstance();
    bowUI = runtime.objects.BowUI.getFirstInstance();
    crosshairUI = runtime.objects.CrosshairUI.getFirstInstance();
    scoreText = runtime.objects.ScoreText.getFirstInstance();
    tutorialText = runtime.objects.TutorialText.getFirstInstance();
    
    // Get IObjectInterfaces
    camera = runtime.objects.Camera3D;
    mouse = runtime.mouse;
    
    // Get list of instances
    playerPos = runtime.objects.PlayerPos.getAllInstances();
    shotCalcs = runtime.objects.ShotCalculator.getAllInstances();
    tree = runtime.objects.Tree.getAllInstances();
    bush = runtime.objects.Bush.getAllInstances();
    
    // Setup billboard objects
    setupBillboards(runtime);
    
    // Start the game
    restartTheGame();
    
    // Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
    
    // BowUI animation events
    bowUI.addEventListener("animationend", _ => bowUIOnAnimationEnd());
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseDown(e));
    runtime.addEventListener("mouseup", e => onMouseUp(e));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function playerGotoNextSpot() {
    // Make the player go to the next spot and check for win condition

    // Get next spot index
    player.instVars.posID = player.instVars.posID + 1;
    
    // Game Over
    if (player.instVars.posID >= 4) {
        gameOver = true;
        tutorialText.text = "Your score is: " + score.toFixed(0) +
                            "\nClick anywhere to restart...";
        tutorialText.behaviors.Fade.fadeInTime = 0.25;
        tutorialText.behaviors.Fade.fadeOutTime = 0;
        tutorialText.behaviors.Fade.startFade();
        return;
    }
    
    // Show UI
    bowUI.isVisible = true;
    crosshairUI.isVisible = true;
    
    // Change (or not) breathing pattern
    breathingPattern = Math.random() > 0.5 ? 1 : -1;

    // Get current target
    for (const sc of shotCalcs)
        if (sc.instVars.posID == player.instVars.posID)
            currTarget = sc;
    
    // Set camera look
    camLookX = currTarget.x;
    camLookY = currTarget.y;
    currLookY = camLookY;
    currLookZ = 16;
    
    // Move player to the correct node
    for (const pp of playerPos)
        if (pp.instVars.posID == player.instVars.posID)
            player.behaviors.Tween.startTween(
                "position", [pp.x, pp.y], 2, "in-out-sine", {tags: "changePos"}
            );
    
    // Update arrow state
    arrowLaunched = false;
}

function onMouseMove(e) {
    // Process mouse movement
    
    // Conditions to DISABLE camera movement
    let cond1 = false;
    const cond2 = tutorialText.opacity > 0;
    
    for (const t of player.behaviors.Tween.allTweens())
        if (t.isPlaying) cond1 = true;
    
    // Check if camera movement should be interrupted
    if (cond1 || cond2 || arrowLaunched) return;
    
    // Move the camera
    camLookY += e.movementX/MOUSESENSITIVITY;
    camLookZ -= e.movementY/MOUSESENSITIVITY;
    
    // Shorthand to make the code more compact
    const camLimits = currTarget.instVars.camLimits;
    
    // Lock the view within stablished limits
    if (camLookY < currLookY - camLimits) camLookY = currLookY - camLimits;
    if (camLookY > currLookY + camLimits) camLookY = currLookY + camLimits;
    if (camLookZ < currLookZ - camLimits) camLookZ = currLookZ - camLimits;
    if (camLookZ > currLookZ + camLimits) camLookZ = currLookZ + camLimits;
}

function onMouseDown(e) {
    // Process mouse down
    
    // If mouse is not locket yet, lock it
    if (document.pointerLockElement !== mouseLocker) {
        mouseLocker.requestPointerLock();
    }
    
    // If tutorial text is visible, fade it out
    if (tutorialText.opacity > 0) {
        tutorialText.behaviors.Fade.fadeInTime = 0;
        tutorialText.behaviors.Fade.fadeOutTime = 0.25;
        tutorialText.behaviors.Fade.startFade();
        
        // If the game is over, restart it
        if (gameOver) restartTheGame();
        
        // Do not execute the rest of the function
        return;
    }
    
    // Conditions to charge a shot
    const cond1 = e.button == 0;
    const cond2 = bowUI.animationName == "Idle";
    const cond3 = bowUI.animationName == "Charge";
    const cond4 = tutorialText.opacity == 0;
    let cond5 = true;
    
    // Check if the player is moving right now
    for (const t of player.behaviors.Tween.allTweens())
        if (t.isPlaying) cond5 = false;
    
    // Charge a shot
    if (cond1 && (cond2 || cond3) && cond4 && cond5 && !arrowLaunched)
        bowUI.setAnimation("Charge");
}

function onMouseUp(e) {
    // Process mouse up

    // Conditions to release a charged shot
    const cond1 = e.button == 0;
    const cond2 = bowUI.animationName == "Charge";
    const cond3 = bowUI.animationFrame == 6;
    const cond4 = tutorialText.opacity == 0;
    let cond5 = true;
    const cond6 = bowUI.animationName != "Release";
    
    // Check if the player is moving right now
    for (const t of player.behaviors.Tween.allTweens())
        if (t.isPlaying) cond5 = false;
    
    // Release (or abort) a charged shot
    if (cond1 && cond2 && cond3 && cond4 && cond5) {
        bowUI.setAnimation("Release");
    } else if (cond4 && cond5 && cond6) {
        const currFrame = 6 - bowUI.animationFrame;
        bowUI.setAnimation("ReverseCharge");
        bowUI.animationFrame = currFrame;
    }
}

function bowUIOnAnimationEnd() {
    // This function runs when any bowUI animation ends

    switch(bowUI.animationName) {
        case "Charge":
            bowUI.setAnimation("Release");
            break;
            
        case "ReverseCharge":
            bowUI.setAnimation("Idle");
            break;
            
        case "Release":
            // Set bowUI animation as idle and hide some UI elements
            bowUI.setAnimation("Idle");
            bowUI.isVisible = false;
            crosshairUI.isVisible = false;
            
            // Launch the arrow
            arrowLaunched = true;
            arrow.opacity = 100;
            arrow2.opacity = 100;
            arrow.x = player.x + 4;
            arrow.y = player.y;
            arrow.zElevation = 7;
            
            // Utility constant to shorten the code
            const travelTime = currTarget.instVars.travelTime;
            
            // Make arrow go to where the camera is aiming
            const [ax, ay, az] = camera.getLookPosition();
            arrow.behaviors.Tween.startTween(
                "position", [ax, ay], travelTime, "linear", {tags: "xyMove"}
            );
            arrow.behaviors.Tween.startTween(
                "z-elevation", az, travelTime, "linear", {tags: "zMove"}
            );
            for (const t of arrow.behaviors.Tween.tweensByTags("xyMove"))
                t.finished.then(() => computeScore() );
            break;
    }
}

function setupBillboards(runtime) {
    // Setup Billboard textures
    
    tex = [
        runtime.objects.TreeTexture0,
        runtime.objects.TreeTexture1,
        runtime.objects.BushTexture0,
        runtime.objects.BushTexture1,
        runtime.objects.BushTexture2,
    ];

    for (const t of tree)
        t.setFaceObject("right", tex[Math.round(Math.random())])
    for (const b of bush)
        b.setFaceObject("right", tex[Math.floor(Math.random() * 3) + 2])
}

function restartTheGame() {
    // (Re)start the game
    
    bowUI.isVisible = true;
    crosshairUI.isVisible = true;
    player.instVars.posID = 0;
    scoreText.text = "Score: 0";
    
    // Spawn player at the correct node
    for (const pp of playerPos) {
        if (pp.instVars.posID == player.instVars.posID) {
            player.x = pp.x;
            player.y = pp.y;
        }
    }
    
    // Get current target
    for (const sc of shotCalcs)
        if (sc.instVars.posID == player.instVars.posID)
            currTarget = sc;
    
    // Get correct camera look depending on the target
    camLookX = currTarget.x;
    camLookY = currTarget.y;
    camLookZ = 16;
    
    camera.lookAtPosition(
        player.x, player.y, 16, camLookX, camLookY, camLookZ, 0, 0, 1
    );
    
    // Get camera position in this instant
    currLookY = camLookY;
    currLookZ = camLookZ;
    
    // Set default values for gameplay variables
    aOff = 0;
    arrowLaunched = false;
    score = 0;
    breathingPattern = Math.random() > 0.5 ? 1 : -1;
    gameOver = false;
}

function computeScore() {
    // Compute player's score
    
    // Calculate the distance between the arrow and the center of the target
    const d = dist3D(
        arrow.x, arrow.y, arrow.zElevation,
        currTarget.x, currTarget.y, currTarget.zElevation
    );
    
    // Make arrow invisible
    arrow.behaviors.Tween.startTween("opacity", 0, 1, "in-sine");
    arrow2.behaviors.Tween.startTween("opacity", 0, 1, "in-sine");
    
    // Increase score by 50 minus shot inaccuracy, then update ScoreText
    score += Math.max(50 - 4.75 * d, 0);
    scoreText.text = "Score: " + score.toFixed(0);
    
    // Move the player to a new position
    setTimeout(() => playerGotoNextSpot(), 1000);
}

function onTick(runtime) {
    // Code to run every tick
    
    // Manage cameras
    if (arrowLaunched) setCamera3DArrow(runtime);
    else setCamera3D(runtime);
    
    checkIfArrowHitGround();
    rotateBillboards();
}

function checkIfArrowHitGround() {
    // If the arrow hit the ground, stop it
    
    if (arrow.zElevation <= -1) {
        for (const t of arrow.behaviors.Tween.tweensByTags("zMove")) {
            for (const y of arrow.behaviors.Tween.tweensByTags("xyMove")) {
                y.stop();
            }
            t.stop();
        }
    }
}

function aimCurve(sign, sens) {
    // Creates a curve to simulate player breathing
    
    return {
        y: -sens * Math.cos(aOff) + sens * Math.cos(CURVEFACTOR * aOff),
        z: sign * sens * Math.sin(aOff) + sens * Math.sin(CURVEFACTOR * aOff)
    };
}

function setCamera3D(runtime) {
    // Set camera position and rotation to follow the player
    
    // Place the camera where the player is
    const camX = lerp(
        camera.getCameraPosition()[0],
        player.x + Math.cos(player.angle),
        LERPFACTOR * 60 * runtime.dt
    );
    const camY = lerp(
        camera.getCameraPosition()[1],
        player.y + Math.sin(player.angle),
        LERPFACTOR * 60 * runtime.dt
    );
    const camZ = lerp(
        camera.getCameraPosition()[2], 16, LERPFACTOR * 60 * runtime.dt
    );

    // This curve simulates the player breathing
    const curve = aimCurve(
        breathingPattern, currTarget.instVars.camSensitivity
    );
    
    // Apply the camera settings
    camera.lookAtPosition(
        camX, camY, camZ, camLookX,
        camLookY + curve.y,
        camLookZ + curve.z,
        0, 0, 1
    );
    
    // Update curve offset
    aOff = (aOff + CURVESPEED * 60 * runtime.dt) % (40 * Math.PI);
}

function setCamera3DArrow(runtime) {
    // Set camera position and rotation to follow the arrow
    
    // Place the camera where the arrow is
    const camX = lerp(
        camera.getCameraPosition()[0],
        arrow.x - 14,
        LERPFACTOR * 60 * runtime.dt
    );
    const camY = lerp(
        camera.getCameraPosition()[1],
        arrow.y - 6,
        LERPFACTOR * 60 * runtime.dt
    );
    const camZ = lerp(
        camera.getCameraPosition()[2],
        arrow.zElevation + 6,
        LERPFACTOR * 60 * runtime.dt
    );

    // Point the camera to the arrow
    camLookX = lerp(
        camera.getLookPosition()[0], arrow.x, LERPFACTOR * 60 * runtime.dt
    );
    camLookY = lerp(
        camera.getLookPosition()[1], arrow.y, LERPFACTOR * 60 * runtime.dt
    );
    const camLookZ = lerp(
        camera.getLookPosition()[2], arrow.zElevation,
        LERPFACTOR * 60 * runtime.dt
    );

    // Apply the camera settings
    camera.lookAtPosition(
        camX, camY, camZ, camLookX, camLookY, camLookZ, 0, 0, 1
    );
}

function rotateBillboards() {
    // Make trees always face the player/arrow (dependig on the focus)
    
    const focus = arrowLaunched ? arrow : player;
    for (const t of tree) t.angle = (Math.atan2(focus.y-t.y, focus.x-t.x));
    for (const b of bush) b.angle = (Math.atan2(focus.y-b.y, focus.x-b.x));
}

function dist3D(x1, y1, z1, x2, y2, z2) {
    // Helper function to calculate the distance between 2 points in 3D space

    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}