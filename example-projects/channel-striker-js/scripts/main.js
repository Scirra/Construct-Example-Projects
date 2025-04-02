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

// Settings
const STARTSPEED = 1; // Starting game speed
const PLAYERTURNSPEED = 1.5; // How fast the player can turn
const PLAYERACCELMULT = 2; // Speed multiplier when the player accels
const PLAYERBRAKEMULT = 0.5; // Speed multiplier when the player brakes
const MAPSIZE = 2400; // Size of full map (to calculate the loop)
const THREATWORTH = 50; // How many points a threat kill is worth
const MAXFUEL = 99; // Maximum amount of fuel

/* These variables store object instances that are referenced later.
 * Their names reflect which objects they will later be assigned to */
let player;
let playerAfterburner;
let startPosition;
let terrain;
let loopIn;
let gameOverText;
let infoText;
let tutorialText;
let background;
let water;
let keyboard;

// IObjectClass references (not instances)
let playerBullet;
let threats;
let explosion;

// Gameplay variables
let mapSpeed; // How fast the player is moving WITHOUT thrust/brake
let playerSpeed; // How fast the player is moving WITH thrust/brake
let playerDying; // Is the player dying?
let cooldown; // Time before the player can shoot again
let iteration; // Current gameplay loop iteration
let fuel; // Current fuel amount
let score; // Player's score

// Check if the player has just opened the game (to show the tutorial)
let tutorialIsOn = true;

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Assign instances
    player = runtime.objects.Player.getFirstInstance();
    playerAfterburner = runtime.objects.PlayerAfterburner.getFirstInstance();
    startPosition = runtime.objects.StartPosition.getFirstInstance();
    terrain = runtime.objects.Terrain.getFirstInstance();
    loopIn = runtime.objects.LoopIn.getFirstInstance();
    gameOverText = runtime.objects.GameOverText.getFirstInstance();
    infoText = runtime.objects.InfoText.getFirstInstance();
    tutorialText = runtime.objects.TutorialText.getFirstInstance();
    background = runtime.objects.Background.getFirstInstance();
    water = runtime.objects.Water.getFirstInstance();
    keyboard = runtime.keyboard;
    
    //Assign IObjectClass references
    playerBullet = runtime.objects.PlayerBullet;
    threats = runtime.objects.Threats;
    explosion = runtime.objects.Explosion;
    
    // Wait for keypress to start the game
    runtime.addEventListener("keydown", e => startGame(e, runtime));
}

function startGame(e, runtime) {
    // Hide tutorial and start the game
    
    if (!tutorialIsOn || e.key != " ") return;
    tutorialIsOn = false; // Deactivate the tutorial
    
    // Hide tutorial text and show the information text
    tutorialText.behaviors.Fade.fadeInTime = 0;
    tutorialText.behaviors.Fade.fadeOutTime = 1;
    tutorialText.behaviors.Fade.startFade();
    infoText.isVisible = true;
    
    // Reset game and Start ticking
    resetGame(runtime);
    runtime.addEventListener("tick", () => onTick(runtime));
}

function spawnEntities(runtime) {
    // Create enemies on spawners
    
    // First, destroy any enemy/fuel tank that is already on the map
    for (const t of threats.getAllInstances()) {
        t.destroy();
        for (const c of t.children()) c.destroy(); // destroy children
    }
    
    for (const f of runtime.objects.FuelTank.getAllInstances())
        f.destroy();
        
    for (const spawn of runtime.objects.EnemySpawn.getAllInstances()) {
        // Check if enemy should spawn from now on. If not, ignore.
        if (+spawn.animationName > iteration) continue;
    
        switch (spawn.instVars.enemyType) {
            case "Helicopter": spawnHelicopter(spawn, runtime); break;
            case "Ship": spawnShip(spawn, runtime); break;
            case "Jet": spawnJet(spawn, runtime); break;
            case "Bridge": spawnBridge(spawn, runtime); break;
            case "FuelTank": spawnFuelTank(spawn, runtime); break;
        }
    }
}

function spawnHelicopter(spawn, runtime) {
    // Create helicopter
    
    const v = spawn.instVars;
    
    const e = runtime.objects.EnemyHelicopter.createInstance(
        "Game", spawn.x, spawn.y
    );
    
    e.angle = spawn.angle;
    
    // Create rotor
    const r = runtime.objects.EnemyHelicopterRotor.createInstance(
        "Game", e.x, e.y
    );
    
    // Make the rotor child of the Helicopter
    e.addChild(r, {transformX: true, transformY: true});
    
    // Activate tween (if necessary)
    if (v.moveTime > 0) {
        // Position
        e.behaviors.Tween.startTween(
            "position", [v.moveToX, e.y],
            v.moveTime,
            "in-out-sine",
            {pingPong: true, loop: true}
        );
        // Angle
        e.behaviors.Tween.startTween(
            "angle",
            v.angleTo,
            v.moveTime,
            "in-out-sine",
            {pingPong: true, loop:true}
        );
    }
}

