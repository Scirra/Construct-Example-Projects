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
let player;
let playerSprite;
let playerAnim;
let camPos;
let terrain;
let cursor;
let textTutorial;
let textClicks; 
let textFinish;

// List of instances
let poles;
let trees;

// Global objects
let camera;
let mouse;
let keyboard;

// Camera view variables
let camLookX;
let camLookY;
let camLookZ;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Gameplay variables
let activeGroup; // Current group of flags
let polesCaught; // Number of poles caught
let firstClick; // Check for first click (first pointer lock)
let clicks; // Number of valid clicks (player placements)
let cameraFocus; // Is the camera focusing on the character?
let rateOfChange; // How far did the character move?

// Settings
const MOUSESENSITIVITY = 0.5; // Mouse sensitivity
const MESHRESX = 80; // Mesh X resolution (number of x divisions)
const MESHRESY = 80; // Mesh Y resolution (number of y divisions)
const TERRAINHEIGHT = 300; // Starting terrain height
const MINPOLEDIST = 224; // Minimum distance from poles considered valid
const LIMITS = {
    minX : 40, minY : 40, maxX : 1240, maxY : 1240
}; // World's minimum and maximum coordinates

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
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseDown(e, runtime));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
    // Cpde to run before the layout starts

    // Get instances
    player = runtime.objects.Player.getFirstInstance();
    playerSprite = runtime.objects.PlayerSprite.getFirstInstance();
    playerAnim = runtime.objects.PlayerAnimation.getFirstInstance();
    camPos = runtime.objects.CameraPosition.getFirstInstance();
    terrain = runtime.objects.Terrain.getFirstInstance();
    cursor = runtime.objects.Cursor.getFirstInstance();
    textTutorial = runtime.objects.TextTutorial.getFirstInstance();
    textClicks = runtime.objects.TextClicks.getFirstInstance();
    textFinish = runtime.objects.TextFinish.getFirstInstance();
    
    // Get list of instances
    poles = runtime.objects.Pole.getAllInstances();
    trees = runtime.objects.Tree.getAllInstances();
    
    // Get global objects
    camera = runtime.objects.Camera3D;
    mouse = runtime.mouse;
    keyboard = runtime.keyboard;
    
    // Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
    
    // this variable checks if the player has clicked at least once
    firstClick = true;
    
    // Configure initial parameters for the game
    setupGame(runtime);
}

function setupGame(runtime) {
    // Configure initial parameters for the game
    
    // Set gameplay variables
    activeGroup = 0;
    polesCaught = 0;
    clicks = 0;
    cameraFocus = false;
    rateOfChange = 0;
    
    // Set camPos elevation
    player.zElevation = TERRAINHEIGHT;
   
    // Set starting look position
    camera.lookAtPosition(
        camPos.x, camPos.y, camPos.zElevation,
        player.x, player.y, player.zElevation,
        0, 0, 1
    );
     setCamera(runtime);
  
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
    
    // Set poles elevation
    for (const p of poles) {
        const [meshX2, meshY2] = absolute2mesh(p.x, p.y);
        p.zElevation = TERRAINHEIGHT + terrainElevation(meshX2, meshY2) - 18;
    }
    
    // Set trees elevation
    for (const t of trees) {
        const [meshX2, meshY2] = absolute2mesh(t.x, t.y);
        t.zElevation = TERRAINHEIGHT + terrainElevation(meshX2, meshY2) - 8;
    }
}

function onMouseDown(_, runtime) {
    // Process mouse down
    
    // Request mouse lock
    if (document.pointerLockElement !== mouseLocker) {
        mouseLocker.requestPointerLock();
    }
    
    // Is it the first click? If so, hide tutorial and enable group 0
    if (firstClick) {
        textTutorial.behaviors.Tween.startTween(
            "opacity", 0, 0.25, "linear"
        );
        textClicks.behaviors.Tween.startTween(
            "opacity", 1, 0.25, "linear"
        );
        enablePoles(0); // Enable poles from group 0
    
    /* Otherwise, if the cursor is in a valid position and the game is not
     * over (group 4), place the player and focus the camera
     */
    } else if (cursor.colorRgb[0] == 0 && activeGroup < 4) {
        cameraFocus = true;
        rateOfChange = 1;
        playerSprite.isVisible = true;
        player.x = cursor.x;
        player.y = cursor.y;
        clicks++;
        textClicks.text = "Clicks: " + clicks;
    
    // If TextFinish is visible, reset everything.
    } else if (textFinish.opacity > 0.9) {
    
        // Resetup the game and enable group 0 of poles
        setupGame(runtime);
        enablePoles(0);
        
        // Hide TextFinish and show TextClicks with default text
        textFinish.behaviors.Tween.startTween(
            "opacity", 0, 0.25, "linear"
        );
        textClicks.text = "Clicks: 0";
        textClicks.behaviors.Tween.startTween(
            "opacity", 1, 0.25, "linear"
        );
        
        // The poles should be available to grab again
        for (const p of poles) {
            p.instVars.caught = false;
        }
    }
    
    // At least one click has been performed
    firstClick = false;
}

