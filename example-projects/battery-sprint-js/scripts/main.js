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
let playerCol;
let playerMod;
let playerSpawn;
let playerParticles;
let abyss;
let levelFinish;
let tbg;

// These variables store list of instances
let cameraChanger;
let jumpPad;

// Global objects
let camera;
let keyboard;

// Player behaviors
let pTween; // Tween
let pPlat; // Platformer

// Gameplay variables
let camZ; // Camera Z position
let camVecX; // Next camera up vector X
let currCamVecX; // Current camera up vector X
let tbgZElevation; // TiledBackground Z elevation

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Get instances
    playerCol = runtime.objects.PlayerCollider.getFirstInstance();
    playerMod = runtime.objects.PlayerModel.getFirstInstance();
    playerSpawn = runtime.objects.PlayerSpawn.getFirstInstance();
    playerParticles = runtime.objects.PlayerParticles.getFirstInstance();
    abyss = runtime.objects.Abyss.getFirstInstance();
    levelFinish = runtime.objects.LevelFinish.getFirstInstance();
    tbg = runtime.objects.TiledBackground.getFirstInstance();
    
    // Get list of instances
    cameraChanger = runtime.objects.CameraChanger;
    jumpPad = runtime.objects.JumpPad;
    
    // Get global objects
    keyboard = runtime.keyboard;
    camera = runtime.objects.Camera3D;
    
    // Get behaviors
    pTween = playerMod.behaviors.Tween;
    pPlat = playerCol.behaviors.Platform;
    
    // Start the game
    restartGame(runtime);
    
    // Setup initial camera position
    camera.lookAtPosition(
        playerCol.x - 64, playerCol.y - 32, camZ,
        playerCol.x, playerCol.y, playerCol.zElevation,
        camVecX, 1, 0
    );
    
    // Setup keyboard and start ticking
    runtime.addEventListener("keydown", e => onKeyDown(e));
    runtime.addEventListener("tick", () => onTick(runtime));
}

function restartGame(runtime) {
    // (Re)start the game
    
    // Redefine TiledBackground Z elevation
    tbgZElevation = -8;
    
    // Respawn the player and enable platformer
    playerCol.x = playerSpawn.x;
    playerCol.y = playerSpawn.y;
    playerMod.angle = 0;
    pPlat.isEnabled = true;
    
    // Set layer and TiledBackground colors
    runtime.getLayout(0).getLayer(0).backgroundColor = 
        tbg.effects[0].getParameter(0);
    tbg.effects[0].isActive = false;
    tbg.effects[1].isActive = false;
    tbg.effects[2].isActive = false;
    
    // Redefine camera variables
    camZ = 256;
    camVecX = 0;
    currCamVecX = 0;
}

function onKeyDown(e) {
    // When [SPACE] is pressed, the player jumps and rotates

    if (e.key != " ") return;
    
    // Jump
    pPlat.simulateControl("jump");
    
    // Rotate
    if (pPlat.isOnFloor)
        pTween.startTween("angle", playerMod.angle + Math.PI/2, .25, "linear");
}

function onTick(runtime) {
    // Code to run every tick
    
    playerCollision(runtime); // Check if player is colliding with something
    playerGlow(runtime); // Make player glow when on the ground
    showPlayerParticles(); // Show player particles when on the ground
    movePlayer(); // Move the player
    moveCamera(runtime); // Move the camera
    flipBG(runtime); // Flip background, if necessary
}

function playerCollision(runtime) {
    // Check player collision with different objects

    // JumpPad
    for (const jp of jumpPad.getAllInstances())
        if (jp.testOverlap(playerCol))
            pPlat.vectorY = -jp.instVars.addVectorY;
    
    // Abyss
    if (abyss.testOverlap(playerCol)) restartGame(runtime);
    
    // LevelFinish
    if (levelFinish.testOverlap(playerCol)) {
        // After 500ms disable platformer and after 1s restart the game
        setTimeout(() => pPlat.isEnabled = false, 500);
        setTimeout(() => restartGame(runtime), 1000);
    }
    
    // CameraChanger
    for (const cc of cameraChanger.getAllInstances()) {
        if (cc.testOverlap(playerCol)) {
            // Set camera position and angle
            camZ = cc.instVars.camZ;
            camVecX = cc.instVars.camVecX;
            
            // Set TileBackground position
            tbgZElevation = cc.instVars.bgFlipped ? 24 : -8;
    
            // Set layer and TileBackground colors
            const bgCol = tbg.effects[0].getParameter(+cc.instVars.bgFlipped);
            setTimeout(() => {
                tbg.effects[0].isActive = cc.instVars.bgFlipped;
                tbg.effects[1].isActive = cc.instVars.bgFlipped;
                tbg.effects[2].isActive = cc.instVars.bgFlipped;
                runtime.getLayout(0).getLayer(0).backgroundColor = bgCol;
            }, 0.05);
        }
    }
}

function playerGlow(runtime) {
    // When the player is on the ground, it glows
    
    // Shorthand to access the effect
    const pFX = playerMod.effects[0];

    if (pPlat.isOnFloor) {
        // Glow
        pFX.setParameter(
            2, 1.25 + Math.sin(32 * runtime.wallTime)/4
        );
    } else {
        // Fade back to default brightness
        pFX.setParameter(
            2, lerp(pFX.getParameter(2), 1, 10 * runtime.dt)
        );
    }
}

function showPlayerParticles() {
    // When the player is on the ground, show particles

    playerParticles.rate = pPlat.isOnFloor ? 25 : 0;
}

function movePlayer() {
    // The player always goes right
    
    pPlat.simulateControl("right");
}

function moveCamera(runtime) {
    // Set the camera position and angle
    
    // Position
    const posX = lerp(
        camera.getCameraPosition()[0], playerCol.x - 64, 0.1 * 60 * runtime.dt
    );
    const posY = lerp(
        camera.getCameraPosition()[1], playerCol.y - 32, 0.1 * 60 * runtime.dt
    );
    
    const posZ = lerp(
        camera.getCameraPosition()[2], camZ, 0.1 * 60 * runtime.dt
    );
    
    // Angle
    const lookX = playerCol.x;
    const lookY = playerCol.y;
    const lookZ = playerCol.zElevation;
    
    // X component of up vector
    currCamVecX = lerp(currCamVecX, camVecX, 0.1 * 60 * runtime.dt);

    // Apply new values
    camera.lookAtPosition(
        posX, posY, posZ, lookX, lookY, lookZ, currCamVecX, 1, 0
    );
}

function flipBG(runtime) {
    // Flip the background position to match the camera look angle
    
    tbg.zElevation = lerp(tbg.zElevation, tbgZElevation, 6 * runtime.dt);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}