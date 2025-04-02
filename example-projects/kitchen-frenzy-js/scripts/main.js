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

// Difficulty parameters
const PLAYERDELAY = 0.3; // Time taken by the player to change tables
const FOODDELAY = 1; // Time taken by the food to move through the table
const PERSONDELAY = 6; // Time taken by the person to move through the table
const PERSONDELAYBACK = 2; // Time taken by the person to move back
const PERSONSPAWNSTART = 5; // Maximum time required to spawn a person
const PERSONSPAWNREDUCE = 0.2; // Time reduction to spawn the next person
const PERSONSPAWNEND = 1.4; // Minimum time required to spawn a person
const PLATEDELAY = 4; // Time taken by empty plate to move through the table
const PLATESPAWNCHANCE = 0.25; // How likely an empty plate is to spawn
const MINPEOPLEFORPLATESPAWN = 4; // Min amount of people to spawn plate
const STARTINGSPAREPLATES = 2; // With how many spare plates the player starts
const STARTINGPOSINDEX = 2; // Player's starting position index
const WAITINGTIME = 500; // Waiting time before the inputs are enabled

// Settings
const MAXTHROWINGFRAME = 3; // Maximum frame number for throwing animation
const MAXPEOPLEANIMATIONNUMBER = 2; // Maximum number of people animations
const MAXFOODFRAME = 4; // Maximum frame number for the plate

// Gameplay variables
let playerPosIndex = STARTINGPOSINDEX; // Current player position index
let playerMoving = false; // Is the player making a move right now?
let currentPersonSpawnTime = PERSONSPAWNSTART; // Time taken to spawn a person
let numberOfPeopleSpawned = 0; // Number of people spawned
let score = 0; // Player's score
let sparePlates = STARTINGSPAREPLATES; // Player's spare plates
let controlsEnabled = false; // Player can input

/* These variables store object instances that are referenced later.
 * Their names reflect which objects they will later be assigned to
 */
let keyboard;
let player;
let timer;
let statsText;
let gameOverText;
let gameOverMask;
let playerMovementTween;

