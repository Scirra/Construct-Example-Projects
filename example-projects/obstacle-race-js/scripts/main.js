/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * E-mail: ferreiramoreiramateus@gmail.com | Twitter: @BonzerKitten
 *
 * Felipe Vaiano Calderan - Programmer
 * E-mail: fvcalderan@gmail.com | Twitter: @fvcalderan
 *
 * Wesley Andrade - Artist
 * E-mail: wesleymatos1989@gmail.com | Twitter: @andrart7
 *
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Object instances
let player; // Player character
let computer1; // computer 1 character
let computer2; // computer 2 character
let background;
let textTutorial;
let textRSG; // Ready Set Go text
let textTimer;
let textDistance;
let textPodium;
let fader;
let timer;

// List of instances
let chars; // All characters
let textPlayerNames; // All player names texts

// Object interfaces
let obstacle;

// Global objects
let keyboard;

// Gameplay variables
let lastDir; // Last direction pressed (0 - left | 1 - right)
let tutorial; // Is the player reading the tutorial?
let pressedSpace; // Has the player pressed space to skip the tutorial?
let remainingTime; // How many seconds remaining until the game is over
let gameOver; // Is the game over?
let totalDistance; // Total distance ran

// Settings
const PLAYER_ID = 0; // Character of ID PLAYER_ID is the player
const P_SPEED_GAIN = 1; // Speed gained by the player per correct press
const P_SPEED_LOSS = 10; // Speed lost by the player each frame
const P_SPEED_MAX = 20; // Maximum player speed
const CPU1_ID = 1; // Character of ID CPU1_ID is the computer 1
const CPU1_ACCEL = 1; // computer 1 acceleration
const CPU1_MAX = 18; // Maximum computer 1 speed
const CPU2_ID = 2; // Character of ID CPU2_ID is the computer 2
const CPU2_ACCEL = 1.6; // computer 2 acceleration
const CPU2_MAX = 16; // Maximum computer 2 speed
const CPU_POS_RATIO = 15; // The higher, the closer the player and CPU are
const BG_SPEED = 20; // Background movement speed

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
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


function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Configure initial game parameters
    lastDir = "Left";
    tutorial = true;
    pressedSpace = false;
    remainingTime = 20;
    gameOver = false;
    totalDistance = 0;
    
    // Get list of instances
    chars = runtime.objects.Character.getAllInstances();
    textPlayerNames = runtime.objects.TextPlayerName.getAllInstances();
    
    // Get instances
    for (const c of chars) {
        if (c.instVars.characterID == PLAYER_ID) {
            player = c;
        } else if (c.instVars.characterID == CPU1_ID) {
            computer1 = c;
        } else if (c.instVars.characterID == CPU2_ID) {
            computer2 = c;
        }
    }
    background = runtime.objects.Background.getFirstInstance();
    textTutorial = runtime.objects.TextTutorial.getFirstInstance();
    textRSG = runtime.objects.TextRSG.getFirstInstance();
    textTimer = runtime.objects.TextTimer.getFirstInstance();
    textDistance = runtime.objects.TextDistance.getFirstInstance();
    textPodium = runtime.objects.TextPodium.getFirstInstance();
    fader = runtime.objects.Fader.getFirstInstance();
    timer = runtime.objects.Timer.getFirstInstance().behaviors.Timer;
    
    // Get object interfaces
    obstacle = runtime.objects.Obstacle;
    
    // Get global objects
    keyboard = runtime.keyboard;
}


function onKeyDown(e, runtime) {
    // Process keyboard inputs
    
    // Skip tutorial
    if (e.key == " " && tutorial && !pressedSpace) {
    
        // Player skipped the tutorial
        pressedSpace = true;
        
        // Hide fader and tutorial text
        textTutorial.behaviors.Tween.startTween(
            "opacity", 0.0, 1.0, "in-out-sine"
        );
        fader.behaviors.Tween.startTween(
            "opacity", 0.0, 1.0, "in-out-sine"
        );
        
        // Start essential timers
        timer.startTimer(1.0, "readytimer", "once");
        timer.startTimer(2.0, "settimer", "once");
        timer.startTimer(3.0, "gotimer", "once");
        timer.addEventListener("timer", e => processTimer(e));
    }
    
    // Restart the game if the game is over
    if (e.key == " " && gameOver) {
        runtime.goToLayout("Game");
    }
    
    // Other inputs only work outside tutorial and game over states
    if (tutorial || gameOver) {
        return;
    }
    
    // Used to check if the player pressed the correct key
    const lastLastDir = lastDir; 
    
    // Check keypress
    if (e.key == "ArrowLeft" && lastDir == "Right") {
        lastDir = "Left";
    } else if (e.key == "ArrowRight" && lastDir == "Left") {
        lastDir = "Right"
    }
    
    // If keypress has changed direction, it was a correct one
    if (lastLastDir != lastDir) {
        player.instVars.speed = Math.min(
            P_SPEED_MAX, player.instVars.speed + P_SPEED_GAIN
        );
    } else {
        player.instVars.speed = Math.max(
            5, player.instVars.speed - P_SPEED_GAIN/2
        );
    }
    
    // Jump
    if (e.key == "ArrowUp" && !player.instVars.jumping) {
        characterJump(PLAYER_ID);
    }
}

