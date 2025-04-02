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

// Instances
let player: InstanceType.Player;
let camPos: InstanceType.CameraPosition;
let texWater: InstanceType.TexWater;
let texWallsSmall: InstanceType.TexWallsSmall;
let texWallsLarge: InstanceType.TexWallsLarge;
let texGrass: InstanceType.TexGrass;
let shadow: InstanceType.Shadow;
let river: InstanceType.River
let uiTextTutorial: InstanceType.UITextTutorial;
let uiTextScore: InstanceType.UITextScore;
let uiTextGameOver: InstanceType.UITextGameOver;
let splash: InstanceType.Splash;

// Global objects
let camera: I3DCameraObjectType;
let keyboard: IKeyboardObjectType;

// Object interfaces
let plat: IObjectType<InstanceType.Platform>; // Platform object
let landBlock0: IObjectType<InstanceType.LandBlock0>; // Land block 32x32x32 object
let landBlock1: IObjectType<InstanceType.LandBlock1>; // Land block 64x32x32 object
let landBlock2: IObjectType<InstanceType.LandBlock2>; // Land block 32x64x32 object
let landBlock3: IObjectType<InstanceType.LandBlock3>; // Land block 32x32x64 object

// Behaviors
let timer: ITimerBehaviorInstance<InstanceType.EventTimer>;

// Gameplay variables
let gameStarted: boolean; // Has the game started?
let gameOver: boolean; // Is the game over?
let lastX: number; // Last platform X position
let bounces: number; // Number of bounces

// Settings
const MIN_Y = 172; // Minimum Y position the player can be before bouncing
const JUMP_HEIGHT = 64; // Player jump height (y-axis)
const JUMP_LENGTH = 256; // Player jump length (x-axis)
const PLAT_SPAWN_TIME = 1; // How long it takes for a platform to spawn
const BLOCK_SPAWN_TIME = 4; // How long it takes for a land block to spawn
const MIN_X = -128; // Minimum platform X position
const MAX_X = 448; // Maximum platform X position

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime: IRuntime) {
    // Code to run just before 'On start of layout'
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e, runtime));
    
    // Things that happen before the layout starts
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime: IRuntime) {
    // Code to run before the layout starts
    
    // Get instances
    player = runtime.objects.Player.getFirstInstance()!;
    camPos = runtime.objects.CameraPosition.getFirstInstance()!;
    texWater = runtime.objects.TexWater.getFirstInstance()!;
    texWallsSmall = runtime.objects.TexWallsSmall.getFirstInstance()!;
    texWallsLarge = runtime.objects.TexWallsLarge.getFirstInstance()!;
    texGrass = runtime.objects.TexGrass.getFirstInstance()!;
    shadow = runtime.objects.Shadow.getFirstInstance()!;
    river = runtime.objects.River.getFirstInstance()!;
    uiTextTutorial = runtime.objects.UITextTutorial.getFirstInstance()!;
    uiTextScore = runtime.objects.UITextScore.getFirstInstance()!;
    uiTextGameOver = runtime.objects.UITextGameOver.getFirstInstance()!;
    splash = runtime.objects.Splash.getFirstInstance()!;
    
    // Get object interfaces
    plat = runtime.objects.Platform;
    landBlock0 = runtime.objects.LandBlock0;
    landBlock1 = runtime.objects.LandBlock1;
    landBlock2 = runtime.objects.LandBlock2;
    landBlock3 = runtime.objects.LandBlock3;
    
    // Get global objects
    camera = runtime.objects.Camera3D;
    keyboard = runtime.keyboard;
    
    // Get behaviors
    timer = runtime.objects.EventTimer.getFirstInstance()!.behaviors.Timer
    
    // Configure initial parameters for the game
    setupGame();
}


