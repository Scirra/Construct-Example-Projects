/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

// Types.
type Coordinate = {
	x: number;
	y: number;
};
type TimerManager = InstanceType.TimerManager;
type TimerBehaviorInstance = ITimerBehaviorInstance<TimerManager>;
type TimeEvent = TimerBehaviorEvent<TimerManager, TimerBehaviorInstance>;

// Runtime.
let runtime: IRuntime;

// Instances
let board: InstanceType.BoardSprite;

// Objects.
let gemObj: IObjectType<InstanceType.GemSprite>;
let lightObj: IObjectType<InstanceType.GemLight>;

// Global objects.
let tc: ITimelineControllerObjectType;

// Timer manager.
let tm: ITimerBehaviorInstance<TimerManager>;

// Gameplay variables.
let inputFocus: string; // Current input focus.
let topLeft: Coordinate; // Board Top-Left position.
let spacing: number; // Space between gems.
let moveCount: number; // Number of gems moved during a play.

// Settings
const ALL_POS = Array.from({ length: 4 * 4 }, (_, i) => {
	return [Math.floor(i / 4), i % 4];
}); // All board positions.

// Tween times.
const FLASH_TIME = 0.075;
const MOVE_TIME = 0.075;
const RES_TIME = 0.075;

runOnStartup(async r => {
	// Code to run on the loading screen.

	// Make runtime globally accessible.
	runtime = r;

	runtime.addEventListener(
		"beforeprojectstart", () => onBeforeProjectStart()
	);
});

async function onBeforeProjectStart() {
	// Code to run just before the project starts.

	// Call onBeforeLayoutStart just before the layout starts.
	runtime.layout.addEventListener(
		"beforelayoutstart", () => onBeforeLayoutStart()
	);

	// Keyboard events.
	runtime.addEventListener("keyup", e => onKeyUp(e));

	// Start ticking.
	runtime.addEventListener("tick", () => onTick());
}

function onBeforeLayoutStart() {
	// Code to run just before the layout starts.

	// Get objects.
	gemObj = runtime.objects.GemSprite;
	lightObj = runtime.objects.GemLight;

	// Get global objects.
	tc = runtime.timelineController;

	// Get timer.
	tm = runtime.objects.TimerManager.getFirstInstance()!.behaviors.Timer;
	tm.addEventListener("timer", e => onTimer(e));

	// Get instances.
	board = runtime.objects.BoardSprite.getFirstInstance()!;

	// Set gameplay variables starting values.
	inputFocus = "game";
	topLeft = {
		x: board.getImagePointX("TL"),
		y: board.getImagePointY("TL")
	};
	spacing = board.instVars.spacing;
	moveCount = 0;

	// Spawn a random gem.
	spawnNewGem();
}

function onKeyUp(e: KeyboardEvent) {
	// Process key presses.

	// Do not process inputs while timelines are playing.
	if (Array.from(tc.allTimelines()).filter(e => e.isPlaying).length > 0) {
		return;
	}

	// Check for correct input focus.
	if (inputFocus != "game") {
		return;
	}

	// Execute action based on key pressed.
	switch (e.code) {
		// Restart game.
		case "KeyR":
			gameOver("Restart");
			break;

		// Make a move.
		case "ArrowLeft":
			makeMove({ x: -1, y: 0 });
			break;
		case "ArrowRight":
			makeMove({ x: 1, y: 0 });
			break;
		case "ArrowUp":
			makeMove({ x: 0, y: -1 });
			break;
		case "ArrowDown":
			makeMove({ x: 0, y: 1 });
			break;
	}
}

