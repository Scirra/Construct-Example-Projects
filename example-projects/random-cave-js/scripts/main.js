/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * X: @BonzerKitten
 * E-mail: ferreiramoreiramateus@gmail.com
 *
 * Felipe Vaiano Calderan - Programmer
 * X: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 * X: @andrart7
 * E-mail: wesleymatos1989@gmail.com
 *
 * Help us make new examples by supporting our work on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instances
let canvas;
let texWall;
let texWalkable;
let shaker;
let fader;
let textTuto;

// Object interfaces
let tile;
let playerObject;
let bomb;
let explosion;
let debris;
let goldObject;

// Global objects
let advRnd;
let keyboard;

// Gameplay variables
let player; // player instance after it is created
let gold; // gold instance after it is created
let map; // abstract map - contains where there should be a wall or free space
let mapTiles; // store all the map tiles objects
let mapSzTiles; // map size in tiles, instead of absolute x or y sizes
let tutorial; // Is the tutorial on?
let gameOver; // Is the game over?
let currentBomb; // Currently placed bomb

// Settings
const TILESIZE = 16; // how big the tiles are
const BOMBTIME = 0.5; // how long it takes for a bomb to explode

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
    
    // Keyboard inputs
    runtime.addEventListener("keydown", (e) => onKeyDown(e, runtime));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));    
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Get instances
    canvas = runtime.objects.DrawingCanvas.getFirstInstance();
    texWall = runtime.objects.TexWall.getFirstInstance();
    texWalkable = runtime.objects.TexWalkable.getFirstInstance();
    shaker = runtime.objects.Shaker.getFirstInstance();
    fader = runtime.objects.Fader.getFirstInstance();
    textTuto = runtime.objects.TextTutorial.getFirstInstance();
    
    // Get object interfaces
    tile = runtime.objects.Tile;
    playerObject = runtime.objects.Player;
    bomb = runtime.objects.Bomb;
    explosion = runtime.objects.Explosion;
    debris = runtime.objects.Debris;
    goldObject = runtime.objects.Gold;
    
    // Get global objects
    advRnd = runtime.objects.AdvancedRandom;
    keyboard = runtime.keyboard;
    
    // Set variables
    mapSzTiles = {
        x: Math.ceil(runtime.getLayout(1).width/TILESIZE),
        y: Math.ceil(runtime.getLayout(1).height/TILESIZE)
    }
    map = [...Array(mapSzTiles.x)].map(() => Array(mapSzTiles.y));
    mapTiles = [...Array(mapSzTiles.x)].map(() => Array(mapSzTiles.y));
    tutorial = true;
    gameOver = false;
    currentBomb = null;
    
    generateAbstractMap(runtime);
    placeGold();
    placePlayer(runtime);
    generateMap(true);
}

function onKeyDown(e, runtime) {
    // Process player single key downs
    
    // Turn tutorial off
    if (e.key == " " && tutorial && fader.opacity == 0.75) {
        
        // Fade tutorial out
        fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
        textTuto.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
        
        // Disable the tutorial
        setTimeout(() => tutorial = false, 500);
        
    // Place a bomb, if there is only one in the map
    } else if (e.key == " " && !tutorial && !gameOver && !currentBomb) {
    
        // Create the bomb
        currentBomb = bomb.createInstance("Player", player.x, player.y);

        // Make it collide with the tiles
        currentBomb.behaviors.Physics.behavior.setCollisionsEnabled(
            runtime.objects.Bomb, runtime.objects.Tile, true
        );

        // Explosion timer is up
        currentBomb.behaviors.Timer.addEventListener(
            "timer", () => explodeBomb(currentBomb)
        );
    
    // Explode bomb
    } else if (
        e.key == " " && !tutorial && !gameOver && currentBomb &&
        !currentBomb.behaviors.Sine.isEnabled
    ) {
    
        // Start explosion timer
        currentBomb.behaviors.Timer.startTimer(BOMBTIME, "bExp", "once");
        
        // Start flashing
        currentBomb.behaviors.Sine.isEnabled = true;
    }
}