function processTimer(e) {
    // Process timer events
    
    // READY
    if (e.tag == "readytimer") {
        textRSG.text = "READY";
        textRSG.opacity = 1.0;
    }
    
    // SET
    if (e.tag == "settimer") {
        textRSG.text = "SET";
    }
    
    // GO!
    if (e.tag == "gotimer") {
        textRSG.text = "[color=#ffff00]GO![/color]";
        
        // Hide player names
        for (const tpn of textPlayerNames) {
            tpn.behaviors.Tween.startTween(
                "opacity", 0.0, 1.0, "in-out-sine"
            );
        }
        
        // Hide Ready Set Go text
        textRSG.behaviors.Tween.startTween(
            "opacity", 0.0, 1.0, "in-out-sine"
        );
        
        // Disable tutorial mode
        tutorial = false;
        
        // Set all characters animations to Running
        for (const c of chars) {
            if (c.animationName != c.instVars.characterID + "_Tired") {
                c.setAnimation(c.instVars.characterID + "_Running");
            }
        }
        
        // Start counting down the "Time remaining"
        timer.startTimer(1.0, "remainingtimer", "regular");
        
        // Show timer and distance text boxes
        textTimer.behaviors.Tween.startTween(
            "opacity", 1.0, 1.0, "in-out-sine"
        );
        textDistance.behaviors.Tween.startTween(
            "opacity", 1.0, 1.0, "in-out-sine"
        );
    }
    
    // Countdown remaining time until the game is over
    if (e.tag == "remainingtimer") {
    
        // Decrement timer and update text
        remainingTime -= 1;
        textTimer.text = "[color=#ffff00]Time remaining:[/color] " +
                         remainingTime + "s";
                         
        // Time is up. Game over!
        if (remainingTime == 0) {
            gameOverProcedure();
        }
    }
}

function gameOverProcedure() {
    // Set of actions to be executed when the game is over

    // Stop all timers and mark game as over
    timer.stopAllTimers();
    gameOver = true;
    
    // Set all characters animations to Tired
    for (const c of chars) {
        c.setAnimation(c.instVars.characterID + "_Tired");
    }
    
    // Calculate podium.
    let c1dist = 0;
    let c2dist = 0;
    // CPU distances aren't real, but rather based on the player's distance
    for (const c of chars) {
        if (c.instVars.characterID == CPU1_ID) {
            c1dist = totalDistance + (c.x - player.x)/48;
        } else if (c.instVars.characterID == CPU2_ID) {
            c2dist = totalDistance + (c.x - player.x)/48;
        }
    }
    
    // Create unordered podium
    const thePodium = [
        ["PLAYER", totalDistance],
        ["CPU1", c1dist],
        ["CPU2", c2dist],
    ];
    
    // Order podium correctly
    thePodium.sort((a,b) => b[1] - a[1]);
    
    // Set podium text
    textPodium.text = textPodium.text.replace("AAAAA", thePodium[0][0]);
    textPodium.text = textPodium.text.replace(
        "aaaaa", thePodium[0][1].toFixed(1)
    );
    textPodium.text = textPodium.text.replace("BBBBB", thePodium[1][0]);
    textPodium.text = textPodium.text.replace(
        "bbbbb", thePodium[1][1].toFixed(1)
    );
    textPodium.text = textPodium.text.replace("CCCCC", thePodium[2][0]);
    textPodium.text = textPodium.text.replace(
        "ccccc", thePodium[2][1].toFixed(1)
    );
    
    // Show podium
    textPodium.behaviors.Tween.startTween(
        "opacity", 1.0, 1.0, "in-out-sine"
    );
}

