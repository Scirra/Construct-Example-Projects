/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

import * as wordHunt from "./wordHunt.ts"
import * as tools from "./tools.ts"

// Runtime
let runtime: IRuntime;

// Instances.
let timer: InstanceType.TimerText;
let botFader: InstanceType.BotFader;
let topFader: InstanceType.TopFader;
let buttonNew: InstanceType.ButtonNew;
let buttonYes: InstanceType.ButtonYes;
let buttonNo: InstanceType.ButtonNo;
let popup: InstanceType.Popup;
let textMessage: InstanceType.TextMessage;

// Object classes.
let letter: IObjectType<InstanceType.Letter>;
let wordText: IObjectType<InstanceType.WordText>;
let marker: IObjectType<InstanceType.Marker>;

// Other variables.
let table: wordHunt.Table;		// Abstract table.
let cmk: InstanceType.Marker | null; 	// Current marker.

// Settings.
const W_OFFSET_Y = 108;			// WordText Y offset.
const W_OFFSET_X = 192;			// WordText X offset.
const FAR = 10000;				// Far position.
const MARKER_MIN_WIDTH = 52;	// Minimum marker width.
const MARKER_OFFSET = 26;		// Marker position offset.
const TEXT_OUTLINE = "[outline=#1749a0][lineThickness=1.2]" // Text outline.

runOnStartup(async r => {
	// Code to run on the loading screen.

	// Make runtime global.
	runtime = r;

	// Setup event listeners.
	runtime.addEventListener("beforeanylayoutstart", () => onBeforeAnyLayoutStart());
	runtime.addEventListener("pointerdown", e => onPointerDown(e));
	runtime.addEventListener("pointerup", e => onPointerUp(e));
	runtime.addEventListener("pointermove", e => onPointerMove(e));
});

async function onBeforeAnyLayoutStart() {
	// Code to run just before the layout starts.

	// Get object instances.
	timer = runtime.objects.TimerText.getFirstInstance()!;
	botFader = runtime.objects.BotFader.getFirstInstance()!;
	topFader = runtime.objects.TopFader.getFirstInstance()!;
	buttonNew = runtime.objects.ButtonNew.getFirstInstance()!;
	buttonYes = runtime.objects.ButtonYes.getFirstInstance()!;
	buttonNo = runtime.objects.ButtonNo.getFirstInstance()!;
	popup = runtime.objects.Popup.getFirstInstance()!;
	textMessage = runtime.objects.TextMessage.getFirstInstance()!;

	// Get object classes.
	letter = runtime.objects.Letter;
	wordText = runtime.objects.WordText;
	marker = runtime.objects.Marker;

	// Load database of words in JSON format.
	const response = await fetch("./words.json");
    const wordJson: Record<string, string[]> = await response.json();

	// Create array of words.
	const words: string[] = [
		...tools.getRandomItems(wordJson["10"], 1),
		...tools.getRandomItems(wordJson["9"], 2),
		...tools.getRandomItems([
			...wordJson["8"],
			...wordJson["7"],
			...wordJson["6"],
		], 6),
		...tools.getRandomItems(wordJson["5"], 4),
		...tools.getRandomItems(wordJson["4"], 2)
	];

	// Create a new table.
	table = new wordHunt.Table(12, 12, words);

	// Shorthand for runtime.layout.width and height.
	const layW = runtime.layout.width;
	const layH = runtime.layout.height;

	// Create letters and set their properties.
	for (let i = 0; i < table.width; i++) {
		for (let j = 0; j < table.height; j++) {
			const l = letter.createInstance("Letters", FAR, FAR);
			l.x = layW/2 - l.width/2 * (table.width - 1) + i * l.width;
			l.y = layH/2 - l.height/2 * (table.height - 1) + j * l.height;
			l.instVars.gridX = i;
			l.instVars.gridY = j;
			l.text = table.grid[i][j];
		}
	}
	
	// Create color iterator.
	const colorIter = tools.cycleColors();

	// Create list of words at the bottom of the screen.
	for (const [i, w] of table.placedWords.entries()) {
		const wt = wordText.createInstance("Letters", FAR, FAR, true);
		const wtbg = wt.getChildAt(0)! as InstanceType.WordTextBG;
		wt.x = W_OFFSET_X;
		wt.y = W_OFFSET_Y + wtbg.height/2 + i * wtbg.height * 0.9;
		wt.text = w;

		// Set a custom animation and color for the word background.
		wtbg.animationFrame = Math.floor(Math.random() * 2);
		const newColor =  tools.hex2rgb(colorIter.next().value!);
		wtbg.colorRgb = newColor as Vec3Arr;
	}

	// Start timer.
	timer.behaviors.Timer.startTimer(1.0, "timeTick", "regular");
	timer.behaviors.Timer.addEventListener("timer", e => timeTick(e));

	// Hide Top fader.
	topFader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
}

