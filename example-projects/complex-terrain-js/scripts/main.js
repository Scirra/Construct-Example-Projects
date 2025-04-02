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
let terrain;
let water;
let ring;
let tintOverlay;

// List of instances
let pyramids;
let pillarsMedium;
let pillarsTall;
let boxes;
let cacti;

// Global objects
let camera;
let mouse;
let keyboard;

// Textures
let textures;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Settings
const MOUSESENSITIVITY = 0.0025; // Mouse sensitivity
const LERPFACTOR = 0.2; // Lerp factor
const MESHRESX = 80; // Mesh X resolution (number of x divisions)
const MESHRESY = 80; // Mesh Y resolution (number of y divisions)
const TERRAINHEIGHT = 200; // Starting terrain height
const WATERHEIGHT = 139.5; // Water effect height
const RUNSPEED = 200; // Player running speed
const WALKSPEED = 100; // Player waking speed
const FOGCOLOR = [140/255, 235/255, 242/255]; // Fog color

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Get instances
    player = runtime.objects.Player.getFirstInstance();
    terrain = runtime.objects.Terrain.getFirstInstance();
    water = runtime.objects.Water.getFirstInstance();
    ring = runtime.objects.Ring.getFirstInstance();
    tintOverlay = runtime.objects.TintOverlay.getFirstInstance();
    
    // Get list of instances
    pyramids = runtime.objects.Pyramid.getAllInstances();
    pillarsMedium = runtime.objects.PillarMedium.getAllInstances();
    pillarsTall = runtime.objects.PillarTall.getAllInstances();
    boxes = runtime.objects.Box.getAllInstances();
    cacti = runtime.objects.Cactus.getAllInstances();
    
    // Get global objects
    camera = runtime.objects.Camera3D;
    mouse = runtime.mouse;
    keyboard = runtime.keyboard;
    
    // Textures
    textures = [
        runtime.objects.TextureWireframe,
        runtime.objects.TexturePyramid0,
        runtime.objects.TexturePyramid1,
        runtime.objects.TexturePillarBottom,
        runtime.objects.TexturePillarMedium,
        runtime.objects.TexturePillarTall,
        runtime.objects.TextureBox,
        runtime.objects.TextureCactusTop,
        runtime.objects.TextureCactus
    ]
    
    // Configure initial parameters for the game
    setupGame();
    
    // Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseDown(e));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function setupGame() {
    // Configure initial parameters for the game
    
    // Starting camera's spherical coordinates
    camLookTheta = -Math.PI/2;
    camLookPhi = Math.PI/2;
    
    // Spherical coordinates converted to cartesian coordinates
    const camLookX = Math.cos(camLookTheta) * Math.sin(camLookPhi);
    const camLookY = Math.sin(camLookTheta) * Math.sin(camLookPhi);
    const camLookZ = Math.cos(camLookPhi);
    
    // Set starting look position
    camera.lookAtPosition(
        player.x, player.y, 16, camLookX, camLookY, camLookZ, 0, 0, 1
    );
    
    // Set player elevation
    player.zElevation = TERRAINHEIGHT
    
    // Create a mesh with (MESHRESX, MESHRESY) divisions
    terrain.createMesh(MESHRESX, MESHRESY);
    
    // Model a complex terrain according to mathematical equations
    for (let i = 0; i < MESHRESX; i++) {
        for (let j = 0; j < MESHRESY; j++) {
            terrain.setMeshPoint(i, j, {
                mode: "relative", x: 0, y: 0, u: 0, v: 0,
                zElevation: terrainElevation(
                    i - MESHRESX/2, j - MESHRESY/2
                ) + TERRAINHEIGHT
            });
        }
    }
}