function makeMove(direction: Coordinate) {
	// Process player's move.

	// Change input focus.
	setInputFocus("moving");

	// Get all gems.
	const gems = gemObj.getAllInstances();

	// Sort gems according to movement direction.
	if (direction.x == -1) {
		gems.sort((a, b) => a.instVars.gemX - b.instVars.gemX);
	} else if (direction.x == 1) {
		gems.sort((a, b) => b.instVars.gemX - a.instVars.gemX);
	} else if (direction.y == -1) {
		gems.sort((a, b) => a.instVars.gemY - b.instVars.gemY);
	} else if (direction.y == 1) {
		gems.sort((a, b) => b.instVars.gemY - a.instVars.gemY);
	}

	// Move gems.
	for (const gem of gems) {
		moveSingleGem(gem, direction);
	}

	// If no movement was performed and screen is full, abort.
	if (moveCount == 0 && gems.length == 16) {
		setInputFocus("game");
		return;
	}

	// Reset movement counter.
	moveCount = 0;
	// Prepare gems for new move.
	for (const gem of gems) {
		// Run tween for gems that need to move.
		if (gem.instVars.moveToX != -1) {
			gem.behaviors.Tween.startTween(
				"position",
				[gem.instVars.moveToX, gem.instVars.moveToY],
				MOVE_TIME, "in-out-sine", { tags: "move" }
			);
		}

		// Reset some instance variables.
		gem.instVars.merging = false;
		gem.instVars.moveToX = -1;
		gem.instVars.moveToY = -1;
	}

	// Spawn new gem,
	tm.startTimer(MOVE_TIME * 2, "spawngem", "once");
}

function moveSingleGem(gem: InstanceType.GemSprite, direction: Coordinate) {
	// Move a single gem and process outcome.

	// Check if position is inside the board.
	const inBounds = (x: number, y: number) => {
		return x >= 0 && x <= 3 && y >= 0 && y <= 3;
	};

	// Get gem in (x, y) position
	const gemAt = (x: number, y: number) => gemObj.getAllInstances().filter(
		e => e.instVars.gemX == x && e.instVars.gemY == y
	);

	// Update gem position.
	const updateGemPosition = (
		g: InstanceType.GemSprite, x: number, y: number
	) => {
		// Set logical position.
		g.instVars.gemX = x;
		g.instVars.gemY = y;

		// Set world position to move to.
		g.instVars.moveToX = topLeft.x + spacing * x;
		g.instVars.moveToY = topLeft.y + spacing * y;
	};

	// Get new position.
	const newX = gem.instVars.gemX + direction.x;
	const newY = gem.instVars.gemY + direction.y;

	// Position out of bounds.
	if (!inBounds(newX, newY)) {
		return;
	}

	// Get gem's neighbor (considering direction of movement).
	let n = gemAt(newX, newY);

	// Gem has no neighbor in given direction, so move it to that position.
	if (n.length == 0) {
		updateGemPosition(gem, newX, newY);

		// Update number of moves during this play.
		moveCount++;

		// Recursively call movement for this gem.
		moveSingleGem(gem, direction);
		return;
	}

	// Get animation names.
	const nAnim = n[0].animationName;
	const tAnim = gem.animationName;

	// Merge gem with neighbor if they are of the same type.
	if (nAnim == tAnim && !n[0].instVars.merging && n[0].instVars.active) {
		updateGemPosition(gem, newX, newY);

		// Merge gem with neighbor.
		gem.instVars.merging = true;
		n[0].instVars.active = false;
		n[0].moveToBottom();

		// Merging gem tween.
		const gt = gem.behaviors.Tween.startTween(
			"value", 2, FLASH_TIME, "in-out-sine",
			{ startValue: 1, tags: "flash fIn" }
		);

		// After flash-in tween finishes, play flash-out tween.
		gt.finished.then(_ => {
			// Update animation.
			gem.setAnimation(`${+tAnim + 1}`);

			// Play tween.
			gem.behaviors.Tween.startTween(
				"value", 1, FLASH_TIME, "in-out-sine",
				{ startValue: 2, tags: "flash fOut" }
			);

			// Update Gem's light sprite's animation.
			const gemc = gem.getChildAt(0) as ISpriteInstance;
			gemc.setAnimation(gem.animationName);

			// Check for infinity gem (win condition).
			if (gem.animationName == "11") {
				gameOver("Success");
			}
		});

		// Neighbor gem tween.
		const nt = n[0].behaviors.Tween.startTween(
			"value", 2, FLASH_TIME, "in-out-sine",
			{ startValue: 1, tags: "flash fIn" }
		);
		nt.finished.then(_ => { n[0].destroy() });

		// Update number of moves during this play.
		moveCount++;
	}
}

