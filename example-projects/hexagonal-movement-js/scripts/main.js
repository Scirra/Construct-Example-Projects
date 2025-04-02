/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * E-mail: ferreiramoreiramateus@gmail.com | X: @BonzerKitten
 *
 * Felipe Vaiano Calderan - Programmer
 * E-mail: fvcalderan@gmail.com | X: @fvcalderan
 *
 * Wesley Andrade - Artist
 * E-mail: wesleymatos1989@gmail.com | X: @andrart7
 *
 * Help us make new examples by supporting our work on
 * https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instances
let player;
let playerGoTo;
let nextTile;
let honey;
let textTutorial;
let textGameOver;
let textVictory;
let fader;

// List of instances
let tiles;

// families
let zOrderables;

// Object interfaces
let tile;
let fly;

// Behaviors
let pmt; // Player's MoveTo behavior

// Settings
const TOFFX = 60; // Tile offset X
const TOFFY = 18; // Tile offset Y
const MAPSIZEX = 5; // Number of tiles in the X axis
const MAPSIZEY = 18; // Number of tiles in the Y axis
const NLEVELS = 3; // Number of levels
const BGTILES = [
	"Floor0", "Floor1", "Player", "Honey", "Next", "Fly1", "Fly2"
]; // Types of ZOrderables that should always be on the background

// Gameplay variables
let currLevel = 1; // Current level number
let tutorialVisible; // Is the player currently reading the tutorial?
let gameOver; // Is the game over?
let canRestart; // Can the playe restart the game?

runOnStartup(async runtime => {
	// Code to run on the loading screen
	
	runtime.addEventListener(
		"beforeprojectstart", () => onBeforeProjectStart(runtime)
	);
});

async function onBeforeProjectStart(runtime) {
	// Code to run before the project starts
	
	// Call code that runs before the layout starts
	runtime.layout.addEventListener(
		"beforelayoutstart", () => onBeforeLayoutStart(runtime)
	);
	
	// Mouse events
	runtime.addEventListener("pointerdown", e => onMouseDown(runtime, e));
	
	// Start ticking
	runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
	// Code to run before the layout starts
	
	// Instances
	player = runtime.objects.Player.getFirstInstance();
	playerGoTo = runtime.objects.PlayerGoTo.getFirstInstance();
	honey = runtime.objects.Honey.getFirstInstance();
	textTutorial = runtime.objects.TextTutorial.getFirstInstance();
	textGameOver = runtime.objects.TextGameOver.getFirstInstance();
	textVictory = runtime.objects.TextVictory.getFirstInstance();
	fader = runtime.objects.Fader.getFirstInstance();
	
	// If the player is not in the first level, skip tutorial
	if (currLevel > 1) {
		textTutorial.opacity = 0;
		fader.opacity = 1;
		fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
	}
	
	// Object interfaces
	tile = runtime.objects.Tile;
	fly = runtime.objects.Fly;
	nextTile = null;
	
	// Families
	zOrderables = runtime.objects.ZOrderables;
	
	// Behaviors
	pmt = player.behaviors.MoveTo;
	
	// Setup variables
	tutorialVisible = currLevel == 1;
	gameOver = false;
	canRestart = false;
	
	// Load level data
	fetch('./levels.json')
	.then((response) => response.json())
	.then((json) => buildTheMap(json));
}

function buildTheMap(levels) {
	// Build current level map
	
	// Create empty tiles array
	tiles = new Array(MAPSIZEX).fill(null).map(
		() => new Array(MAPSIZEY).fill(null)
	);

	// Populate array with tiles
	for (let i = 0; i < tiles.length; i++) {
		for (let j = 0; j < tiles[i].length; j++) {
			
			// Variable to store new tile
			let t;	
			
			// Even row
			if (j % 2 == 0) {
				t = tile.createInstance(
					"Game", 25 + i * TOFFX, 13 + j / 2 * TOFFY
				);
			
			// Odd row
			} else {
				t = tile.createInstance(
					"Game", 55 + i * TOFFX, 22 + Math.floor(j / 2) * TOFFY
				);
			}
			
			// Set tile coordinates instance variables
			[t.tilex, t.tiley] = [i, j];
			
			// Animation fetched from JSON file
			const anim = levels["level" + currLevel][i][j];
			
			// Set correct animation according to JSON
			t.setAnimation(anim);
			
			// Set correct "in background" property according to animation
			t.instVars.inBG = BGTILES.includes(anim);
			
			// Deal with special animations
			switch (anim) {
			
				// Place player
				case "Player":
					player.setPosition(t.x, t.y);
					break;
					
				// Place honey	
				case "Honey":
					honey.setPosition(t.x, t.y + 2);
					break;
				
				// Spawn a weak fly
				case "Fly1":
					fly.createInstance("Game", t.x, t.y, false, "Fly1");
					break;
				
				// Spawn a strong fly
				case "Fly2":
					fly.createInstance("Game", t.x, t.y, false, "Fly2");
					break;
					
				// Store next level tile
				case "Next":
					nextTile = t;
			}
			
			// Insert new tile into tiles array
			tiles[i][j] = t; 
		}
	}
}

