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
 
//=====================================================================================================================

// These variables store object instances that are referenced later.
let playerCol, playerModel, bossCol, bossModel, bossFB;
let uiLifeBar, uiLifeBarSupport, uiLifeBarName, uiTutorialText, uiFader, uiDeathText, uiVictoryText, uiPressEnter;

// Textures
let tex;

// Global objects
let camera;
let keyboard;

// Gameplay variables
let camLookX; // Camera look X position
let camLookY; // Camera look Y position
let inputsEnabled; // Are the inputs enabled

// Settings
const LERPFACTOR = 0.1 // Linear interpolation speed
const PSPEED = 0.5; // Player speed
const PDASH = 8; // Dash multiplier
const PDMG = 20; // Player damage
const CAMHEIGHT = 14; // Camera height
const BOSSSPEED = 75; // How fast the boss moves
const BOSSPROJSPEED = 125; // How fast the boss projectiles move

runOnStartup(async runtime => {
    // Code to run on the loading screen

    runtime.addEventListener("beforeprojectstart", () => onBeforeProjectStart(runtime));
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Get instances
    playerCol = runtime.objects.PlayerCollider.getFirstInstance();
    playerModel = runtime.objects.PlayerModel.getFirstInstance();
    bossCol = runtime.objects.BossCollider.getFirstInstance();
    bossModel = runtime.objects.BossModel.getFirstInstance();
    bossFB = runtime.objects.BossFloorBlast.getFirstInstance();
    uiLifeBar = runtime.objects.UILifeBar.getFirstInstance();
    uiLifeBarSupport = runtime.objects.UILifeBarSupport.getFirstInstance();
    uiLifeBarName = runtime.objects.UILifeBarName.getFirstInstance();
    uiTutorialText = runtime.objects.UITutorialText.getFirstInstance();
    uiFader = runtime.objects.UIFader.getFirstInstance();
    uiDeathText = runtime.objects.UIDeathText.getFirstInstance();
    uiVictoryText = runtime.objects.UIVictoryText.getFirstInstance();
    uiPressEnter = runtime.objects.UIPressEnter.getFirstInstance();

    // Get global objects
    camera = runtime.objects.Camera3D;
    keyboard = runtime.keyboard;

    // Set textures
    tex = {
        "pIdle" : runtime.objects.TexPlayerIdle, "pWalk" : runtime.objects.TexPlayerWalk,
        "pDashL" : runtime.objects.TexPlayerDashL, "pDashR" : runtime.objects.TexPlayerDashR,
        "pHit" : runtime.objects.TexPlayerHit, "bIdle" : runtime.objects.TexBossIdle,
        "bAttack" : runtime.objects.TexBossAttack, "bFBExp" : runtime.objects.TexBossFBExp,
    }
    
    // Set initial camera position (behind the player and looking at the boss)
    camLookX = bossCol.x;
    camLookY = bossCol.y;
    camera.lookAtPosition(
        playerCol.x - 35 * Math.cos(playerCol.angle), playerCol.y - 35 * Math.sin(playerCol.angle),
        CAMHEIGHT, camLookX, camLookY = bossCol.y, CAMHEIGHT, 0, 0, 1
    );
    
    // Start the game and disable inputs (wait for [Enter])
    restartGame(runtime);
    inputsEnabled = false;
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function restartGame(runtime) {
    // (Re)start the game
    
    // Reset camera
    camLookX = playerCol.x - 16 + Math.cos(playerCol.angle);
    camLookY = playerCol.y + Math.sin(playerCol.angle);
    
    // Reset player
    playerModel.height = 16;
    playerCol.instVars.pspeed = PSPEED;
    playerCol.instVars.isAttacking = false;
    playerCol.instVars.isWalking = false;
    playerCol.instVars.dashing = "N";
    playerCol.instVars.dashInCooldown = false;
    playerCol.x = 136;
    playerCol.y = 136;
    inputsEnabled = true;
    
    // Reset boss
    bossCol.x = 376;
    bossCol.y = 376;
    bossCol.zElevation = 0;
    uiLifeBar.width = 160;
    
    // Hide Death screen
    uiFader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
    uiDeathText.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
    uiVictoryText.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
    uiPressEnter.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
}

function onTick(runtime) {
    // Code to run every tick
    
    checkBossTimer(runtime);
    movePlayerModel(runtime);
    getInputs(runtime);
    playerDashState(runtime);
    computeCollisions(runtime);
    rotateBillboards(runtime);
    setCamera3D(runtime);
}

function checkBossTimer(runtime) {
    // Boss OnTimer events

    const tm = bossCol.behaviors.Timer; // Shorthand to make code more compact
    
    // Perform new attack
    if (tm.hasFinished("bossAttackTimer")) {
        
        // Select a random attack
        const newAttack = Math.floor(Math.random() * 4);
        
        // Floor Blast attack
        if (newAttack < 1) {
            tex.bAttack.getFirstInstance().startAnimation("beginning");
            bossModel.setFaceObject("right", tex.bAttack);
            tm.startTimer(1, "bossFloorBlastTimer", "once"); // Start floor blast sequence
        
        // Projectile attack
        } else if (newAttack < 3) {
            tex.bAttack.getFirstInstance().startAnimation("beginning");
            bossModel.setFaceObject("right", tex.bAttack);
            tm.startTimer(1, "bossProjectilesTimer", "once"); // Start projectile attack sequence
            
        // Move to a random position on the arena and restart attack timer
        } else {
            const newPosX = Math.floor(Math.random() * 221) + 146;
            const newPosY = Math.floor(Math.random() * 221) + 146;
            bossCol.behaviors.Tween.startTween(
                "position", [newPosX, newPosY], dist2D(bossCol.x, bossCol.y, newPosX, newPosY)/BOSSSPEED, "in-out-sine"            
            );
            tm.startTimer(dist2D(bossCol.x, bossCol.y, newPosX, newPosY)/BOSSSPEED, "bossAttackTimer", "once");
        }
    }
    
    // Floor Blast
    if (tm.hasFinished("bossFloorBlastTimer")) {
        // Move the indicator right below the player and start other timers
        bossFB.x = playerCol.x;
        bossFB.y = playerCol.y;
        tm.startTimer(0.4, "bossBackToIdleTimer", "once"); // Boss goes back to idle
        tm.startTimer(2, "bossFloorBlastExplosionTimer"); // Indicator explodes
        tm.startTimer(3, "bossAttackTimer", "once"); // Restart attack timer
    }
    
    // Floor Blast Explosion (kills player if close)
    if (tm.hasFinished("bossFloorBlastExplosionTimer")) {
        // Create 6 explosions on the image points of the blaster indicator
        tex.bFBExp.getFirstInstance().startAnimation("beginning");
        for (let i = 0; i < 6; i++)
            runtime.objects.BossFBExpModel.createInstance(
                "Game", bossFB.getImagePointX("exp" + i), bossFB.getImagePointY("exp" + i)
            );
            
        // If player is too close, it dies.
        if (dist2D(playerCol.x, playerCol.y, bossFB.x, bossFB.y) < bossFB.width/2) playerDeath(runtime);
        
        // Move indicator away and wait for explosions animations to end
        bossFB.x = 10000;
        tm.startTimer(0.5, "bossExplosionRemoveTimer"); // Remove explosions
    }

    // Projectiles
    if (tm.hasFinished("bossProjectilesTimer")) {
    
        tm.startTimer(0.4, "bossBackToIdleTimer", "once"); // Go back to idle
        tm.startTimer(3, "bossAttackTimer", "once"); // Restart attack timer
        
        // Create a projectile and roughly aim it at the player
        const rx = Math.floor(Math.random() * 16) - 8;
        const ry = Math.floor(Math.random() * 16) - 8;
        const p = runtime.objects.BossProjectile.createInstance("Game", bossCol.x, bossCol.y);
        const spd = dist2D(p.x, p.y, playerCol.x + rx, playerCol.y + ry)/BOSSPROJSPEED;
        p.zElevation = 24;
        
        // Start projectile movement and explosion timer
        p.behaviors.Tween.startTween("position", [playerCol.x + rx, playerCol.y + ry], spd, "in-sine");
        p.behaviors.Tween.startTween("z-elevation", 0, spd, "in-sine");
        tm.startTimer(spd, "bossProjectilesExplodeTimer", "once"); // Projectile explodes
    }
    
    // Projectiles Explosion
    if (tm.hasFinished("bossProjectilesExplodeTimer")) {
        // Get all projectiles currently on the map and destroy them, placing an explosion in its place
        tex.bFBExp.getFirstInstance().startAnimation("beginning");
        for (const p of runtime.objects.BossProjectile.getAllInstances()) {
            runtime.objects.BossFBExpModel.createInstance("Game", p.x, p.y);
            p.destroy();
        }
        tm.startTimer(0.5, "bossExplosionRemoveTimer"); // Activate explosion remover timer
    }
    
    // Explosion Remove
    if (tm.hasFinished("bossExplosionRemoveTimer"))
        for (const e of runtime.objects.BossFBExpModel.getAllInstances())
            e.destroy();
    
    // Boss goes back to idle state
    if (tm.hasFinished("bossBackToIdleTimer")) bossModel.setFaceObject("right", tex.bIdle);
}

function movePlayerModel(runtime) {
    // Make PlayerModel follow PlayerCollider smoothly
    
    playerModel.x = lerp(playerModel.x, playerCol.x, 10 * runtime.dt);
    playerModel.y = lerp(playerModel.y, playerCol.y, 10 * runtime.dt);
}

function getInputs(runtime) {
    // Get player inputs and execute the corresponding actions
    
    // [Enter] (re)starts the game
    if (keyboard.isKeyDown("Enter") && !inputsEnabled) {
        
        // Boss starts attacking
        bossCol.behaviors.Timer.startTimer(1, "bossAttackTimer", "once");
        
        // If player or boss is dead, restart the game
        if (playerModel.height == 0 || bossCol.zElevation == -64) {
            restartGame();
            
        // Otherwise enable inputs and show the proper UI
        } else {
            inputsEnabled = true;
            uiLifeBar.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
            uiLifeBarSupport.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
            uiLifeBarName.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
            uiTutorialText.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
        }
    }

    if (!inputsEnabled) return; // If inputs are not enabled, ignore
    
    const pv = playerCol.instVars; // Shorthand to make code more compact
    pv.isWalking = false; // Before getting the inputs, assume player is idle
    
    // Player movement
    if (pv.dashing == "N" && !pv.isAttacking) {
        // Move forward
        if (keyboard.isKeyDown("ArrowUp")) {
            playerCol.x += Math.cos(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            pv.isWalking = true;
            playerModel.setFaceObject("left", tex.pWalk);
        }

        // Move fackwards
        if (keyboard.isKeyDown("ArrowDown")) {
            playerCol.x -= Math.cos(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            playerCol.y -= Math.sin(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            pv.isWalking = true;
            playerModel.setFaceObject("left", tex.pWalk);
        }

        // Move left
        if (keyboard.isKeyDown("ArrowLeft")) {
            playerCol.x += Math.cos(playerCol.angle - Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle - Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            pv.isWalking = true;
            playerModel.setFaceObject("left", tex.pWalk);
        }

        // Move right
        if (keyboard.isKeyDown("ArrowRight")) {
            playerCol.x += Math.cos(playerCol.angle + Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle + Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            pv.isWalking = true;
            playerModel.setFaceObject("left", tex.pWalk);
        }
    }
    
    // Perform Dash
    if (keyboard.isKeyDown("ControlLeft") && !pv.dashInCooldown && pv.dashing == "N" && !pv.isAttacking) {
        
        // Dash left
        if (keyboard.isKeyDown("ArrowLeft") && pv.dashing == "N") {
            playerModel.setFaceObject("left", tex.pDashL);
            pv.dashing = "L";
            
        // Dash right
        } else if (keyboard.isKeyDown("ArrowRight") && pv.dashing == "N") {
            playerModel.setFaceObject("left", tex.pDashR);
            pv.dashing = "R";
        
        // Dash forward
        } else if (keyboard.isKeyDown("ArrowUp") && pv.dashing == "N") {
            playerModel.setFaceObject("left", tex.pDashR);
            pv.dashing = "F";
        
        // Dash backwards
        } else if (keyboard.isKeyDown("ArrowDown") && pv.dashing == "N") {
            playerModel.setFaceObject("left", tex.pDashL);
            pv.dashing = "B";
        }
        
        // Disable dash for now, then reset player movement and reset dash
        pv.dashInCooldown = true;
        setTimeout(() => { pv.dashing = "N"; pv.pspeed = PSPEED; }, 200);
        setTimeout(() => pv.dashInCooldown = false, 1500);
    }
    
    // Attack
    if (keyboard.isKeyDown("Space") && !pv.attackInCooldown && pv.dashing == "N" && !pv.isAttacking) {
        pv.isAttacking = true;
        tex.pHit.getFirstInstance().startAnimation("beginning");
        playerModel.setFaceObject("left", tex.pHit);
        
        // Disable attack for now, then reset it later
        pv.attackInCooldown = true;
        setTimeout(() => pv.isAttacking = false, 500);
        setTimeout(() => pv.attackInCooldown = false, 1000);
        
        // If the player is close to the boss, deal damage
        if (dist2D(playerCol.x, playerCol.y, bossCol.x, bossCol.y) < 16) {
            // Boss flashes
            bossModel.effects[0].setParameter(2, 2);
            setTimeout(() => bossModel.effects[0].setParameter(2, 1), 50);
        
            // Damage not enough to kill the boss
            if (uiLifeBar.width > PDMG && bossCol.zElevation >= 0) {
                uiLifeBar.width = Math.max(0, uiLifeBar.width - PDMG);
            
            // Damage is enough to kill the boss, so it dies
            } else {
                uiLifeBar.width = 0;
                bossModel.setFaceObject("right", tex.bIdle)
                bossCol.behaviors.Tween.startTween("z-elevation", -64, 2, "in-sine");
                stopEverything(runtime);
                setTimeout(() => endGame("won"), 2000);
            }
        }
    }
}

function playerDashState(runtime) {
    // Check if player is in a dash state, otherwise make it idle

    const pv = playerCol.instVars; // Shorthand to make code more compact

    switch (pv.dashing) {
        case "L":
            pv.pspeed = PSPEED * PDASH;
            playerCol.x += Math.cos(playerCol.angle - Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle - Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            break;
        case "R":
            pv.pspeed = PSPEED * PDASH;
            playerCol.x +=  Math.cos(playerCol.angle + Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle + Math.PI/2) * pv.pspeed * 60 * runtime.dt;
            break;
        case "F":
            pv.pspeed = PSPEED * PDASH;
            playerCol.x += Math.cos(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            playerCol.y += Math.sin(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            break;
        case "B":
            pv.pspeed = PSPEED * PDASH;
            playerCol.x -= Math.cos(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            playerCol.y -= Math.sin(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
            break;
    }
    
    // Set the player to idle
    if (pv.dashing == "N" && !pv.isWalking && !pv.isAttacking) playerModel.setFaceObject("left", tex.pIdle);
}

function computeCollisions(runtime) {
    // Compute player collision with other objects
    
    const pv = playerCol.instVars; // Shorthand to make code more compact

    // Check collision with the Boss
    if (playerCol.testOverlap(bossCol)) {
        playerCol.x -= Math.cos(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
        playerCol.y -= Math.sin(playerCol.angle) * pv.pspeed * 60 * runtime.dt;
    }
    
    //Check collision with Boss projectiles (kills the player)
    for (const b of runtime.objects.BossProjectile.getAllInstances())
        if (dist2D(playerCol.x, playerCol.y, b.x, b.y) < 16 && b.zElevation < 16)
            playerDeath(runtime);
    
    // Limit the player inside the arena
    playerCol.x = Math.min(412, Math.max(100, playerCol.x));
    playerCol.y = Math.min(412, Math.max(100, playerCol.y));
}

function rotateBillboards(runtime) {
    // Rotate billboards
    
    // Player always look at the bossCol
    playerCol.angle = (Math.atan2(bossCol.y - playerCol.y, bossCol.x - playerCol.x));
    
    // Boss always look at the camera
    bossCol.angle = (Math.atan2(camera.getCameraPosition()[1] - bossCol.y, camera.getCameraPosition()[0] - bossCol.x));
    
    // Explosions always look at the camera
    for (const exp of runtime.objects.BossFBExpModel.getAllInstances())
        exp.angle = (Math.atan2(camera.getCameraPosition()[1] - exp.y, camera.getCameraPosition()[0] - exp.x));
    
    // Projectiles always look at the camera
    for (const p of runtime.objects.BossProjectile.getAllInstances())
        p.angle = (Math.atan2(camera.getCameraPosition()[1] - p.y, camera.getCameraPosition()[0] - p.x));
}

function setCamera3D(runtime) {
    // Set camera position and rotation to follow the playerCol
   
    // Place the camera behind the playerCol
    const camX = lerp(
        camera.getCameraPosition()[0], playerCol.x - 35 * Math.cos(playerCol.angle), LERPFACTOR * 60 * runtime.dt
    );
    const camY = lerp(
        camera.getCameraPosition()[1], playerCol.y - 35 * Math.sin(playerCol.angle), LERPFACTOR * 60 * runtime.dt
    );
    
    // Point the camera to the bossCol
    camLookX = lerp(camLookX, bossCol.x, LERPFACTOR * 60 * runtime.dt);
    camLookY = lerp(camLookY, bossCol.y, LERPFACTOR * 60 * runtime.dt);
    
    // Apply the camera settings    
    camera.lookAtPosition(camX, camY, CAMHEIGHT, camLookX, camLookY, CAMHEIGHT, 0, 0, 1);
}

function playerDeath(runtime) {
    // Player death
    
    playerModel.behaviors.Tween.startTween("height", 0, 0.5, "in-out-sine");
    stopEverything(runtime);
    endGame("lost");
}

function stopEverything(runtime) {
    // Stop everything relevant that may be going on
    
    bossCol.behaviors.Timer.stopAllTimers(); // Stop all boss timers
    // Destroy projectiles and explosions
    for (const p of runtime.objects.BossProjectile.getAllInstances()) p.destroy();
    for (const e of runtime.objects.BossFBExpModel.getAllInstances()) e.destroy();
    bossFB.x = 10000; // Move indicator ouside the screen
}

function endGame(mode) {
    // Stop the game and show vitory/defeat screen depending on the mode
    
    inputsEnabled = false;
    
    if (mode == "lost") uiDeathText.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
    else uiVictoryText.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
    
    uiPressEnter.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
    uiFader.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine");
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function dist2D(x1, y1, x2, y2) {
    // Simple helper function to calculate distance between 2 points in 2D space

    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}