function onKeyDown(e: KeyboardEvent, runtime: IRuntime) {
    // Check if a key has been pressed

    // [Space] starts the game, if not started already
    if (e.key == " " && !gameStarted && !gameOver) {
        // Mark game-state as started
        gameStarted = true;
        
        // Fade-in score and fade-out tutorial
        uiTextTutorial.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );
        uiTextScore.behaviors.Tween.startTween(
            "opacity", 1, 0.5, "in-out-sine"
        );
        
        // Start platform timer
        timer.startTimer(PLAT_SPAWN_TIME, "platformspawn", "regular");
        
        // Start land block timer
        timer.startTimer(BLOCK_SPAWN_TIME * 2, "landblockspawn", "regular");

        // Process timer event
        timer.addEventListener("timer", e => timerEvent(e));
    
    // [Space] restarts the game, if game over screen is up
    } else if (e.key == " " && gameOver) {
        runtime.goToLayout(0);
    }
    
    // [Arrow Down] centers the player
    if (e.key == "ArrowDown" && gameStarted && !gameOver) {
        player.behaviors.Tween.startTween("angle", 0, 0.25, "in-out-sine");
    }
}

function setupGame() {
    // Configure initial parameters for the game
    
    // Set starting look position
    camera.lookAtPosition(
        camPos.x, camPos.y, camPos.zElevation,
        player.x, player.y, player.zElevation + 128,
        0, 1, 0
    );
    
    // Setup gameplay variables
    gameStarted = false;
    gameOver = false;
    lastX = 160;
    bounces = -1;
}

function timerEvent(e: TimerBehaviorEvent) {
    // Process timer events

    // Spawn a new platform
    if (e.tag == "platformspawn") {
        // Get a random number between -2 and 2 (inclusive)
        const xOffset = Math.floor(Math.random() * 4) - 2;

        // Use the number to place a new platform up to 2 widths of distance
        let newX = lastX + xOffset * plat.getFirstInstance()!.width;

        // If the platform will end up outside the map, invert the direction
        if (newX < MIN_X || newX > MAX_X) {
            newX = lastX - xOffset * plat.getFirstInstance()!.width;
        }

        // Create the platform and set its z-Elevation
        const p = plat.createInstance("World", newX, 180);
        p.zElevation = 256;

        // Mark last X as the new X of the platform
        lastX = p.x;
        
    // Spawn 2 new land blocks
    } else if (e.tag == "landblockspawn") {
        for (let i = 0; i < 2; i++) {
            // Set X position
            const newX = i == 0 ? -224 : 544;

            // Choose a random type of land block to spawn
            const lbtype = Math.floor(Math.random() * 4)

            let lb; // land block
            switch (lbtype) {
                case 0:
                    lb = landBlock0.createInstance("World", newX, 144);
                    break;
                case 1:
                    lb = landBlock1.createInstance(
                        "World", newX > 0 ? newX - 16 : newX + 16, 144
                    );
                    break;
                case 2:
                    lb = landBlock2.createInstance("World", newX, 144);
                    break;
                default:
                    lb = landBlock3.createInstance("World", newX, 144);
                    break;
            }

            // Create the landblock and set its z-Elevation
            lb.zElevation = 128 + Math.floor(Math.random() * 48);
        }
    }
}

function onTick(runtime: IRuntime) {
    // Code to run every tick
    
    if (gameStarted && !gameOver) {
        movePlayer(runtime);
        moveWorld(runtime);
    }
}

