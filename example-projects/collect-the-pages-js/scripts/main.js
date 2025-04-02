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
let playerFOV;
let containerFloor;
let monster;
let uiTextPages;
let uiScreenNoise;
let uiTextTutorial;
let uiTextSuccess;
let uiFader;

// List of objects
let treeTrunks;
let notes;
let bushes;

// List of textures
let textures;

// Global objects
let camera;
let mouse;
let keyboard;

// Special objects
let mouseLocker; // Canvas to request mouse lock

// Settings
const MOUSESENSITIVITY = 0.0025; // Mouse sensitivity
const WALKSPEED = 100; // Player waking speed
const NUMPAGES = 8; // Number of pages
const NUMBUSHES = 500; // Number of bushes
const TELECD = 10; // How often the monster teleports
const KILLDIST = 64; // How far the monster can kill the player

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
    runtime.addEventListener("mousedown", e => onMouseDown(e));
    runtime.addEventListener("mousemove", e => onMouseMove(e));
	
	// Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e, runtime));
	
	// Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

async function onBeforeLayoutStart(runtime)
{
    // Code to run just before 'On start of layout'
    
    // Get instances
    player = runtime.objects.Player.getFirstInstance();
	playerFOV = runtime.objects.PlayerFOV.getFirstInstance();
	containerFloor = runtime.objects.ContainerFloorCeil.getFirstInstance();
	monster = runtime.objects.Monster.getFirstInstance();
	uiTextPages = runtime.objects.UITextPages.getFirstInstance();
	uiScreenNoise = runtime.objects.UIScreenNoise.getFirstInstance();
	uiTextTutorial = runtime.objects.UITextTutorial.getFirstInstance();
	uiTextSuccess = runtime.objects.UITextSuccess.getFirstInstance();
	uiFader = runtime.objects.UIFader.getFirstInstance();
	
	// Get list of instances
	treeTrunks = runtime.objects.TreeTrunk.getAllInstances();
	
	// Get list of textures
	textures = [
		runtime.objects.BushTexture0,
		runtime.objects.BushTexture1,
		runtime.objects.BushTexture2,
	];
	
	// Get global objects
    camera = runtime.objects.Camera3D;
    mouse = runtime.mouse;
    keyboard = runtime.keyboard;
	
	// Configure initial parameters for the game
    setupGame(runtime);
	
	// Remove mouse cursor
    runtime.mouse.setCursorStyle("None");
    
    // Create a canvas to request mouse lock
    mouseLocker = document.createElement("canvas");
    document.body.appendChild(mouseLocker);
}

function setupGame(runtime) {
	// Starting camera's spherical coordinates
    camLookTheta = 0;
    camLookPhi = Math.PI/2;
	
	// Spherical coordinates  converted to cartesian coordinates
    setCameraCartesian(camLookTheta, camLookPhi);
	
	// Set starting look position
    camera.lookAtPosition(
        player.x, player.y, player.zElevation + player.zHeight - 2,
        camLookX, camLookY, camLookZ, 0, 0, 1
    );
	
	// Select random trees to have notes spawned on
	const selectedTrees = [...Array(treeTrunks.length).keys()]
	const rndTrees = selectedTrees.sort(
		() => Math.random() - 0.5
	).slice(0, NUMPAGES);
	notes = [];
	
	for (const t of rndTrees) {
		const pos = Math.random(); // Random face for the note to spawn
		let note;
		
		// Note spawns on "Bottom" face of the tree
		if (pos < 0.25) {
			note = runtime.objects.Note.createInstance(
				"World", treeTrunks[t].x, treeTrunks[t].y + 16
			);
			note.angle = 0;
		
		// Note spawns on "Top" face of the tree
		} else if (pos < 0.50) {
			note = runtime.objects.Note.createInstance(
				"World", treeTrunks[t].x, treeTrunks[t].y - 16
			);
			note.angle = Math.PI;
		
		// Note spawns on "Left" face of the tree
		} else if (pos < 0.75) {
			note = runtime.objects.Note.createInstance(
				"World", treeTrunks[t].x - 16, treeTrunks[t].y
			);
			note.angle = Math.PI/2;
		
		// Note spawns on "Right" face of the tree
		} else {
			note = runtime.objects.Note.createInstance(
				"World", treeTrunks[t].x + 16, treeTrunks[t].y
			);
			note.angle = 3*Math.PI/2;
		}
		
		// Add note to array
		notes.push(note);
	}
	
	// Create bushes
	bushes = [];
	for (let i = 0; i < NUMBUSHES; i++) {
		const bush = runtime.objects.Bush.createInstance(
			"World", Math.random() * 2400 - 400, Math.random() * 2400 - 400
		);
		
		// Bushes won't spawn inside container
		if (bush.testOverlap(containerFloor)) {
			bush.destroy();
			continue;
		}
		
		// Set animation and add to array
		bush.setFaceObject("right", textures[Math.floor(Math.random() * 3)]);
		bushes.push(bush);
	}
}