function onMouseMove(e) {
    // Move the cursor
    
    // Ignore cursor movement while the mouse is not locked
    if (document.pointerLockElement !== mouseLocker) {
        return;
    }
    
    // Move the cursor according to mouse movement
    cursor.x = Math.max(
        Math.min(
            cursor.x - e.movementX * MOUSESENSITIVITY, LIMITS.maxX
        ), LIMITS.minX
    );
    cursor.y = Math.max(
        Math.min(
            cursor.y - e.movementY * MOUSESENSITIVITY, LIMITS.maxY
        ), LIMITS.minY
    );
    
    // Set cursor elevation
    const [meshX, meshY] = absolute2mesh(cursor.x, cursor.y);
    cursor.zElevation = TERRAINHEIGHT + terrainElevation(meshX, meshY) - 24;
    
    /* The player cannot spawn too close to poles. To indicate this, the cursor
     * turns red within a range of active poles. It turns back to green once
     * a valid position is recognized
     */
    cursor.colorRgb = [0, 1, 0];
    for (const p of poles) {
        if(p.isVisible && dist2D(cursor.x, cursor.y, p.x, p.y) < MINPOLEDIST) {
            cursor.colorRgb = [1, 0, 0];
        }
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    playerMovement(runtime);
    playerCatchPole();
    checkFinish();
    setCamera(runtime);
}

function playerMovement(runtime) {
    
    // Gradient descent
    const [meshX, meshY] = absolute2mesh(player.x, player.y);
    const [nudgeX, nudgeY] = gradientTerrainElevation(meshX, meshY);

    player.x += nudgeX * 60 * runtime.dt;
    player.y += nudgeY * 60 * runtime.dt;
    
    rateOfChange = (nudgeX**2 + nudgeY**2)**(1/2);
    
    // Set player animation based on current angle of movement
    const angle = Math.atan2(nudgeY, nudgeX); // Current angle
    const incr = Math.PI/4; // Angle increment
    const anim = (((Math.round(angle/incr) * incr)/incr + 4) % 8).toString();
    playerAnim.setAnimation(anim);
    
    // Limit player position
    player.x = Math.max(Math.min(player.x, LIMITS.maxX), LIMITS.minX);
    player.y = Math.max(Math.min(player.y, LIMITS.maxY), LIMITS.minY);
    
    // Elevation
    const [meshX2, meshY2] = absolute2mesh(player.x, player.y);
    player.zElevation = TERRAINHEIGHT + terrainElevation(meshX2, meshY2) + 18;
}

function playerCatchPole() {
    // When the player collides with a pole, they catch it
    
    for (const p of poles) {
        if (p.isVisible && !p.instVars.caught && player.testOverlap(p)) {
        
            // Set pole as caught and remove it from the player's vision
            p.instVars.caught = true;
            p.behaviors.Tween.startTween(
                "z-elevation", p.zElevation - 256, 0.5, "linear"
            );
            setTimeout(() => p.isVisible = false, 500);
            polesCaught++; // Increment poles caught counter
            
            // Caught all the poles, so change active group and reset player
            if (polesCaught == 3) {
                setTimeout(() => {
                    cameraFocus = false;
                    polesCaught = 0;
                    activeGroup++;
                    player.x = terrain.width/2;
                    player.y = terrain.height/2;
                    enablePoles(activeGroup);
                    playerSprite.isVisible = false;
                }, 500)
            }
        }
    }
}

function setCamera(runtime) {
    // Set the camera position and looking angles
    
    // If the player stopped moving, unfocus the camera
    if (rateOfChange < 0.1) cameraFocus = false;
    
    // Make camera focus the player (focused)
    if (cameraFocus) {
        const posx = lerp(
            camera.getCameraPosition()[0], player.x,
            0.1 * 60 * runtime.dt
        );
        const posy = lerp(
            camera.getCameraPosition()[1], player.y - 320,
            0.1 * 60 * runtime.dt
        );
        const posz = lerp(
            camera.getCameraPosition()[2],camPos.zElevation * 0.65,
            0.1 * 60 * runtime.dt
        )
        camera.lookAtPosition(
            posx, posy, posz,
            //player.x, player.y, player.zElevation,
            player.x, player.y, TERRAINHEIGHT,
            0, 0, 1
        );
        
    // Make camera look at the cursor (unfocused)
    } else {
        // Make camera movement less aggressive
        const lookAtX = terrain.width/2 + (cursor.x - terrain.width/2)/3;
        const lookAtY = terrain.height/2 + (cursor.y - terrain.height/2)/3;
        
        // Make camera static at its default position
        const posx = lerp(
            camera.getCameraPosition()[0], camPos.x,
            0.1 * 60 * runtime.dt
        );
        const posy = lerp(
            camera.getCameraPosition()[1], camPos.y,
            0.1 * 60 * runtime.dt
        );
        const posz = lerp(
            camera.getCameraPosition()[2],camPos.zElevation,
            0.1 * 60 * runtime.dt
        )

        camera.lookAtPosition(
            posx, posy, posz,
            //player.x, player.y, player.zElevation,
            lookAtX, lookAtY, TERRAINHEIGHT,
            0, 0, 1
        );
    }
}

function checkFinish() {
    // Check if the game is over

    // activeGroup == 4 means that all groups have been fully collected
    if (activeGroup == 4) {
        // Hide textClicks
        textClicks.behaviors.Tween.startTween(
            "opacity", 0, 0.25, "linear"
        );
        
        // Show textFinish with the number of valid clicks performed
        textFinish.text = "Level completed using " + clicks +
        " clicks!\n\nClick to restart..."
        textFinish.behaviors.Tween.startTween(
            "opacity", 1, 0.25, "linear"
        );
    }
}

function enablePoles(group) {
    // Enable poles from the informed group

    for (const p of poles) {
        if (p.instVars.group == group) {
            p.isVisible = true;
            p.zElevation += 1000;
            p.behaviors.Tween.startTween(
                "z-elevation", p.zElevation - 1000, 0.5, "out-sine"
            );
        } 
        p.isVisible = p.instVars.group == group;
    }
}

function terrainElevation(x, y) {
    // Model a complex terrain according to mathematical functions
    
    const outerElevation = (x**4 + y**4)/18000;
    const mountains = -x*y*Math.E**(-(((x+5)/15)**2) - ((y+5)/18)**2) * 3;
    const mountains2 = x*y*Math.E**(-(((x-5)/11)**2) - ((y-5)/15)**2) * 3;
    const wave = (Math.sin(x/2) + Math.cos(y/2)) * 6;
 
    return outerElevation + mountains + mountains2 + wave;
}

function gradientTerrainElevation(x, y) {
    /* To make the player slide to the nearest lowest point, a technique called
     * Gradient Descent is applied.
     *
     * The gradient of a function f for a given point (x, y) returns the
     * direction to move from (x, y) in order to find higher values for f. By
     * taking the negative gradient, it is possible to move in the direction
     * of lower values for f.
     *
     * In our case, the function f (terrainElevation) returns the height of the
     * terrain at any give coordinate. By applying the negative gradient
     * iteratively (Gradient Descent), the player will move to the NEAREST
     * lowest point relative to the starting location. It's important
     * to note that this technique is a local optimization method, meaning it
     * finds the nearest minimum within its immediate vicinity.
     *
     * The gradient of a 2D function can be defined by:
     * ∇f(x, y) = [(∂f/∂x)(x, y), (∂f/∂y)(x, y)],
     * where ∂/∂x is the partial derivative with respect to x and
     * ∂/∂y is the partial derivative with respect to y.
     *
     * The Gradient Descent would be the iterative application of -∇f to the
     * player coordinates. Below are the definitions for (∂f/∂x)(x, y) and
     * (∂f/∂y)(x, y) in the context of terrainElevation, except for the wave
     * function, since including it leads to the increase of local minima and
     * a substantially less smooth movement.
     *
     * Finally, the magnitude of the resulting vector represents how steep
     * the slope is and causes the player to move faster or slower.
     *
     * For a more in-depth explanation, refer to the following pages:
     * https://mathworld.wolfram.com/PartialDerivative.html
     * https://mathworld.wolfram.com/Gradient.html
     * https://mathworld.wolfram.com/Minimum.html
     * https://mathworld.wolfram.com/MethodofSteepestDescent.html
     */

    const dx = x**3/4500 + 3 * Math.E**(-((-5 + x)**2)/121 - (-5 + y)**2/225)
               * y - 3 * Math.E**(-((5 + x)**2)/225 - (5 + y)**2/324) * y -
               (6 * Math.E**(-((-5 + x)**2)/121 - (-5 + y)**2/225) * (-5 + x)
               * x * y)/121 + (2 * Math.E**(-((5 + x)**2)/225 - (5 + y)**2/324)
               * x * (5 + x) * y)/75;
               
    const dy = y**3/4500 + (Math.E**(-((-5 + x)**2)/121 - (-5 + y)**2/225) * x
               * (225 + 10 * y - 2 * y**2))/75 + (Math.E**(-((5 + x)**2)/225 -
               (5 + y)**2/324) * x * (-162 + 5 * y + y**2))/54;
    
    return [-dx, -dy];
}

function absolute2mesh(x, y) {
    // Helper function to convert absolute (x, y) to mesh (x, y) coordinates
    
    return [
        x/(terrain.width/MESHRESX) - MESHRESX/2,
        y/(terrain.height/MESHRESY) - MESHRESY/2
    ];
}

function dist2D(x1, y1, x2, y2) {
    // Helper function to calculate de 2D Euclidean distance between 2 points
    
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}