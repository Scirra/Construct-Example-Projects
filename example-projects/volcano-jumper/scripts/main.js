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

// These variables store object instances that are referenced later.
let player;
let playerSpr; // Player Sprite
let playerSdw; // Player Shadow
let playerAnim; // Player Animation
let flames;
let textureFlames;
let cameraPosition;
let centerPosition;
let textureWall;
let platformTimer;
let textScore;

// List of instances
let pspwn; // PlatformSpawner list

// IObjectInterfaces
let platform;
let playerInterface;
let playerSprInterface;
let playerSdwInterface;

// Global objects
let camera;
let keyboard;

// Gameplay variables
let lastPlatformN; // Last platform position N to be used
let sndLastPlatformN; // Second last platform position N to be used
let ascentSpeed; // How fast the game is moving
let platformsSpawned; // How many platforms have spawned (score)
let playerDead; // Player is dead

// Settings
const GRAVITY = 9; // Gravity constant
const STARTINGSPEED = 0.25; // Starting game speed
const SPEEDINCREMENT = 0.025; // Speed increment
const SPEEDLIMIT = 1.15; // Maximum speed
const PLAYERJUMPSTRENGTH = 6; // Player jump strength
const PLAYERSPRITEWIDTH = 32; // Width of player sprite
const PLATSIZE = 64; // Final size of the platform
const RESETTIME = 3; // How long it takes to reset after a death

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
	// Code to run just before 'On start of layout'
	
	// Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e));
	
	// Things that happen before the layout starts
	runtime.layout.addEventListener(
		"beforelayoutstart", () => onBeforeLayoutStart(runtime)
	);
	
	// Start ticking
	runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
	// Get instances
	playerAnim = runtime.objects.PlayerAnimation.getFirstInstance();
	flames = runtime.objects.Flames.getFirstInstance();
	textureFlames = runtime.objects.TextureFlames.getFirstInstance();
	cameraPosition = runtime.objects.CameraPosition.getFirstInstance();
	centerPosition = runtime.objects.CenterPosition.getFirstInstance();
	textureWall = runtime.objects.TextureWall.getFirstInstance();
	platformTimer = runtime.objects.PlatformTimer.getFirstInstance();
	textScore = runtime.objects.TextScore.getFirstInstance();
	
	// Get list of instances
	pspwn = runtime.objects.PlatformSpawner.getAllInstances();
	
	// IObjectInterfaces
	platform = runtime.objects.Platform;
	playerInterface = runtime.objects.Player;
	playerSprInterface = runtime.objects.PlayerSprite;
	playerSdwInterface = runtime.objects.PlayerShadow;
	
	// Get global objects
	keyboard = runtime.keyboard;
	camera = runtime.objects.Camera3D;
	
	setupGame();
}

function setupGame() {

	// Initial camera position
	camera.lookAtPosition(
		cameraPosition.x, cameraPosition.y, cameraPosition.zElevation,
		centerPosition.x, centerPosition.y, centerPosition.zElevation,
		0, 0, 1
	);
	
	// Platform spawn variables
	lastPlatformN = 0;
	sndLastPlatformN = 0;
	
	// Game speed
	ascentSpeed = STARTINGSPEED;
	
	// Platforms spawned (score)
	platformsSpawned = 0;
	
	// Player starts alive
	playerDead = false;
	
	// Start the platform creation
	createFirstPlatform();
}

function onKeyDown(e) {
    // Check if a key has been pressed
    
    // [Space] jumps
    if (e.key == " " && player.instVars.grounded) {
		player.instVars.zSpeed += PLAYERJUMPSTRENGTH;
    }
}