function explodeBomb(b) {
    // Explode thrown bomb

    // Spawn explosion
    const ex = explosion.createInstance("Player", b.x, b.y);

    // Explosion should be destroyed after it finishes animating
    ex.addEventListener("animationend", () => ex.destroy());
    
    // Create a room around the bomb
    makeRoom(Math.ceil(b.x/TILESIZE), Math.ceil(b.y/TILESIZE), 3);
    
    // Redraw canvas
    canvas.clearCanvas([0, 0, 0, 0]);
    generateMap(false);
    
    // Generate debris
    for (let i = 0; i < 8; i++) {
        const d = debris.createInstance("Player", b.x, b.y);
        d.behaviors.Bullet.angleOfMotion = Math.PI/4 * i;
    }
    
    // Start screen shaker
    shaker.behaviors.Tween.startTween(
        "value", 0, 0.25, "out-sine", {startValue: 32, tags: "shake"}
    );
    
    // Free currentBomb variable to let another one be spawned
    currentBomb = null;

    // Destroy the bomb
    b.destroy();
}

function generateAbstractMap(runtime) {
    // Generate abstract map using binary perlin noise
    
    // First, create the abstract map
    for (let i = 0; i < runtime.getLayout(1).width; i += TILESIZE) {
        for (let j = 0; j < runtime.getLayout(1).height; j += TILESIZE) {
        
            // Map to tile coordinates
            const iTile = Math.ceil(i / TILESIZE);
            const jTile = Math.ceil(j / TILESIZE);
            
            // Set map borders as walls
            if (
                iTile == 0 || iTile == mapSzTiles.x - 1 ||
                jTile == 0 || jTile == mapSzTiles.y - 1
            ) {
                map[iTile][jTile] = 1;
                
            // Set binary perlin noise using AdvancedRandom
            } else {
                map[iTile][jTile] = 1-Math.round(advRnd.classic2d(i, j));
            }
        }
    }
}

function generateMap(genTiles) {
    // Generate physical map based on current abstract map
    
    // Then, build the image with the shadows for a depth effect
    for (let i = 0; i < mapSzTiles.x; i++) {
        for (let j = 0; j < mapSzTiles.y; j++) {
        
            // Get noise value
            const noise = map[i][j];
            
            // Tile to map coordinates
            const iMap = i * TILESIZE;
            const jMap = j * TILESIZE;
            
            /* Paint the map according to the noise value, using the logic:
             *
             * - Transparent where it should be a walkable/free space
             *
             * - White where it should be a wall. This is masked by Walls layer
             *   "Source in" blend mode, letting the correct BG show.
             */
            canvas.fillRect(
                iMap, jMap, iMap + TILESIZE, jMap + TILESIZE,
                [noise, noise, noise, noise]
            );
            
            // Where there is supposed to be a wall, place a solid tile
            if (noise == 1 && genTiles) {
                const t = tile.createInstance("Colliders", iMap, jMap);
                mapTiles[i][j] = t;
                
                // Set tile xTile and yTile variables to i and j
                t.instVars.xTile = i;
                t.instVars.yTile = j;
            }
        }
    }
}

function placePlayer(runtime) {
    // Place the player object at a random initial position
    
    // Set initial position in the first/third quadrant
    const rndPos = {
        x: Math.ceil(clamp(Math.random(), 0.1, 0.9) * (mapSzTiles.x/4)),
        y: Math.ceil(clamp(Math.random(), 0.1, 0.9) * mapSzTiles.y)
    };
    
    // Create the player
    player = playerObject.createInstance(
        "Player", rndPos.x * TILESIZE, rndPos.y * TILESIZE
    );
    
    // Create a room around the player
    makeRoom(rndPos.x, rndPos.y, 2);
    
    // The camera should immediately focus the player
    runtime.getLayout(1).scrollTo(player.x, player.y);
}