function onPointerDown(e: MouseEvent) {
	// Process pointer down events.

	// Block all pointer actions during top fader animations.
	if (topFader.opacity > 0) return;

	// Process popup pointer down events.
	if (botFader.opacity > 0 || popup.opacity > 0) {
		if (buttonYes.opacity == 1) {
			const layPopupUI = runtime.layout.getLayer("UI_Popup")!;

			// "Yes" button.
			if (tools.pointerOverObj(layPopupUI, buttonYes, e)) {
				buttonYes.animationFrame = 1;
			}

			// "No" button.
			if (tools.pointerOverObj(layPopupUI, buttonNo, e)) {
				buttonNo.animationFrame = 1;
			}
		}
	} else {
		// Process in-game pointer down events.

		// "New Game" button.
		const layGameUI = runtime.layout.getLayer("UI_Game")!;
		if (tools.pointerOverObj(layGameUI, buttonNew, e)) {
			buttonNew.animationFrame = 1;
		}

		// If the player is already dragging a marker, ignore.
		if (cmk) return;

		const layLetters = runtime.layout.getLayer("Letters")!;
		const [mx, my] = tools.pointerPos(layLetters, e);

		// Create a marker over the letter being hovered.
		for (const l of letter.getAllInstances()) {
			if (tools.pointerOverObj(layLetters, l, e)) {
				cmk = marker.createInstance("Markers", l.x, l.y);
				cmk.instVars.startingX = l.x;
				cmk.instVars.startingY = l.y;
				cmk.instVars.gridX = l.instVars.gridX;
				cmk.instVars.gridY = l.instVars.gridY;
				cmk.width = 0;
				onPointerMove(e);
			}
		}
	}
}

function onPointerUp(e: MouseEvent) {
	// Process pointer up/release events.

	// Block all pointer actions during top fader animations.
	if (topFader.opacity > 0) return;

	// Process popup pointer up events.
	if (botFader.opacity > 0 || popup.opacity > 0) {
		if (popup.opacity == 1 && buttonYes.opacity == 1 && buttonYes.isVisible) {
			const layPopupUI = runtime.layout.getLayer("UI_Popup")!;

			// "Yes" button - Restart the game.
			if (tools.pointerOverObj(layPopupUI, buttonYes, e)) {
				restartGame();
			}

			// "No" button - Return to normal gameplay.
			if (tools.pointerOverObj(layPopupUI, buttonNo, e)) {
				popup.behaviors.Tween.startTween("opacity", 0, 0.25, "in-out-sine");
				botFader.behaviors.Tween.startTween("opacity", 0, 0.25, "in-out-sine");
			}
		}
	} else {
		// Process in-game pointer up events.

		// New Game button.
		const layGameUI = runtime.layout.getLayer("UI_Game")!;
		if (tools.pointerOverObj(layGameUI, buttonNew, e)) {
			if (buttonNew.animationFrame == 1) {
				botFader.behaviors.Tween.startTween("opacity", 0.75, 0.25, "in-out-sine");
				popup.behaviors.Tween.startTween("opacity", 1, 0.25, "in-out-sine");
			}
		}

		// Finish current marker (if one is being drawn).
		finishMarker(e);
	}

	// Release all buttons.
	buttonNew.animationFrame = 0;
	buttonYes.animationFrame = 0;
	buttonNo.animationFrame = 0;
}

function onPointerMove(e: MouseEvent) {
	// Process pointer move events.

	// Ignore, if the player is not currently creating a marker.
	if (!cmk) return;

	const layLetters = runtime.layout.getLayer("Letters")!
	const [mx, my] = tools.pointerPos(layLetters, e);

	// Draw the marker.
	cmk.width = Math.max(MARKER_MIN_WIDTH, tools.dist2D(mx, my, cmk.x, cmk.y));
	cmk.angle = tools.lock2step(tools.angleBetween(cmk.x, cmk.y, mx, my), Math.PI/4);
	[cmk.x, cmk.y] = tools.pointFromAngle(
		cmk.instVars.startingX, cmk.instVars.startingY, cmk.angle, -MARKER_OFFSET
	);
}