function movePlayer(runtime: IRuntime) {
    // Move the player according to gravity, bounce and inputs
    
    /* ========== Player X movement ========== */
    
    // Angle the character according to inputs
    if (keyboard.isKeyDown("ArrowLeft")) {
        // Limit maximum "negative" angle from the center
        if (player.angle > 7*Math.PI/4 || player.angle < Math.PI/2) {
            player.angle -= 2.5 * runtime.dt;
        }
    }
    if (keyboard.isKeyDown("ArrowRight")) {
        // Limit maximum "positive" angle from the center
        if (player.angle < Math.PI/4 || player.angle > 3*Math.PI/2) {
            player.angle += 2.5 * runtime.dt;
        }
    }
    
    // Set player X position limits
    player.x = Math.max(
        Math.min(
            player.x,
            MAX_X + plat.getFirstInstance()!.width/2
        ),
        MIN_X - plat.getFirstInstance()!.width/2
    );
    
    /* ========== Player bounce ========== */
    
    // Player is at the minimum height and should bounce
    if (player.y >= MIN_Y) {
    
        // Snap near-zero angles to zero, to make it easier to go straight
        let correctedAngle;
        if (player.angle < Math.PI/32 || player.angle > 63*Math.PI/32) {
            correctedAngle = 0;
        } else {
            correctedAngle = player.angle;
        }
    
    
        player.y = MIN_Y;
        // Move Y
        player.behaviors.Tween.startTween(
            "y", JUMP_HEIGHT * Math.cos(correctedAngle), 0.5,
            "out-cubic", {pingPong: true}
        );
        
        // Move X
        player.behaviors.Tween.startTween(
            "x", player.x + JUMP_LENGTH * Math.sin(correctedAngle), 0.5,
            "out-sine"
        );
        
        // Process all blocks
        let playerOverBlock = false;
        for (const b of plat.getAllInstances()) {
            
            // Check if the player is over the block
            const ovlpX = Math.abs(b.x - player.x) < b.width/2 + 4;
            const ovlpZ = Math.abs(
                b.zElevation + b.zHeight/2 - player.zElevation
            ) < b.zHeight/2;
            playerOverBlock ||= ovlpX && ovlpZ;
            
            // Move the block
            b.behaviors.Tween.startTween(
                "z-elevation", b.zElevation - b.zHeight, 1, "linear"
            );
            
            // Destroy platforms that are far away
            if (b.zElevation < -768) {
                b.destroy();
            }
        }
        
        // Player is not over the block (unsuccessful bounce)
        if (!playerOverBlock) {
            gameOverProcedure();
        
        // Player is over the block (successful bounce)
        } else {
            // Update score and display it to the player
            bounces++;
            uiTextScore.text = "Score: " + bounces;
            player.setAnimation("Extending");
        }
    }
    
    /* ========== Player shadow ========== */
    
    // Set the shadow right below the player
    shadow.x = player.x;
    shadow.y = river.y - 8;
    shadow.zElevation = player.zElevation - 6;
    
    // Define the height depending on wether it is over a platform or not
    for (const b of plat.getAllInstances()) {
        const ovlpXY = shadow.testOverlap(b);
        const ovlpZ = Math.abs(b.zElevation - shadow.zElevation) < b.zHeight;
        if (ovlpXY && ovlpZ) {
            shadow.y = b.y - 8;
        }
    }
}

function gameOverProcedure() {
    // Player has lost the game
    
    timer.stopAllTimers();
    gameOver = true;
    
    // Stop all platforms
    for (const b of plat.getAllInstances()) {
        for (const t of b.behaviors.Tween.allTweens()) {
            t.stop();
        }
    }
    
    // Stop all player tweens
    for (const t of player.behaviors.Tween.allTweens()) {
        t.stop();
    }
    
    // Player plunges into the water
    player.behaviors.Tween.startTween("y", 400, 0.5, "linear");
    shadow.isVisible = false;
    
    // Show splash
    splash.x = player.x;
    splash.y = 180;
    splash.zElevation = player.zElevation;
    splash.setAnimation("Splash");

    // Set game over text
    uiTextGameOver.text = "Game Over\nYour score: " + bounces + "\n\n" +
                          "Press [color=#ffff00]Space[/color] to try again...";
    
    // Fade-in game over and fade-out score
    uiTextScore.behaviors.Tween.startTween(
        "opacity", 0, 0.5, "in-out-sine"
    );
    uiTextGameOver.behaviors.Tween.startTween(
        "opacity", 1, 0.5, "in-out-sine"
    );
}

function moveWorld(runtime: IRuntime) {
    // Scroll the world
    
    // World textures
    texWater.imageOffsetY += 64 * runtime.dt;
    texWallsLarge.imageOffsetY += 16 * runtime.dt;
    texWallsSmall.imageOffsetY += 16 * runtime.dt;
    texGrass.imageOffsetY += 16 * runtime.dt;
    
    // Concatenate all land blocks
    const landBlocks = [
        ...landBlock0.getAllInstances(),
        ...landBlock1.getAllInstances(),
        ...landBlock2.getAllInstances(),
        ...landBlock3.getAllInstances(),
    ];
    
    // Move the land blocks
    for (const lb of landBlocks) {
        lb.zElevation -= 16 * runtime.dt;
        
        // Land blocks are destroyed if they are too far away
        if (lb.zElevation < -768) {
            lb.destroy();
        }
    }
}