function spawnShip(spawn, runtime) {
    // Create warship
    
    const v = spawn.instVars;
    
    const e = runtime.objects.EnemyShip.createInstance(
        "Game", spawn.x, spawn.y
    );
    
    e.angle = spawn.angle;
    
    // Activate tween (if necessary)
    if (v.moveTime > 0) {
        e.behaviors.Tween.startTween(
            "position", [v.moveToX, e.y],
            v.moveTime,
            "in-out-sine",
            {pingPong: true, loop: true}
        );
    }
}

function spawnJet(spawn, runtime) {
    // Create Jet
    
    const e = runtime.objects.EnemyJet.createInstance(
        "Game", spawn.x, spawn.y
    );
    
    // Move it to the bottom of the map
    e.behaviors.MoveTo.moveToPosition(e.x, 1.5*MAPSIZE);
}

function spawnBridge(spawn, runtime) {
    // Create Bridge
    
    const b = runtime.objects.Bridge.createInstance(
        "Game", spawn.x, spawn.y
    );
    
    // Move bridge to the bottom of the layer
    b.moveToBottom();
    
    // Move ruins to the bottom of the bridges
    for (const r of runtime.objects.BridgeRuins.getAllInstances())
        r.moveToBottom();
        
    // Move background to the bottom of the ruins
    background.moveToBottom();
}


function spawnFuelTank(spawn, runtime) {
    // Create Bridge

    const f = runtime.objects.FuelTank.createInstance(
        "Game", spawn.x, spawn.y
    );
    
    f.angle = spawn.angle;
    
    // Move tank to the bottom of the layer, but above the background
    f.moveToBottom();
    background.moveToBottom();
}

function resetGame(runtime) {
    // Reset game to the starting state
    
    // Reset variables
    mapSpeed = STARTSPEED;
    playerSpeed = STARTSPEED;
    playerDying = false;
    cooldown = 0;
    iteration = 0;
    fuel = MAXFUEL;
    score = 0;
    
    // Reset texts
    gameOverText.opacity = 0;
    
    // Reset the player object and put the camera over it
    player.isVisible = true;
    playerAfterburner.isVisible = true;
    player.x = startPosition.x;
    player.y = startPosition.y;
    
    // Destroy bullets
    for (const b of playerBullet.getAllInstances())
        if (player.y - b.y > 180)
            b.destroy();
    
    // Spawn enemies
    spawnEntities(runtime);
}

function onTick(runtime)
{
    // Code to run every tick
    moveWater(runtime);
    consumeFuel(runtime);
    getInputsAndMove(runtime);
    reduceCooldown(runtime);
    destroyFarBullets();
    checkForLoop(runtime);
    checkForCollision(runtime);
    updateInfoText();
}

function moveWater(runtime) {
    // Move water to the bottom of the layer and scroll it
    water.moveToBottom();
    water.imageOffsetY += 0.1 * 60 * runtime.dt;
}

function consumeFuel(runtime) {
    // Consume a little fuel every tick
    
    // If the player is dying, ignore
    if (playerDying) return;
    
    // Consue fuel. If the player runs out of fuel, it is game over
    fuel = fuel > 0 ? fuel - 0.05 * 60 * runtime.dt : 0;
    if (fuel <= 0) gameOver();
}

function getInputsAndMove(runtime) {
    // Get player inputs and process them accordingly
    
    // Check for game restart
    if (keyboard.isKeyDown("Space") && gameOverText.opacity == 1)
        resetGame(runtime);
    
    // If the player is dying, ignore.
    if (playerDying) return;
    
    // Fire
    if (keyboard.isKeyDown("Space") && cooldown <= 0) {
        const b = playerBullet.createInstance(
            "Game",
            player.getImagePointX("FireSpot"),
            player.getImagePointY("FireSpot"),
        );
        b.behaviors.Bullet.speed = 60 * 4 * mapSpeed;
        cooldown = 25;
    }
    
    // Move and animate the aircraft
    
    // Set current animation as idle
    player.setAnimation("idle");
    
    // Move player to the top of the layer
    player.moveToTop();
    
    // Right
    if (keyboard.isKeyDown("ArrowRight")) {
        player.x += PLAYERTURNSPEED * 60 * runtime.dt
        player.setAnimation("right");    
    }
        
    // Left
    else if (keyboard.isKeyDown("ArrowLeft")) {
        player.x -= PLAYERTURNSPEED * 60 * runtime.dt
        player.setAnimation("left");
    
    }
    
    // Increased speed
    if (keyboard.isKeyDown("ArrowUp")) {
        playerSpeed = lerp(
            playerSpeed, mapSpeed * PLAYERACCELMULT, 0.1 * 60 * runtime.dt
        );
        
    // Decreased speed
    } else if (keyboard.isKeyDown("ArrowDown")) {
        playerSpeed = lerp(
            playerSpeed, mapSpeed * PLAYERBRAKEMULT, 0.1 * 60 * runtime.dt
        );
        
    // Normal speed
    } else {
        playerSpeed = lerp(playerSpeed, mapSpeed, 0.1 * 60 * runtime.dt);
    }
    
    // Move the player
    player.y -= playerSpeed * 60 * runtime.dt;
}