function foundLetter(l: InstanceType.Letter, endPos: [number, number]) {
	// Verify if the player found a letter.

	// Player must be drawing a marker.
	if (!cmk) return;

	if (l.containsPoint(...endPos)) {
		// Shorthand for cmk.instVars
		const v = cmk.instVars

		// Update marker's width.
		const width = tools.dist2D(cmk.x, cmk.y, l.x, l.y) + MARKER_OFFSET;
		cmk.behaviors.Tween.startTween("width", width, 0.1, "in-out-sine");

		// Set marker's "grid" length.
		v.length = Math.max(
			Math.abs(v.gridX - l.instVars.gridX) + 1,
			Math.abs(v.gridY - l.instVars.gridY) + 1
		);

		// Set marker's direction.
		[v.dirX, v.dirY] = tools.angle2direction(cmk.angle);

		// Assign highlighted word to the marker.
		v.word = table.getWord(
			v.gridX, v.gridY, v.dirX, v.dirY, v.length
		)!;

		// Letter found.
		return true;
	}

	// No letter found.
	return false;
}

function timeTick(e: TimerBehaviorEvent) {
	// Tick 1 second.

	// Shorthand for timer.instVars.
	const v = timer.instVars;

	// Add 1 second to the elapsed time.
	v.elapsedTime ++;

	// Update display text.
	const minText = Math.floor(v.elapsedTime / 60);
	const secText = String(v.elapsedTime % 60).padStart(2, "0");
	timer.text = TEXT_OUTLINE + minText + ":" + secText;
}

function destroyMarker() {
	// Play an animation when destroying a marker.

	// If there is no marker being drawn, there is nothing to destroy.
	if (!cmk) return;

	cmk.behaviors.Tween.startTween(
		"width", MARKER_MIN_WIDTH, 0.2, "in-out-sine"
	);
	cmk.behaviors.Tween.startTween(
		"opacity", 0, 0.1, "in-out-sine", {destroyOnComplete: true}
	);
}

function finishMarker(e: MouseEvent) {
	// Process what to do when the player finishes drawing a marker.

	// Ignore, if the player is not currently creating a marker.
	if (!cmk) return;

	const layLetters = runtime.layout.getLayer("Letters")!;
	const [mx, my] = tools.pointerPos(layLetters, e);

	// Get end position of the current marker.
	const endPos = tools.pointFromAngle(
		cmk.x, cmk.y, cmk.angle, cmk.width - MARKER_OFFSET
	);

	// Check if the player released the marker over a letter.
	const letterFound = letter.getAllInstances().some(
		l => foundLetter(l, endPos as [number, number])
	);

	// If a letter was found, that means the player highlighted something.
	if (letterFound) {
		// Get the highlighted "word".
		const word = cmk.instVars.word;

		// Check if it's a valid word.
		let validWord = false;
		for (const wt of wordText.getAllInstances()) {
			// Invalid word. Check the next one.
			if (wt.text != word) continue;

			// It is a valid word. Remove the corresponding WordText.
			validWord = true;
			const wtTween = wt.behaviors.Tween.startTween(
				"x", -wt.width * 2, 0.5, "in-sine", {destroyOnComplete: true}
			);

			// Check if the player beat the game.
			wtTween.finished.then(checkVictory);

			// Make the marker the same color as the word found.
			const wtbg = wt.getChildAt(0)!;
			cmk.colorRgb = wtbg.colorRgb;
		}

		// If it is not a valid word, the marker is invalid.
		if (!validWord) destroyMarker();
		
	} else {
		// Marker was not dropped over a letter, therefore it's invalid.
		destroyMarker();
	}

	// Remove focus from the current marker.
	cmk = null;
}

function checkVictory() {
	// Check if the player beat the game.

	// If there are no more words left, the player won.
	if (!wordText.getFirstInstance()) {

		// Stop timer.
		timer.behaviors.Timer.stopAllTimers();

		// Show game over screen.
		popup.behaviors.Tween.startTween("opacity", 1, 0.25, "in-out-sine");
		botFader.behaviors.Tween.startTween("opacity", 0.75, 0.25, "in-out-sine");
		buttonYes.isVisible = false;
		buttonNo.isVisible = false;

		// Show game over message with final elapsed time.
		textMessage.text = TEXT_OUTLINE + "Good job!\n\nTime: " + timer.text;

		setTimeout(() => restartGame(), 5000);
	}
}

async function restartGame() {
	// Restart the game.

	// Show the top fader.
	const t = topFader.behaviors.Tween.startTween("opacity", 1, 0.25, "in-out-sine");

	// After the animation is done, restart the layout.
	await t.finished;
	runtime.goToLayout("Game");
}