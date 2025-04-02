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

// Constants
const MAPSIZEX = 6; // Number of tiles in the X axis
const MAPSIZEY = 6; // Number of tiles in the Y axis
const NOWALL = -1; // Just a name for when a side of a tile doesn't have a wall
const TURNSPEED = 0.5; // How fast the camera turns (less is faster)
const MOVESPEED = 0.75; // How fast the camera moves (less is faster)
const NUM_PROPS = 5; // Number of props objects
const NUM_WALL_TEXTURES = 3; // Number of different set of textures

// These variables store object instances that are referenced later.
let camBody; // Body that holds the main camera
let fader; // Fade sprite

// These are names to access IObjectInterfaces
let camera; // Camera3D
let props; // Prop
let walls; // Wall

// Texture-related variables
let propTextures; // Prop textures
let worldTextures; // World textures (floor, wall, ceil)
let worldTexturesID; // Current world textures set ID

// Camera view variables
let camLookX; // Current X position the camera is looking at
let camLookY; // Current Y position the camera is looking at

// World builder and automover variables
let world; // 2D world matrix
let dfsPath = []; // Depth-first search path
let bfsPath = []; // Breadth-first search path
let dfsNode = 0; // Current DFS node
let nextPos; // Next position to be visited

//=============================================================================

/* There are two important concepts to consider in this template:
 *
 * It creates a 2D maze inside a matrix (world) using Depth-First Search, or
 * DFS. Each cell has four sides, and they cannot have walls between them. To
 * model this in 3D, 3DShapes are created and have their sides hidden accordingly.
 *
 * An automated agent navigates through the maze using an algorithm called
 * Breadth-First Search to navigate through waypoints. These waypoints are the
 * sequence of indices initially explored by DFS.
 *
 * Many other algorithms to perform the operations above are available, such as
 * Minimum Spanning Tree (MST) to generate the maze and A* pathfinding to
 * navigate it.
 *
 */

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Instances
    camBody = runtime.objects.CameraBody.getFirstInstance();
    fader = runtime.objects.Fader.getFirstInstance();
    
    // IObjectInterfaces
    camera = runtime.objects.Camera3D;
    props = runtime.objects.Prop;
    walls = runtime.objects.Wall;
    
    // Define prop textures
    propTextures = [
        runtime.objects.TextureProp00,
        runtime.objects.TextureProp01,
        runtime.objects.TextureProp02,
        runtime.objects.TextureProp03,
        runtime.objects.TextureProp04,
    ];
    
    // Define world texture sets
    worldTextures =[
        {
            "floor": runtime.objects.TextureFloor00,
            "wall": runtime.objects.TextureWall00,
            "ceil": runtime.objects.TextureCeil00
        },
        {
            "floor": runtime.objects.TextureFloor01,
            "wall": runtime.objects.TextureWall01,
            "ceil": runtime.objects.TextureCeil01
        },
        {
            "floor": runtime.objects.TextureFloor02,
            "wall": runtime.objects.TextureWall02,
            "ceil": runtime.objects.TextureCeil02
        },
    ];
    
    // Set current world texture ID
    worldTexturesID = 0;
    
    // Fade-In the game
    fadeIn(runtime);
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick());
}

function fadeIn(runtime) {
    // Build the world and Fade the game in
    
    // Delete current props and walls
    for (const p of props.getAllInstances()) p.destroy();
    for (const w of walls.getAllInstances()) w.destroy();
    
    // Set camera body starting position
    camBody.x = 32;
    camBody.y = 32;
    
    // Reset world builder and automover arrays
    world = null;
    dfsPath = [];
    bfsPath = [];
    dfsNode = 0;
    
    // Initialize and build the world
    initializeWorld();
    worldBuildDFS(0, 0);
    
    setInitialcamBodyAngle(); // Player should not not start looking at a wall
    treatDoubleWalls(); // Delete doubled walls to avoid Z-Buffer overlap
    placeBlocks(); // Place the physical blocks
    
    // Change world texture set for the next iteration
    worldTexturesID = (worldTexturesID + 1) % NUM_WALL_TEXTURES;
    
    unexploreWorld(); // Erase DFS exploration so that BFS can do it again    
    placeProps(); // Place the props
    
    // Fade-In and then start moving
    fader.behaviors.Tween.startTween(
        "opacity", 0, 1, "in-out-sine", {"tags": "fadein"}
    );
    for (const t of fader.behaviors.Tween.tweensByTags("fadein"))
            t.finished.then(() => nextMove(runtime) );
}

function initializeWorld() {
    // Initialize the world builder array with neutral values
    
    world = Array(MAPSIZEX); // 1st dimension of the 2D array

    for (let i = 0; i < MAPSIZEX; i++) { 
        world[i] = Array(MAPSIZEY); // 2nd dimension of the 2D array
        
        for (let j = 0; j < MAPSIZEY; j++) {
            // Set items with neutral values
            world[i][j] = {
                visited: false, // Has the tile been visited?
                left: null, // Does it have a neighbor to the left side?
                right: null, // Does it have a neighbor to the right side?
                bottom: null, // Does it have a neighbor to the bottom side?
                top: null, // Does it have a neighbor to the top side?
                BFSparent: null // Which tile is this tile's BFS parent
            };
        }
    }
}