function onMouseDown(_) {
	// Process mouse down5
	
	//player.instVars.pagesGot = 7;

    // If mouse is not locket yet, lock it
    if (document.pointerLockElement !== mouseLocker) {
        mouseLocker.requestPointerLock();
    }
	
	// Hide help and fade the screen in
	if (uiTextTutorial.opacity == 1) {
		uiTextTutorial.behaviors.Tween.startTween(
			"opacity", 0, 1, "in-out-sine"
		);
		uiFader.behaviors.Tween.startTween(
			"opacity", 0, 1, "in-out-sine"
		);
	}
}

function onMouseMove(e) {
    // Process mouse movement
	
	// If the player is dead or reading the tutorial, do not move the camera
	if (player.instVars.dead || uiTextTutorial.opacity == 1)
		return;
    
    // Set camera's spherical coordinates according to mouse movement
    camLookTheta += e.movementX * MOUSESENSITIVITY;
    camLookPhi = Math.max(
        Math.min(
            camLookPhi - e.movementY * MOUSESENSITIVITY, Math.PI - 0.1
        ), 0.1
    );
}

function onKeyDown(e, runtime) {
    // Check if a key has been pressed
	
	// If the player is dead or reading the tutorial, do not pick notes up
	if (player.instVars.dead || uiTextTutorial.opacity == 1) {
		return;
	}
	
	// Pick up a note with [Space] or [E]
    if (e.key == " " || e.key == "e" || e.key == "E") {
		for (const n of notes) {
			if (distanceBetween(player.x, player.y, n.x, n.y) < 32) {
			
				// Activate the monster, if not already active.
				if (!monster.instVars.isActive) {
					monster.instVars.isActive = true;
					monster.isVisible = true;
					
					// Start teleporting around the map
					monster.behaviors.Timer.startTimer(
						TELECD, "teleport", "regular"
					);
					monster.behaviors.Timer.addEventListener(
						"timer", _ => monsterTeleport()
					);
				}
				
				// Player got a page
				player.instVars.pagesGot++;
				
				// Destroy the note and remove it from notes array
				n.destroy();
				notes.splice(notes.indexOf(n), 1);
				
				// Show UI Text with amount of pages collected
				uiTextPages.text = player.instVars.pagesGot +
				                   "/" + NUMPAGES + " pages collected"
				uiTextPages.behaviors.Tween.startTween(
					"opacity", 1, 1, "in-out-sine", {pingPong : true}
				);
				
				// If the all the notes have been picked up, beat the game
				if (player.instVars.pagesGot == NUMPAGES) {
				
					// Destroy the monster
					monsterDie();
					
					// Show success text and fade the screen out
					uiTextSuccess.behaviors.Tween.startTween(
						"opacity", 1, 1, "in-out-sine"
					);
					uiFader.behaviors.Tween.startTween(
						"opacity", 1, 1, "in-out-sine"
					);
					
					// Reset the layout after a timeout
					setTimeout(() => runtime.goToLayout("Game"), 5000);
				}
			}
		}
	}
}

function onTick(runtime) {
    // Code to run every tick
    
    setCamera3D(runtime);
	getKeyboardInputs();
	rotateBillboards();
	monsterAI(runtime);
}

function getKeyboardInputs() {
    // Get player's inputs
	
	// If the player is dead or reading the tutorial, do not move
	if (player.instVars.dead || uiTextTutorial.opacity == 1)
		return;
    
    // Shorthand for player's 8 Direction behavior
    const eightd = player.behaviors.EightDirection;

    // Directional inputs
    const inputRight = keyboard.isKeyDown("KeyD");
    const inputLeft = keyboard.isKeyDown("KeyA");
    const inputUp = keyboard.isKeyDown("KeyW");
    const inputDown = keyboard.isKeyDown("KeyS");
    
    // Compute axes
    const horizontalAxis = inputRight - inputLeft;
    const verticalAxis = inputUp - inputDown;
    
    // Move the player's object and increase bobbing if an axis is active
    if (horizontalAxis != 0 || verticalAxis != 0) {
        // Get the angle to move
        const axisAngle = Math.atan2(horizontalAxis, verticalAxis);
        
        // Set 8Direction movement vector
        eightd.setVector(
            Math.cos(camLookTheta + axisAngle) * eightd.maxSpeed,
            Math.sin(camLookTheta + axisAngle) * eightd.maxSpeed,
        )
    // Otherwise make the player stationary and view bobbing slow
    } else {
        eightd.setVector(0, 0);
    }
}