async function characterJump(characterID) {
    // Make a character jump

    let cchar; // Current character

    // Identify correct character
    for (const c of chars) {
        if (c.instVars.characterID == characterID) {
            cchar = c;
        }
    }
    
    // Set animation as Jumping
    cchar.setAnimation(cchar.instVars.characterID + "_Jumping");
    
    // Start jump tween
    const t = cchar.behaviors.Tween.startTween(
        "y", cchar.y - 32, 0.33, "out-sine", {pingPong: true}
    );
    
    // Set character's state as jumping
    cchar.instVars.jumping = true;
    
    // Wait until the tween has finished
    await t.finished;
    
    // Set character's state as not jumping
    cchar.instVars.jumping = false;
    
    // Set character's animation as Running
    if (cchar.animationName != cchar.instVars.characterID + "_Tired") {
        cchar.setAnimation(cchar.instVars.characterID + "_Running");
    }
}

function onTick(runtime)
{
    // Code to run every tick
    
    // If the game state is either tutorial or game over, ignore
    if (tutorial || gameOver) {
        return;
    }
    
    // Move background
    background.imageOffsetX -= player.instVars.speed * runtime.dt * BG_SPEED;
    
    // Spawn obstacles every 1 complete background cycle
    if (background.imageOffsetX < -background.imageWidth) {
        const obst = obstacle.createInstance("Game", 360, 180);
        obst.moveToBottom();
        background.moveToBottom();
        background.imageOffsetX = 0;
    }
    
    // Move obstacles together with the background
    for (const obst of obstacle.getAllInstances()) {
        obst.x -= player.instVars.speed * runtime.dt * BG_SPEED;
    }
    
    // Update player's speed
    player.instVars.speed = Math.max(
        5, player.instVars.speed - P_SPEED_LOSS * runtime.dt
    );
    
    // Increment total distance. 250 makes the value believable (in meters)
    totalDistance += player.instVars.speed/250; 
    textDistance.text = "[color=#ffff00]Distance:[/color] " +
                        totalDistance.toFixed(1) + "m";
    
    // Update computer's speed and position
    computerAccelerate(runtime);
    computerJump();
    checkCollisions();
    
    // Update character's animation speed
    for (const c of chars) {
        c.animationSpeed = Math.round(c.instVars.speed * 1.5);
    }
}

function computerAccelerate(runtime) {
    // Computer-controlled characters accelerate

    // computer 1 accelerates
    computer1.instVars.speed = Math.min(
        computer1.instVars.speed + CPU1_ACCEL * runtime.dt,
        CPU1_MAX
    );
    
    // computer 1 moves
    computer1.x += (
        computer1.instVars.speed - player.instVars.speed
    )/CPU_POS_RATIO;
    
    // computer 2 accelerates
    computer2.instVars.speed = Math.min(
        computer2.instVars.speed + CPU2_ACCEL * runtime.dt,
        CPU2_MAX
    );
    
    // computer 2 moves
    computer2.x += (
        computer2.instVars.speed - player.instVars.speed
    )/CPU_POS_RATIO;    
}

function computerJump() {
    // When a computer-controlled character gets close to a barrier, it jumps
    
    // Check for every obstacle
    for (const obst of obstacle.getAllInstances()) {
    
        // computer 1 detects proximity and performs a jump, if needed
        if (
            computer1.x - obst.x > -38 - player.instVars.speed * 2 &&
            computer1.x - obst.x < 0 &&
            !computer1.instVars.jumping
        ) {
            characterJump(computer1.instVars.characterID);
        }
        
        // computer 2 detects proximity and performs a jump, if needed
        if (
            computer2.x - obst.x > -38 - player.instVars.speed * 2 &&
            computer2.x - obst.x < 0 &&
            !computer2.instVars.jumping
        ) {
            characterJump(computer2.instVars.characterID);
        }
    }
}

function checkCollisions() {
    // Check collision between the characters and obstacles
    
    for (const obst of obstacle.getAllInstances()) {
        for (const c of chars) {
            if (
                c.testOverlap(obst) &&
                !c.instVars.jumping &&
                !obst.instVars.alreadyCollided
            ) {
                // If there is a collision, character loses speed
                c.instVars.speed = Math.max(c.instVars.speed - 10, 5);
                obst.instVars.alreadyCollided = true;
            }
        }
    }
}