function worldBuildDFS(x, y, lastX, lastY) {
    // Build the world (random maze) using randomized Depth-First Search
    
    dfsPath.push([x, y]); // Push current visited tile to dfsPath array
    
    // Get tiles in the 4-neighborhood and randomly sort them
    const neighbors = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
    ].sort(() => (Math.random() > 0.5) ? 1 : -1);
    
    // Connect current and last visited tiles
    if (x > lastX) {
        world[x][y].left = [lastX, lastY];
        world[lastX][lastY].right = [x, y];
    } else if (x < lastX) {
        world[x][y].right = [lastX, lastY];
        world[lastX][lastY].left = [x, y];
    } else if (y > lastY) {
        world[x][y].top = [lastX, lastY];
        world[lastX][lastY].bottom = [x, y];
    } else if (y < lastY) {
        world[x][y].bottom = [lastX, lastY];
        world[lastX][lastY].top = [x, y];
    }

    world[x][y].visited = true; // Mark current tile as visited

    // Recursively call worldBuildDFS for all valid neighbors
    for (const [i, j] of neighbors) {
        if (i >= 0 && i < MAPSIZEX && j >= 0 &&
            j < MAPSIZEY && !world[i][j].visited) {
            worldBuildDFS(i, j, x, y);
        }
    }
}

function setInitialcamBodyAngle() {
    // Make so that the player never starts looking at a wall
    
    if (dfsPath[1][0] > 0) camBody.angle = 0;
    else camBody.angle = Math.PI/2;
}

function treatDoubleWalls() {
    // Delete walls that overlap to avoid Z-Buffer confusion

    // Eliminate double walls in the x-axis
    for (let x = 0; x < MAPSIZEX - 1; x++)
        for (let y = 0; y < MAPSIZEY; y++)
            if(!world[x][y].right && !world[x+1][y].left)
                world[x+1][y].left = NOWALL; // Mark as NOWALL
                
    // Eliminate double walls in the y-axis
    for (let x = 0; x < MAPSIZEX; x++)
        for (let y = 0; y < MAPSIZEY - 1; y++)
            if (!world[x][y].bottom && !world[x][y+1].top)
                world[x][y+1].top = NOWALL; // Mark as NOWALL
}

function placeBlocks() {
    /* Place the "physical" blocks on the scene. Each block is a 3D cube. The
     * camera moves inside these blocks, therefore, to connect them, sides of
     * the cubes must be removed */
    
    // Create the instances and set the walls visibility
    for (let x = 0; x < MAPSIZEX; x++) {
        for (let y = 0; y < MAPSIZEY; y++) {
            const wall = walls.createInstance("Main", x*32 + 32, y*32 + 32);
            if (world[x][y].left) wall.setFaceVisible("left", false);
            if (world[x][y].right) wall.setFaceVisible("right", false);
            if (world[x][y].top) wall.setFaceVisible("top", false);
            if (world[x][y].bottom) wall.setFaceVisible("bottom", false);
        }
    }

    // Set the textures of the blocks according to the current set ID
    for (const w of walls.getAllInstances()) {
        w.setFaceObject("right", worldTextures[worldTexturesID]["wall"]);
        w.setFaceObject("left", worldTextures[worldTexturesID]["wall"]);
        w.setFaceObject("top", worldTextures[worldTexturesID]["wall"]);
        w.setFaceObject("bottom", worldTextures[worldTexturesID]["wall"]);
        w.setFaceObject("front", worldTextures[worldTexturesID]["ceil"]);
        w.setFaceObject("back", worldTextures[worldTexturesID]["floor"]);
    }
}

function unexploreWorld() {
    // Reset visited and BFS parent information to the default ones
    
    for (let x = 0; x < MAPSIZEX; x++) {
        for (let y = 0; y < MAPSIZEY; y++) {
            world[x][y].visited = false;
            world[x][y].BFSparent = null;
        }
    }
}

function placeProps() {
    // Place props in the world
    
    const maxLen = dfsPath.length - 1; // max valid position to place a prop

    // Randomized valid coordinates to place a prop
    const coords = [...Array(maxLen - 1)]
                   .map((_, i) => dfsPath[i + 1])
                   .sort(() => (Math.random() > 0.5) ? 1 : -1);
    
    // Create the props and set their textures
    for (let i = 0; i < NUM_PROPS; i++) {
        const newProp = props.createInstance(
            "Main", coords[i][0] * 32 + 32, coords[i][1] * 32 + 32
        );
        newProp.setFaceObject("right", propTextures[i]);
    }
    
}