function createFirstPlatform() {
	// Create the first platform
	
	const n = 4;
	
	// Set last used position to n
	sndLastPlatformN = lastPlatformN;
	lastPlatformN = n;

	// Create and position the platform
	const p = platform.createInstance(1, pspwn[n].x, pspwn[n].y);
	p.zElevation = pspwn[n].zElevation;
	p.width = PLATSIZE;
	p.height = PLATSIZE;
	
	// Position player on top of the platform
	player = playerInterface.createInstance(1, p.x, p.y);
	player.zElevation = p.zElevation + player.zHeight/2 - p.zHeight;
	
	// Create player sprite and set it as a child of player
	playerSpr = playerSprInterface.createInstance(1, p.x, p.y);
	playerSpr.zElevation = p.zElevation + playerSpr.zHeight/2 - p.zHeight;
	player.addChild(
		playerSpr,
		{transformX: true, transformY: true, transformZElevation: true}
	);

	// Create player shadow and set it as a child of player
	playerSdw = playerSdwInterface.createInstance(1, p.x, p.y);
	playerSdw.zElevation = p.zElevation + playerSdw.zHeight/2 - p.zHeight;
	player.addChild(playerSdw, {transformX: true, transformY: true});
	
	// Setup platform spawn timer
	platformTimer.behaviors.Timer.startTimer(
		1.5/ascentSpeed, "spawnPlatform", "once"
	);
	platformTimer.behaviors.Timer.addEventListener(
		"timer", () => createPlatform()
	);
}

function createPlatform() {
	// Create a platform at a randomly selected location
	
	// If score is not yet visible, show it
	if (textScore.opacity == 0) {
		textScore.behaviors.Tween.startTween(
			"opacity", 1, 1, "in-out-sine"
		);
	}

	// Choose a position for the new platform
	let n = Math.floor(Math.random() * 9);
	
	// Avoid repeating same platform position
	if (n == lastPlatformN) {
		n = (n + 1) % 9;
		if (n == sndLastPlatformN) {
			n = (n + 1) % 9;
		}
	} else if (n == sndLastPlatformN) {
		n = (n + 1) % 9;
		if (n == lastPlatformN) {
			n = (n + 1) % 9;
		}
	}
	
	// Set last used position to n
	sndLastPlatformN = lastPlatformN;
	lastPlatformN = n;
	
	// Increment platforms spawned counter (score)
	platformsSpawned++;
	
	// Update score text
	textScore.text = "Score: " + platformsSpawned;
	
	// Create and position the platform
	const p = platform.createInstance(1, pspwn[n].x, pspwn[n].y);
	p.zElevation = pspwn[n].zElevation;
	
	// If the platform spawns in front of the camera, make it transparent
	if (p.y > 144 && p.x == 144) {
		p.opacity = 0.5;
	}
	
	// Spawn animation
	p.behaviors.Tween.startTween(
		"size", [PLATSIZE, PLATSIZE], 0.5, "out-back"
	);
	
	// Increase ascent speed
	ascentSpeed = Math.min(ascentSpeed + SPEEDINCREMENT, SPEEDLIMIT);
	
	// Platform spawn timer
	platformTimer.behaviors.Timer.startTimer(
		1.5/ascentSpeed, "spawnPlatform", "once"
	);
}

function onTick(runtime) {
	// Code to run every tick
	
	ascendStuff(runtime);
	playerCollision(runtime);
	setPlayerAnimation();
	checkPlayerDeath(runtime);
	setCamera();
}

function ascendStuff(runtime) {
	// Move texture and blocks up
	
	textureWall.imageOffsetY += ascentSpeed * 60 * runtime.dt;
	
	for (const p of platform.getAllInstances()) {
		p.zElevation -= ascentSpeed * 60 * runtime.dt;
		if (p.zElevation < -16) {
			p.destroy();
		}
	}
}