function onMouseDown(runtime, e) {
	// Process mouse/touch press event
	
	if (e.button == 0) {
		// If tutorial state is active, hide the tutorial and start the game
		if (tutorialVisible) {
			fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
			textTutorial.behaviors.Tween.startTween(
				"opacity", 0, 0.5, "in-out-sine"
			);
			tutorialVisible = false;
			return;
		}
		
		// If the player can restart the game, restart it
		if (canRestart) {
			runtime.goToLayout("Game");
			return;
		}
		
		// If the game is over, ignore everything else
		if (gameOver)
			return;
	
		// Get layer position from client's mouse position
		const lay = runtime.layout.getLayer("Game")
		const [x, y] = lay.cssPxToLayer(e.clientX, e.clientY);
		
		// Store tile where the player is currently on
		let pTile;
		for (let i = 0; i < tiles.length; i++)
			for (let j = 0; j < tiles[i].length; j++)
				if (tiles[i][j].testOverlap(player))
					pTile = tiles[i][j];
	
		// Look for clicked tile
		for (let i = 0; i < tiles.length; i++) {
			for (let j = 0; j < tiles[i].length; j++) {
				
				// Store current tile
				const t = tiles[i][j];
			
				// Check if this tile has been clicked by the player
				if (
					t && t.containsPoint(x, y) && t.instVars.inBG &&
					t.animationName != "Hole" && pmt.getWaypointCount() == 0
				) {				
					// Put player's "go-to flag" on the tile
					if (t.x != pTile.x || t.y != pTile.y) {
						playerGoTo.setPosition(t.x, t.y);
					}
					
					// Fresh BFS to pathfind from player's pos to objective
					clearBFS();
					const bfsPath = traceBFSPath(explorerBFS(pTile, t));
					
					// Make player follow found waypoints
					while (bfsPath.length > 0) {
						const bfsTile = bfsPath.pop();
						if (bfsTile)
							pmt.moveToPosition(bfsTile.x, bfsTile.y, false);
					}
					moveFlies(t);
				}
			}
		}
	}
}

function moveFlies(pTile) {
	// Move flies according to pathfinding algorithm

	for (const f of fly.getAllInstances()) {
		// Store tile where the fly is currently on
		let fTile;
		for (let i = 0; i < tiles.length; i++)
			for (let j = 0; j < tiles[i].length; j++)
				if (tiles[i][j].testOverlap(f))
					fTile = tiles[i][j];

		// Fresh BFS to pathfind from fly's pos to the player
		clearBFS();
		const bfsPath = traceBFSPath(explorerBFS(fTile, pTile));
		
		// Remove current position
		bfsPath.pop();
		
		// Count number of moves made by the fly
		let nMoves = 0;
		
		// Tell the fly to move through nMoves waypoints
		while(nMoves < f.instVars.numOfMoves) {
			const bfsTile = bfsPath.pop();
			if (bfsTile)
				f.behaviors.MoveTo.moveToPosition(bfsTile.x, bfsTile.y, false);
			nMoves++;
		}
	}
}

function clearBFS() {
	// Clear everything related to previous BFS execution
	
	for (let i = 0; i < tiles.length; i++) {
		for (let j = 0; j < tiles[i].length; j++) {
			tiles[i][j].bfsVisited = false;
			tiles[i][j].bfsParent = null;
		}
	}
}

function explorerBFS(start, finish) {
	// Walk through the world via Breadth-First Search pathfinding
	
	const q = []; // Queue
	start.bfsVisited = true; // Mark root as visited
	q.push(start); // Push root to queue

	// While queue is not empty
	while (q.length) {
		const v = q.shift(); // Dequeue one element

		// If the element is the goal, return it. Continue, otherwise
		if (v == finish)
			return v;

		// Get all neighboring tiles
		const neighbors = getNeighbors(v);

		// Explore valid neighbors and set their parents as "v"
		for (const n of neighbors) {
			if (n.instVars.inBG && !n.bfsVisited) {
				n.bfsVisited = true;
				n.bfsParent = v;
				q.push(n);
			}
		}
	}
	
	// Could not reach the objective
	return null;
}