function placeGold() {
    // Place the gold object at a random initial position
    
    // Set initial position in the second/fourth quadrant
    const rndPos = {
        x: Math.ceil((clamp(Math.random(), 0.1, 0.9) + 3) * mapSzTiles.x/4),
        y: Math.ceil(clamp(Math.random(), 0.1, 0.9) * mapSzTiles.y)
    };
    
    // Create the player
    gold = goldObject.createInstance(
        "Player", rndPos.x * TILESIZE, rndPos.y * TILESIZE
    );
    
    // Create a room around the player
    makeRoom(rndPos.x, rndPos.y, 2);
    
    gold.behaviors.Physics.behavior.setCollisionsEnabled(
        goldObject, tile, true
    );
}

function makeRoom(x, y, radius) {
    // Create a room in given x, y position of a given radius
    
    for (let i = x - radius; i < x + radius; i++) {
        for (let j = y - radius; j < y + radius; j++) {
            if (
                i > 1 && i < mapSzTiles.x - 1 &&
                j > 1 && j < mapSzTiles.y - 1
            ) {
                // Set abstract map
                map[i][j] = 0;
                // Set physical map
                if (
                    mapTiles[i] !== undefined &&
                    mapTiles[i][j] !== undefined
                ) {
                    mapTiles[i][j].destroy();
                    mapTiles[i][j] = undefined;
                }
            }
        }
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    getPlayerInputs(runtime);
    animatePlayerObject(runtime);
    animateBombs();
    moveCamera(runtime);
    checkPlayerGoldCollision(runtime);
}

function getPlayerInputs(runtime) {
    // Process player continuous inputs
    
    // If tutorial is on or game is over, ignore.
    if (tutorial || gameOver) {
        return;
    }
    
    // Simulate platformer controls
    if (keyboard.isKeyDown("ArrowLeft")) {
        player.behaviors.Platform.simulateControl("left");
        player.width = -player.imageWidth;
    }
    if (keyboard.isKeyDown("ArrowRight")) {
        player.behaviors.Platform.simulateControl("right");
        player.width = player.imageWidth;
    }
    if (keyboard.isKeyDown("ArrowUp")) {
        player.behaviors.Platform.simulateControl("jump");
    }
}

function animatePlayerObject() {
    // Animate player object according to current action
    
    // Get the platformer behavior
    const plat = player.behaviors.Platform
    
    // Animate player according to action
    if (plat.isMoving) {
        player.setAnimation("Running");
    } else {
        player.setAnimation("Idle");
    }
    
    if (plat.isJumping) {
        player.setAnimation("Jumping");
    }
    
    if (plat.isFalling) {
        player.setAnimation("Falling");
    }
}


function animateBombs() {
    // Make bombs shine

    for (const b of bomb.getAllInstances()) {
        // Only works if Sine is enabled
        if (b.behaviors.Sine.isEnabled) {
            b.effects[0].setParameter(
                2, Math.abs(b.behaviors.Sine.value) + 0.75
            );
        }
    }
}

function moveCamera(runtime) {
    // Move the camera smoothly
    
    // Ger game layout
    const lay = runtime.getLayout(1);
    
    // Get current shake strength
    let shake = 0;
    for(const t of shaker.behaviors.Tween.allTweens()) {
        if (t.tags == "shake") {
            shake = t.value;
        }
    }
    
    // Make camera follow the player smoothly and shake, if necessary
    lay.scrollTo(
        lerp(
            lay.scrollX + (Math.random() - 0.5) * shake,
            player.x,
            5 * runtime.dt
        ),
        lerp(
            lay.scrollY + (Math.random() - 0.5) * shake,
            player.y,
            5 * runtime.dt
        ),
    );
}

function checkPlayerGoldCollision(runtime) {
    // If the player collides with the gold, fade-out and restart the game
    
    if (player.testOverlap(gold) && !gameOver) {
        gameOver = true;
        fader.behaviors.Tween.startTween("opacity", 1, 1, "in-out-sine");
        setTimeout(() => runtime.goToLayout(1), 1000);
    }
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function clamp(val, min, max) {
    // Simple helper function to clamp a value

    return Math.max(Math.min(val, max), min);
}