function spawnNewGem() {
	// Spawn a new gem.

	// If the game is over, do not spawn a new gem.
	if (inputFocus == "gameOver") {
		return;
	}

	// Get gems currently on the board.
	const gemsOnBoard = gemObj.getAllInstances();

	// Helper function to compare arrays.
	const areArraysEqual = (arr1: Array<number>, arr2: Array<number>) => {
		const lengths = arr1.length == arr2.length;
		const elems = arr1.every((value, index) => value == arr2[index]);
		return lengths && elems;
	};

	// Get busy positions.
	const busyPos = gemsOnBoard.map(
		e => [e.instVars.gemX, e.instVars.gemY]
	);

	// Get available positions.
	const availablePos = ALL_POS.filter(a =>
		!busyPos.some(b => areArraysEqual(a, b))
	);

	// Select a random available position.
	const rndPos = availablePos[
		Math.floor(Math.random() * availablePos.length)
	];
	const x = topLeft.x + spacing * rndPos[0];
	const y = topLeft.y + spacing * rndPos[1];

	// Spawn gem at that random position.
	const newGem = gemObj.createInstance("Foreground", x, y);
	newGem.setSize(0.01, 0.01);
	newGem.setAnimation(`${Math.random() < 0.9 ? 1 : 2}`); // Rarely 2.
	newGem.instVars.gemX = rndPos[0];
	newGem.instVars.gemY = rndPos[1];
	newGem.behaviors.Tween.startTween(
		"value", 1, FLASH_TIME, "in-out-sine",
		{ startValue: 2, tags: "flash fOut" }
	);
	newGem.behaviors.Tween.startTween(
		"size",
		[newGem.imageWidth, newGem.imageHeight],
		RES_TIME, "in-out-sine"
	);

	// Create light for newly spawned gem.
	const newLight = lightObj.createInstance("Foreground", x, y);
	newLight.setAnimation(newGem.animationName);
	newGem.addChild(newLight, {
		transformX: true,
		transformY: true,
		transformOpacity: true,
		destroyWithParent: true
	});

	// After a new gem spawns, check if the player can still make a valid move.
	checkForDeadlock();
}

function checkForDeadlock() {
	// Check for a deadlock (no valid moves available).

	// Assumes the player is in a deadlock state.
	let deadlock = true;

	// Get all gems.
	const gems = gemObj.getAllInstances();

	// If the table is not full, there is still a move to make.
	if (gems.length < 16) {
		deadlock = false;
	}

	// Check if any gem can be merged.
	for (const gem of gems) {
		const gx = gem.instVars.gemX; // Shorthand for X position on the table.
		const gy = gem.instVars.gemY; // Shorthand for Y position on the table.

		// Get all neighboring gems that share the same animation.
		const neighbors = gems.filter(e =>
			(e.instVars.gemX == gx + 1 && e.instVars.gemY == gy) ||
			(e.instVars.gemX == gx - 1 && e.instVars.gemY == gy) ||
			(e.instVars.gemX == gx && e.instVars.gemY == gy - 1) ||
			(e.instVars.gemX == gx && e.instVars.gemY == gy + 1)
		).filter(e => e.animationName == gem.animationName);

		// There's at least 1 merge available, so there's still a move to make.
		if (neighbors.length > 0) {
			deadlock = false;
		}
	}

	// If after the checks, deadlock is still true, it's game over.
	if (deadlock) {
		gameOver("Fail");
	}
}

function gameOver(animation: string) {
	// Player got into a deadlock situation. It's game over!

	// Change input focus.
	setInputFocus("gameOver");

	// Play correct game over animation.
	tc.play(animation).finished.then(_ => runtime.goToLayout("Game"));
}

function onTimer(e: TimeEvent) {
	// Process timer events.

	// Spawn new gem and let the player make a move.
	if (e.tag == "spawngem") {
		spawnNewGem();
		setInputFocus("game");
	}
}

function setInputFocus(focus: string) {
	// Set input focus.

	// Lock input focus if game is over.
	if (inputFocus != "gameOver") {
		inputFocus = focus;
	}
}

function onTick() {
	// Code to run every tick.

	for (const gem of gemObj.getAllInstances()) {
		// Play flash animation.
		for (const t of gem.behaviors.Tween.tweensByTags("flash")) {
			gem.effects[0].setParameter(2, t.value);
		}
	}
}