function getNeighbors(t) {
	// Get all the neighbors of a given tile
	
	// Hexagonal grid has different neighbor patterns for even and odd Y tiles
	const oddTile = t.tiley % 2 != 0;
	
	// Setup neighborhood
	const neighborhood = [
		[t.tilex, t.tiley - 2], // Top
		[t.tilex - 1 + oddTile, t.tiley - 1], // Top left
		[t.tilex + oddTile, t.tiley - 1], // Top right
		[t.tilex - 1 + oddTile, t.tiley + 1], // Bottom left
		[t.tilex + oddTile, t.tiley + 1], // Bottom right
		[t.tilex, t.tiley + 2] // Bottom
	];
	
	// Get all neighboring tiles
	const neighbors = [];
	for (const n of neighborhood)
		if (n[0] >= 0 && n[0] < MAPSIZEX && n[1] >= 0 && n[1] < MAPSIZEY)
			neighbors.push(tiles[n[0]][n[1]]);
	
	// Return the neighbors
	return neighbors;
}

function traceBFSPath(e) {
	// Recursively visit the BFS-explored tiles parents to build a path array
	
	// Create empty path
	const bfsPath = [];
	
	// Use recursion to build the path
	const traceBFSPathRecursive = (node) => {
		bfsPath.push(node);
		if (node && node.bfsParent)
			traceBFSPathRecursive(node.bfsParent);
	}
	traceBFSPathRecursive(e);
	
	// Return path array
	return bfsPath;
}

function onTick(runtime) {
	// Code to run every tick
	
	sortZOrder();
	updatePlayerGoTo();
	updateNextLevelTile();
	checkPlayerDeath();
	updateEntityAnim(player);
	checkPlayerVictory(runtime);
	for (const f of fly.getAllInstances())
		updateEntityAnim(f);
}

function sortZOrder() {
	// Sort ZOrderables Z-Order according to their Y position
	
	// Place "in background" objects first or order by Y
	const order = zOrderables.getAllInstances().sort(
		(a, b) => (b.instVars.inBG - a.instVars.inBG) || (a.y - b.y)
	);
	
	// Perform Z-Order sorting based on the previously built array
	for (const zo of order)
		zo.moveToTop();
}

function updateEntityAnim(ett) {
	// Update player animation according to current action
	
	const bh = ett.behaviors.MoveTo;
	
	// Enable sine and ignore the rest of the code if player is idle
	if (bh.getWaypointCount() == 0) {
		ett.behaviors.Sine.isEnabled = true;
		return;
	}
	
	// Disable sine
	ett.behaviors.Sine.isEnabled = false;

	// Set correct animation, according to player movement
	if (bh.getTargetX() < ett.x)
		ett.setAnimation(ett.templateName + "Left", "current-frame");
	else if (bh.getTargetX() > ett.x)
		ett.setAnimation(ett.templateName + "Right", "current-frame");
	else if (bh.getTargetY() < ett.y)
		ett.setAnimation(ett.templateName + "Up", "current-frame");
	else if (bh.getTargetY() > ett.y)
		ett.setAnimation(ett.templateName + "Down", "current-frame");
}

function updatePlayerGoTo() {
	// If playerGoTo touches the player, move it far away
	
	if (playerGoTo.testOverlap(player))
		playerGoTo.setPosition(10000, 10000);
}

function updateNextLevelTile() {
	// If the player touches the honey, the exit to the next level opens up
	
	if (player.testOverlap(honey)) {
		honey.setPosition(10000, 10000);
		nextTile.setAnimation("NextAnim");
	}
}

function checkPlayerDeath() {
	// If the player touches a fly, show game over message
	
	// Check for contact with every fly
	for (const f of fly.getAllInstances()) {
		if (player.testOverlap(f) && !gameOver) {
		
			// Show game over message
			fader.behaviors.Tween.startTween(
				"opacity", 1, 0.5, "in-out-sine"
			);
			textGameOver.behaviors.Tween.startTween(
				"opacity", 1, 0.5, "in-out-sine"
			);
			pmt.stop();
			gameOver = true;
			setTimeout(() => canRestart = true, 1000);
		}
	}
}

function checkPlayerVictory(runtime) {
	// If the player touches next level tile, go to the next level
	
	if (
		nextTile && (player.x - nextTile.x)**2 + (player.y-nextTile.y)**2 < 8 
		&& !gameOver && nextTile.animationName == "NextAnim"
	) {
		// If the player is not in the final level, go to the next one
		if (currLevel < NLEVELS) {
			fader.behaviors.Tween.startTween(
				"opacity", 1, 0.5, "in-out-sine"
			);
			currLevel++;
			gameOver = true;
			setTimeout(() => runtime.goToLayout("Game"), 1000);
			
		// Otherwise, show game completed message and reset to level 1
		} else {
			fader.behaviors.Tween.startTween(
				"opacity", 1, 0.5, "in-out-sine"
			);
			textVictory.behaviors.Tween.startTween(
				"opacity", 1, 0.5, "in-out-sine"
			);
			currLevel = 1;
			gameOver = true;
			setTimeout(() => canRestart = true, 1000);
		}
	}
}