function explorerBFS(x, y, goalX, goalY) {
    // Walk through the world via Breadth-First Search pathfinding
    
    const q = []; // Queue
    world[x][y].visited = true; // Mark root as visited
    q.push([x, y]); // Push root to queue

    // While queue is not empty
    while (q.length) {
        const v = q.shift(); // Dequeue one element

        // If the element is the goal, return it. Continue, otherwise
        if (v[0] == goalX && v[1] == goalY) return v;

        // Get all neighboring tiles
        const neighbors = [
            world[v[0]][v[1]].left,
            world[v[0]][v[1]].right,
            world[v[0]][v[1]].top,
            world[v[0]][v[1]].bottom,
        ];

        // Explore valid neighbors and set their parents as "v"
        for (const n of neighbors) {
            if (n && n != NOWALL && !world[n[0]][n[1]].visited) {
                world[n[0]][n[1]].visited = true;
                world[n[0]][n[1]].BFSparent = [v[0], v[1]];
                q.push(n);
            }
        }
    }
    
    return null;
}

function traceBFSPath(e) {
    // Recursively visit the BFS-explored tiles parents to build a path array
    
    bfsPath.push(e);
    if (e && world[e[0]][e[1]].BFSparent)
        traceBFSPath(world[e[0]][e[1]].BFSparent);
}

function nextMove(runtime) {
    // Make the camera move to the next position
    
    // Try to visit the next position
    try {
        // If the last BFS position has been visited, fetch next from dfsPath
        if (bfsPath.length == 0) {
            unexploreWorld(); // Erase explored path to start new BFS
            
            // Explore the world using current DFS Node (position)
            const result = explorerBFS(
                dfsPath[dfsNode][0], dfsPath[dfsNode][1],
                dfsPath[dfsNode+1][0], dfsPath[dfsNode+1][1],
            );
            
            traceBFSPath(result); // Build BFS path array
            bfsPath.pop(); // Eliminate useless starting position
            nextPos = bfsPath.pop(); // Get next position to be visited
            dfsNode++; // The next time DFS path is fetched, use the next node
        
        // If there are still BFS nodes (positions) to visit, visit them
        } else {
            nextPos = bfsPath.pop(); // Get next position to be visited
        }
        
        const cbtween = camBody.behaviors.Tween // shorthand
        
        // Move the camera body to the next position
        cbtween.startTween(
            "position",
            [nextPos[0] * 32 + 32, nextPos[1] * 32 + 32],
            MOVESPEED,
            "linear",
            {"tags": "movement"}
        );
    
        // Rotate the camera to look at the direction of the body's movement
        if (camBody.x < nextPos[0] * 32 + 32)
            cbtween.startTween("angle", 0, TURNSPEED, "in-out-sine");
        if (camBody.x > nextPos[0] * 32 + 32)
            cbtween.startTween("angle", Math.PI, TURNSPEED, "in-out-sine");
        if (camBody.y < nextPos[1] * 32 + 32)
            cbtween.startTween("angle", Math.PI/2, TURNSPEED, "in-out-sine");
        if (camBody.y > nextPos[1] * 32 + 32)
            cbtween.startTween("angle", 3*Math.PI/2, TURNSPEED, "in-out-sine");

        // When the movement tween has ended, recursively go to next position
        for (const t of cbtween.tweensByTags("movement"))
            t.finished.then(() => nextMove(runtime));

    // If it does not exist, end current iteration
    } catch (_) {
        const ftween = fader.behaviors.Tween // shorthand
        
        // Fade-Out screen and then Fade it back in with rebuilt world
        ftween.startTween("opacity", 1, 1, "in-out-sine", {"tags": "fadeout"});
        for (const t of ftween.tweensByTags("fadeout"))
            t.finished.then(() => fadeIn(runtime));    
    }
}
    

function onTick() {
    // Code to run every tick
    setCamera3D();
    updateProps();
}

function setCamera3D() {
    // Set camera position and rotation
    
    // Place the camera where camBody is and define a height for it
    const camX = camBody.x + Math.cos(camBody.angle);
    const camY = camBody.y + Math.sin(camBody.angle);
    const camZ = 12;
    
    // The camera should look to a point in front of the camBody, at all times
    camLookX = camBody.x + Math.cos(camBody.angle) * 128;
    camLookY = camBody.y + Math.sin(camBody.angle) * 128;

    // Apply the camera settings
    camera.lookAtPosition(
        camX, camY, camZ, camLookX, camLookY, camZ, 0, 0, 1
    );
}


function updateProps() {
    // Update props angle and opacity
    
    // Get all props instances
    for (const p of props.getAllInstances()) {
        // Make the prop look at the camera at all times
        p.angle = (Math.atan2(camBody.y-p.y, camBody.x-p.x));
        
        if (p.opacity > 0.1) {
            /* Set the opacity as a ratio of the Euclidean distance between it
             * and the camera body */
            p.opacity = Math.min(
                Math.sqrt(
                    Math.pow(p.x - camBody.x, 2) + Math.pow(p.y-camBody.y, 2)
                )/20, 1
            );
        } else {
            // Make the prop go away forever if the camera gets too close
            p.opacity = 0.0;
        }
    }
}