function reduceCooldown(runtime) {
    // Reduce player bullet cooldown
    cooldown = cooldown > 0 ? cooldown - 1 * 60 * runtime.dt : 0;
}

function destroyFarBullets() {
    // Bullets outside of player's view should be destroyed
    for (const b of playerBullet.getAllInstances())
        if (player.y - b.y > 180) b.destroy();
}

function checkForLoop(runtime) {
    // Check if the player has reached the end of the map
    
    
    if (player.testOverlap(loopIn)) {
        // Send the player and the bullets to the beginning again
        player.y += MAPSIZE;
        for (const b of playerBullet.getAllInstances())
            b.y += MAPSIZE;
            
        // Increse iteration, speed and spawn enemies
        iteration = iteration < 10 ? iteration + 1 : 10;
        spawnEntities(runtime);
        mapSpeed = STARTSPEED + 0.1 * iteration;
    }
}

function checkForCollision(runtime) {
    // Check objects collision

    // Check if the player has collided with the terrain
    if (player.testOverlap(terrain) && !playerDying) gameOver();
    
    // Check if the player has collided with a threat
    for (const t of threats.getAllInstances()) {
        if (player.testOverlap(t) && !playerDying) {
            // Destroy threat
            t.destroy();
            const ex = explosion.createInstance("Game", t.x, t.y);
            ex.addEventListener(
                "animationend", (e) => e.instance.destroy()
            );

            for (const c of t.children()) c.destroy(); // Destroy children
            
            gameOver(); // Game over
        }
    }
    
    // Check if the player has collided with bridge ruins
    for (const t of runtime.objects.BridgeRuins.getAllInstances())
        if (player.testOverlap(t) && !playerDying)
            gameOver();
    
    // Check if the player has collided with a fuel tank
    for (const t of runtime.objects.FuelTank.getAllInstances())
        if (player.testOverlap(t) && !playerDying)
            fuel = fuel < MAXFUEL ? fuel + 0.25 * 60 * runtime.dt : MAXFUEL;

    // Check if a bullet has collided with something
    for (const b of playerBullet.getAllInstances()) {
        // Terrain
        if (b.testOverlap(terrain)) {
            const pbe_proto = runtime.objects.PlayerBulletExplosion;
            const pbe = pbe_proto.createInstance("Game", b.x, b.y);
            pbe.addEventListener("animationend", (e) => e.instance.destroy());
            b.destroy();
        }
        
        // Fuel tank (destroy it)
        for (const f of runtime.objects.FuelTank.getAllInstances()) {
            if (b.testOverlap(f)) {
                const pbe_proto = runtime.objects.PlayerBulletExplosion;
                const pbe = pbe_proto.createInstance("Game", b.x, b.y);
                pbe.addEventListener(
                    "animationend", (e) => e.instance.destroy()
                );
                b.destroy();
                f.destroy();
                const ex = explosion.createInstance("Game", f.x, f.y);
                ex.addEventListener(
                    "animationend", (e) => e.instance.destroy()
                );
            }
        }
        
        // Threat (destroy it)
        for (const t of threats.getAllInstances()) {
            if (b.testOverlap(t)) {
                const pbe_proto = runtime.objects.PlayerBulletExplosion;
                const pbe = pbe_proto.createInstance("Game", b.x, b.y);
                pbe.addEventListener(
                    "animationend", (e) => e.instance.destroy()
                );
                b.destroy();
                t.destroy();
                const ex = explosion.createInstance("Game", t.x, t.y);
                ex.addEventListener(
                    "animationend", (e) => e.instance.destroy()
                );
                for (const c of t.children())
                    c.destroy(); // Destroy threat's children
                score += THREATWORTH * (1 + iteration/5);
            }
        }
    }
}

function updateInfoText() {
    // Update information textbox
    
    // Format the score and amount of fuel. Write them to infoText
    const txtScore = score.toFixed(0);
    const txtFuel = fuel.toFixed(0).padStart(2, '0');
    infoText.text = "Score: " + txtScore + "\nFuel: " + txtFuel;
}

function gameOver() {
    // Game Over procedure

    // Stop progressing the game
    mapSpeed = 0;
    playerSpeed = 0;
    playerDying = true;
    const ex = explosion.createInstance("Game", player.x, player.y);
    ex.addEventListener("animationend", (e) => e.instance.destroy());
    player.isVisible = false;
    playerAfterburner.isVisible = false;

    // Show game over text
    gameOverText.behaviors.Fade.fadeInTime = 1;
    gameOverText.behaviors.Fade.fadeOutTime = 0;
    gameOverText.behaviors.Fade.startFade();
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    return (1 - amt) * start + amt * end;
}