function onMouseDown(_) {
    // If mouse is not locket yet, lock it
    
    if (document.pointerLockElement !== mouseLocker)
        mouseLocker.requestPointerLock();
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

function onTick(runtime) {
    // Code to run every tick
    
    setCamera3D();
    getKeyboardInputs(runtime);
    setUnderwaterTint(runtime);
}

function setCamera3D() {
    // Set camera position and rotation to follow the player
    
    const camX = player.x; // Camera X
    const camY = player.y; // Camera Y
    
    // Use terrain function to get correct camera height at any given point
    const zxratio = terrain.width/MESHRESX;
    const zyratio = terrain.width/MESHRESY;
    const camZ = 24 + player.zElevation + terrainElevation(
        player.x/zxratio - MESHRESX/2, player.y/zyratio - MESHRESY/2
    )
    
    // Spherical coordinates converted to cartesian coordinates
    camLookX = Math.cos(camLookTheta) * Math.sin(camLookPhi);
    camLookY = Math.sin(camLookTheta) * Math.sin(camLookPhi);
    camLookZ = -Math.cos(camLookPhi);
    
    // Apply camera settings
    camera.lookAtPosition(
        camX, camY, camZ,
        camX + camLookX,camY + camLookY, camZ + camLookZ,
        0, 0, 1
    );
}

function getKeyboardInputs(runtime) {
    // Get player's inputs
    
    // Shorthand for player's 8 Direction behavior
    const eightd = player.behaviors.EightDirection;
    
    // Shorthand for layer's Fog effect
    const fx = runtime.getLayout(0).getLayer(0).effects[0]; 
    
    // Is the player running?
    eightd.maxSpeed = keyboard.isKeyDown("ShiftLeft") ? RUNSPEED : WALKSPEED;
    
    // Does the player want to see the wireframe?
    terrain.setAnimation(keyboard.isKeyDown("Space") ? "Wire" : "Texture");
    water.setAnimation(keyboard.isKeyDown("Space") ? "Wire" : "Texture");
    ring.setAnimation(keyboard.isKeyDown("Space") ? "Wire" : "Texture");
    fx.setParameter(0, keyboard.isKeyDown("Space") ? [0, 0, 0] : FOGCOLOR);
    
    if (keyboard.isKeyDown("Space")) {
        setAllTextures(pillarsMedium, 0, 0, 0, 0, 0, 0);
        setAllTextures(pillarsTall, 0, 0, 0, 0, 0, 0);
        setAllTextures(boxes, 0, 0, 0, 0, 0, 0);
        setAllTextures(pyramids, 0, 0, 0, 0, 0, 0);
        setAllTextures(cacti, 0, 0, 0, 0, 0, 0);
    } else {
        setAllTextures(pillarsMedium, 3, 3, 4, 4, 4, 4);
        setAllTextures(pillarsTall, 3, 3, 5, 5, 5, 5);
        setAllTextures(boxes, 3, 3, 6, 6, 6, 6);
        setAllTextures(pyramids, 0, 0, 0, 1, 0, 2);
        setAllTextures(cacti, 7, 7, 8, 8, 8, 8);
    }

    // Directional inputs
    const inputRight = keyboard.isKeyDown("KeyD");
    const inputLeft = keyboard.isKeyDown("KeyA");
    const inputUp = keyboard.isKeyDown("KeyW");
    const inputDown = keyboard.isKeyDown("KeyS");
    
    // Compute axes
    const horizontalAxis = inputRight - inputLeft;
    const verticalAxis = inputUp - inputDown;
    
    // If the player is inputting  one or more axes, move the player's object
    if (horizontalAxis != 0 || verticalAxis != 0) {
        const axisAngle = Math.atan2(horizontalAxis, verticalAxis);
        eightd.setVector(
            Math.cos(camLookTheta + axisAngle) * eightd.maxSpeed,
            Math.sin(camLookTheta + axisAngle) * eightd.maxSpeed,
        )
    } else {
        eightd.setVector(0, 0);
    }
}

function setAllTextures(objList, fn, bk, tp, bt, l, r) {
    // Set textures for all the faces of a 3D object
    
    const textureDict = {
        "front": textures[fn],
        "back": textures[bk],
        "top": textures[tp],
        "bottom": textures[bt],
        "left": textures[l], 
        "right": textures[r]
    };
    
    for (const o of objList)
        for (const [k, v] of Object.entries(textureDict))
            o.setFaceObject(k, v);
}

function setUnderwaterTint(runtime) {
    // When the player is under water, apply a tint to the screen
    
    // Shorthand for layer's HSL effect
    const fx = runtime.getLayout(0).getLayer(0).effects[1]; 
    
    // Apply HSL and enable tint overlay
    fx.setParameter(1, +(camera.getCameraPosition()[2] >= WATERHEIGHT));
    tintOverlay.isVisible = camera.getCameraPosition()[2] < WATERHEIGHT;
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function terrainElevation(x, y) {
    // Model a complex terrain according to mathematical functions

    const baseWave = Math.sin(x) + Math.cos(y);
    const outerElevation = (x**4 + y**4)/18000;
    const rippleWave = Math.cos(Math.abs((x + 10)/4) + Math.abs(y/4)) * 10;
    const dunes = -x*y*Math.E**(-(((x - 3)/10)**2) - ((y - 3)/10)**2) * 5;
    return baseWave + outerElevation + rippleWave + dunes;
}