// List of all instances of a particular sprite
let playerPos;
let foodPos;
let personPos;

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout' on the first layout.
    
    // Get important instances and behaviors
    keyboard = runtime.keyboard;
    player = runtime.objects.Player.getFirstInstance();
    timer = runtime.objects.TimerManager.getFirstInstance().behaviors.Timer;
    statsText = runtime.objects.ScoreText.getFirstInstance();
    gameOverText = runtime.objects.GameOverText.getFirstInstance();
    gameOverMask = runtime.objects.gameOverMask.getFirstInstance();
    
    // Get important lists of instances
    playerPos = runtime.objects.PlayerPos.getAllInstances();
    foodPos = runtime.objects.FoodPos.getAllInstances();
    personPos = runtime.objects.PersonPos.getAllInstances();
    
    // Start person-spawn timer
    timer.addEventListener("timer", e => onTimer(e, runtime));
    timer.startTimer(currentPersonSpawnTime, "characterspawn", "once");
    
    // Wait a little before the player can input
    setTimeout(() => controlsEnabled = true, WAITINGTIME);
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onTimer(e, runtime) {
    // This function runs everytime the timer is up
    
    // Time to spawn a character
    if (e.tag == "characterspawn") {
        // Create a person at a random table
        const posIndex = Math.floor(Math.random() * 4);
        const person = runtime.objects.Person.createInstance(
            "Game",
            personPos[posIndex].x + 1,
            personPos[posIndex].y
        );
        person.setAnimation("Person_" + Math.floor(
            Math.random() * MAXPEOPLEANIMATIONNUMBER
        ));
        person.instVars.lane = posIndex;
        // Start movement Tween
        person.behaviors.Tween.startTween(
            "position",
            [personPos[posIndex].instVars.maxX, person.y],
            PERSONDELAY,
            "linear"
        );
        // Reduce spawn time and reset timer
        if (currentPersonSpawnTime - PERSONSPAWNREDUCE >= PERSONSPAWNEND) {
            currentPersonSpawnTime -= PERSONSPAWNREDUCE;
        }
        timer.startTimer(currentPersonSpawnTime, "characterspawn", "once");
        // Increase number of people spawned
        numberOfPeopleSpawned += 1;
        
        // Should an empty plate be spawned?
        if (
            Math.random() < PLATESPAWNCHANCE &&
            numberOfPeopleSpawned > MINPEOPLEFORPLATESPAWN
        ) {
            // Create the plate
            const plate = runtime.objects.Food.createInstance(
                "Game",
                foodPos[posIndex].instVars.minX + 1,
                foodPos[posIndex].y
            );
            // Set the animation to the empty version
            plate.setAnimation("Empty");
            // Start movement Tween
            plate.behaviors.Tween.startTween(
                "position",
                [foodPos[posIndex].x, plate.y],
                PLATEDELAY,
                "linear"
            );
        }
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    getPlayerInputs(runtime);
    resetPlayerAnimAndSpawnPlate(runtime);
    breakFoodPlates(runtime);
    makePersonGoAway(runtime);
    checkPersonAndFoodCollision(runtime);
}

function getPlayerInputs(runtime) {
    // Get player inputs, process them, and execute the proper actions
    
    // Check for game over continue
    if (keyboard.isKeyDown("Space") && gameOverText.isVisible) {
        resetGame(runtime);
    }
    
    // If controls are not enabled, ignore
    if (!controlsEnabled) return;
    
    // The player cannot change input while a movement is happening
    if (!playerMoving) {
        // Player moves down
        if (keyboard.isKeyDown("ArrowDown") && playerPosIndex < 3) {
            playerPosIndex += 1;
            moveThePlayer("RunningDown");
            playerMoving = true;
            
        // Player moves up
        } else if (keyboard.isKeyDown("ArrowUp") && playerPosIndex > 0) {
            playerPosIndex -= 1;
            moveThePlayer("RunningUp");
            playerMoving = true;
    
        // Player throws food
        } else if (keyboard.isKeyDown("Space")) {
            player.setAnimation("Throwing");
            playerMoving = true;
        }
    }
}

function resetPlayerAnimAndSpawnPlate(runtime) {
    // Check if the player stopped moving, if so, reset player movement
    
    // Get state of movement and throwing animations
    const movementStopped = playerMovementTween &&
                            playerMovementTween.isReleased;
    const throwingStopped = player.animationName == "Throwing" &&
                            player.animationFrame == MAXTHROWINGFRAME;
    
    // Reset player movement, if any of the above 2 has stopped
    if (movementStopped || throwingStopped) {
        playerMoving = false;
        playerMovementTween = null;
        player.setAnimation("Idle");
    }
    
    // Spawn plate
    if (throwingStopped) {
        const food = runtime.objects.Food.createInstance(
            "Game",
            foodPos[playerPosIndex].x - 1,
            foodPos[playerPosIndex].y
        );
        food.animationFrame = Math.floor(Math.random() * (MAXFOODFRAME + 1));
        food.behaviors.Tween.startTween(
            "position",
            [foodPos[playerPosIndex].instVars.minX, food.y],
            FOODDELAY,
            "linear"
        )
    }
}

function breakFoodPlates(runtime) {
    // Break food plates when they reach any of the ends of a table
    
    // Get all Food instances
    const foods = runtime.objects.Food.getAllInstances();
    
    // Create lists of possible minimum and maximum positions
    const PosMin = [...Array(4).keys()].map(i => foodPos[i].instVars.minX);
    const PosMax = [...Array(4).keys()].map(i => foodPos[i].x);
    
    // If any food has reached a possible ending position, break the plate
    for (const m of foods) {
        // Leftmost X
        if (PosMin.includes(m.x) && m.animationName.length < 6) {
            m.setAnimation("Broken");
            m.addEventListener("animationend", (e) => onFoodAnimationEnd(e));
            sparePlates -= 1; // If no spare, then it is game over!
            if (sparePlates < 0) gameOver(runtime);
            else updateStats();
        // Rightmost X and player is not close
        } else if (PosMax.includes(m.x) && m.animationName.length < 6) {
            if (!playerMovementTween && Math.abs(player.y - m.y) < 16) {
                m.destroy();
            } else {
                m.setAnimation("Broken");
                m.addEventListener(
                    "animationend", (e) => onFoodAnimationEnd(e)
                );
                sparePlates -= 1; // If no spare, then it is game over!
                if (sparePlates < 0) gameOver(runtime);
                else updateStats();
            }
        }
    }
}

function makePersonGoAway(runtime) {
    // Get all Person instances
    const people = runtime.objects.Person.getAllInstances();
    
    // Create lists of possible minimum and maximum positions
    const PosMin = [...Array(4).keys()].map(i => personPos[i].x);
    const PosMax = [...Array(4).keys()].map(i => personPos[i].instVars.maxX);
    
    // If any person has reached a possible ending position, execute an action
    for (const p of people) {
        // Leftmost X (exit)
        if (PosMin.includes(p.x)) {
            p.destroy();
        // Rightmost X
        } else if (PosMax.includes(p.x)) {
            gameOver(runtime); // Customer lost -> Game over!
        }
    }
}

function checkPersonAndFoodCollision(runtime) {
    // Check if a person got a full food plate
    
    // Get all current people and foods
    const people = runtime.objects.Person.getAllInstances();
    const foods = runtime.objects.Food.getAllInstances();
    
    // Get all people
    for (const p of people) {
        // Get all full food plates
        for (const m of foods) {
            // Check if a full plate is overlapping a person
            if (p.testOverlap(m) && m.animationName == "Full") {
                // Stop all current Tweens
                for (const t of p.behaviors.Tween.allTweens()) {
                    t.stop();
                }
                // Start a new tween to go back to the beginning
                p.behaviors.Tween.startTween(
                    "position",
                    [personPos[p.instVars.lane].x, p.y],
                    Math.abs(p.x - personPos[p.instVars.lane].x)/64,
                    "linear"
                );
                try {
                    p.setAnimation(p.animationName + "_Hold");
                    m.destroy();
                    score += 1;
                    updateStats();
                    
                } catch (_) {
                    // Person already going away, so ignore it
                }
            }
        }
    }
}

function moveThePlayer(newAnimation) {
    // Helper function to declutter getPlayerInputs
    
    // Set Tween
    const newPosition = [
        playerPos[playerPosIndex].x,
        playerPos[playerPosIndex].y
    ];
    playerMovementTween = player.behaviors.Tween.startTween(
        "position", newPosition, PLAYERDELAY, "out-sine"
    );
    
    // Set Animation
    player.setAnimation(newAnimation);
}

function onFoodAnimationEnd(e) {
    // Destroy the food plate
    
    e.instance.destroy();
}

function updateStats() {
    // Update StatsText information
    
    statsText.text = "Spare Plates: " + Math.max(sparePlates, 0) +
                     "\nScore: " + score;
}

function gameOver(runtime) {
    // Game over
    
    // Disable controls
    controlsEnabled = false;
    
    // Get all current people and foods
    const people = runtime.objects.Person.getAllInstances();
    const foods = runtime.objects.Food.getAllInstances();
    
    // Stop all Timers
    timer.stopTimer("characterspawn");
    
    // Stop all people Tweens
    for (const p of people)
        for (const t of p.behaviors.Tween.allTweens())
            t.stop();
    
    // Stop all Food Tweens
    for (const m of foods) 
        for (const t of m.behaviors.Tween.allTweens())
            t.stop();
    
    // Show Game Over text and mask
    gameOverText.isVisible = true;
    gameOverMask.isVisible = true;
}

function resetGame(runtime) {
    // Reset the game
    
    // Set Game Over text and mask as invisible
    gameOverText.isVisible = false;
    gameOverMask.isVisible = false;
    
    // Get all current people and foods
    const people = runtime.objects.Person.getAllInstances();
    const foods = runtime.objects.Food.getAllInstances();
    
    // Delete all people
    for (const p of people)
        p.destroy();
    
    // Delete all Foods
    for (const m of foods) 
        m.destroy();
    
    // Reset gameplay variables
    playerPosIndex = STARTINGPOSINDEX;
    playerMoving = false;
    currentPersonSpawnTime = PERSONSPAWNSTART;
    numberOfPeopleSpawned = 0;
    score = 0;
    sparePlates = STARTINGSPAREPLATES;
    player.x = playerPos[playerPosIndex].x;
    player.y = playerPos[playerPosIndex].y;
    
    // Reset statsText
    updateStats();
    
    // Start timer
    timer.startTimer(currentPersonSpawnTime, "characterspawn", "once");
    
    // Wait a little before the player can input
    setTimeout(() => controlsEnabled = true, WAITINGTIME);
}