function playerCollision(runtime) {
	// Deal with player collision

	// Apply gravity to player's Z speed
	player.instVars.zSpeed -= GRAVITY * runtime.dt;
	player.instVars.grounded = false;
	
	// Place player's shadow on the lava
	playerSdw.zElevation = 0;
	
	for (const p of platform.getAllInstances()) {
		
		// Height where the player is above the platform
		const aboveTopHeight = p.zElevation + player.zHeight/2 - p.zHeight;
		// Height where the player is below the platform
		const aboveBottomHeight = p.zElevation - player.zHeight + p.zHeight;
		// Speeds below this mean the player is falling
		const belowAscentSpeed = -ascentSpeed * 60 * runtime.dt;
		
		// Place player's shadow on the platform
		if (player.testOverlap(p) && player.zElevation > aboveTopHeight) {
			playerSdw.zElevation = p.zElevation + p.zHeight + 1;
		}
		
		// If the player is above the platform, stay on top of it
		if (
			player.testOverlap(p) &&
			player.zElevation > aboveTopHeight &&
			player.zElevation < aboveTopHeight + 8 &&
			player.instVars.zSpeed < belowAscentSpeed
		) {
			player.zElevation =  p.zElevation + p.zHeight + 1;
			player.instVars.zSpeed = belowAscentSpeed;
			player.instVars.grounded = true;
		
		// If the player is below the platform, they will hit their head
		} else if (
			player.testOverlap(p) &&
			player.zElevation < aboveBottomHeight &&
			player.zElevation > aboveBottomHeight - 8
		) {
			player.instVars.zSpeed = -2;
		
		// If the player is beside the platform, collide laterally with it
		} else if (
			!player.testOverlap(p) &&
			player.zElevation < aboveTopHeight &&
			player.zElevation > aboveBottomHeight
		) {
			p.behaviors.Solid.isEnabled = true;
		
		// Otherwise, make the platform non-solid again
		} else {
			p.behaviors.Solid.isEnabled = false;
		}
	}

	// Update player's Z Elevation
	player.zElevation += player.instVars.zSpeed * 60 * runtime.dt;
}

function setPlayerAnimation() {
	// Set player animation according to current movement
	
	// Shorthand for player's 8 Direction behavior
	const ed = player.behaviors.EightDirection;
	
	// Jumping
	if (!player.instVars.grounded) {
		playerAnim.setAnimation("Jump");
	
	// Moving left
	} else if (ed.vectorX < 0 || ed.vectorY > 0) {
		playerAnim.setAnimation("Move");
		playerSpr.width = -PLAYERSPRITEWIDTH;
	
	// Moving right
	} else if (ed.vectorX > 0 || ed.vectorY < 0) {
		playerAnim.setAnimation("Move");
		playerSpr.width = PLAYERSPRITEWIDTH;
	
	// Idle
	} else {
		playerAnim.setAnimation("Idle");
	}
	
}

function checkPlayerDeath(runtime) {
	// Check if the player is having a hot bath
	
	if (player.zElevation < 0 && !playerDead) {
		// Create flames animation
		playerDead = true;
		flames.x = player.x;
		flames.y = player.y;
		textureFlames.setAnimation("Blow");
		player.behaviors.EightDirection.isEnabled = false;
	
		// Stop player
		playerDead = true;
		player.zElevation = 0;
		player.instVars.zSpeed = 0;
		
		// Stop platforms
		platformTimer.behaviors.Timer.stopAllTimers();

		// Fade platforms, player sprite and shadow
		for (const p of platform.getAllInstances()) {
			p.behaviors.Tween.startTween(
				"opacity", 0, 0.5, "in-out-sine"
			);
		}
		playerSdw.behaviors.Tween.startTween(
			"opacity", 0, 0.5, "in-out-sine"
		);
		playerSpr.behaviors.Tween.startTween(
			"opacity", 0, 0.5, "in-out-sine"
		);

		// Restart the game after a delay
		setTimeout(() => runtime.goToLayout("Game"), RESETTIME * 1000);
	}
}

function setCamera() {
	// Define where the camera is looking at
	
	// Variables to store rotations
	let xrot;
	let zrot;
	
	// If player is alive, make the camera look at the player
	if (!playerDead) {
		xrot = lerp(
			camera.getLookPosition()[0],
			centerPosition.x + (player.x - centerPosition.x)/8,
			0.1
		);
		zrot = lerp(
			camera.getLookPosition()[2],
			centerPosition.zElevation + (
				player.zElevation - centerPosition.zElevation
			)/6,
			0.1
		)
		
	// Otherwise, look at the score text
	} else {
		xrot = lerp(
			camera.getLookPosition()[0],
			textScore.x,
			0.05
		);	
		zrot = lerp(
			camera.getLookPosition()[2],
			textScore.zElevation,
			0.05
		)
	}
	
	// Apply the new parameters for lookAtPosition
	camera.lookAtPosition(
		cameraPosition.x, cameraPosition.y, cameraPosition.zElevation,
		xrot, centerPosition.y, zrot,
		0, 0, 1
	);
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}