function setCamera3D(runtime) {
    // Set camera position and rotation
    
    const camX = player.x; // Camera X
    const camY = player.y; // Camera Y
    const camZ = lerp(
        camera.getCameraPosition()[2],
        player.zElevation + player.zHeight - 2,
        0.2 * 60 * runtime.dt
    ); // Camera Z (lerp is for smooth crouching/standing)

    // Spherical coordinates converted to cartesian coordinates
    setCameraCartesian(camLookTheta, camLookPhi);
    
    // Apply camera settings
    camera.lookAtPosition(
        camX, camY, camZ,
        camX + camLookX,camY + camLookY, camZ + camLookZ,
        0, 0, 1
    );
	
	// Rotate FOV object
	playerFOV.angle = camLookTheta;
}

function rotateBillboards() {
	// Rotate billboard objects in the direction of the player
	
	// Monster
	monster.angle = (Math.atan2(player.y-monster.y, player.x-monster.x));
	
	// Bushes
	for (const b of bushes)
		b.angle = (Math.atan2(player.y-b.y, player.x-b.x));
}

function monsterAI(runtime) {
	// Make the monster move, teleport and kill the player

	// If the tutorial is up or the monster is inactive, do nothing
	if (uiTextTutorial.opacity == 1 || !monster.instVars.isActive)
		return;

	const nspeed = Math.max(0.00125 * player.instVars.pagesGot, 0.00125);
	
	// Player can see the monster
	if (monster.testOverlap(playerFOV)) {
		// Increase screen noise
		uiScreenNoise.opacity += nspeed * 60 * runtime.dt;
		uiScreenNoise.opacity = Math.min(uiScreenNoise.opacity, 1);
	
	// Player cannot see the monster
	} else {
		// Reduce screen noise
		uiScreenNoise.opacity -= 0.01 * 60 * runtime.dt;
		uiScreenNoise.opacity = Math.max(uiScreenNoise.opacity, 0);
		
		// Monster walks to the player
		if (distanceBetween(
			player.x, player.y, monster.x, monster.y
		) > KILLDIST) {
			const mspeed = 1 + (player.instVars.pagesGot/NUMPAGES);
			monster.x += Math.cos(monster.angle) * mspeed * 60 * runtime.dt;
			monster.y += Math.sin(monster.angle) * mspeed * 60 * runtime.dt;
		}
	}

	// Monster kills the player if too close
	if (distanceBetween(
		player.x, player.y, monster.x, monster.y
	) <= KILLDIST) {
	
		// Reset the layout after a timeout
		if (!player.instVars.dead) {
			setTimeout(() => runtime.goToLayout("Game"), 2000);
			// Fade the screen out
			uiFader.behaviors.Tween.startTween(
				"opacity", 1, 2, "in-out-sine"
			);
		}
		
		// Mark player as dead
		player.instVars.dead = true;
	
		// Look at the monster
		camLookTheta = Math.atan2(monster.y-player.y, monster.x-player.x);
		camLookPhi = Math.PI/1.5;
		
		// Set screen noise at max
		uiScreenNoise.opacity = 1;
		
		// Monster stops teleporting
		monster.behaviors.Timer.stopAllTimers();
	}
	
	// Monster kills the player if static reaches max level
	if (uiScreenNoise.opacity > 0.8 && !player.instVars.dead) {
		monster.x = player.x + Math.cos(camLookTheta) * KILLDIST;
		monster.y = player.y + Math.sin(camLookTheta) * KILLDIST;
	}
}

function monsterTeleport() {
	// Teleport monster in front of the player, in the distance
	
	// Stops teleporting if the player is dead
	if (player.instVars.dead)
		return;
	
	// Monster teleports if player is not looking at it
	if (!monster.testOverlap(playerFOV)) {
		monster.x = player.x + Math.cos(camLookTheta) * 320;
		monster.y = player.y + Math.sin(camLookTheta) * 320;
	}
}

function monsterDie() {
	// Monster dies
	
	monster.instVars.isActive = false;
	monster.isVisible = false;
}

function setCameraCartesian(theta, phi) {
    // Convert spherical to cartesian and set camLooks
    
    camLookX = Math.cos(theta) * Math.sin(phi);
    camLookY = Math.sin(theta) * Math.sin(phi);
    camLookZ = -Math.cos(phi);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}

function distanceBetween(x1, y1, x2, y2) {
    // Calculate 2D distance between two coordinates

    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}