/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

// Instances.
let background;
let backgroundTable;
let clay;
let clayShadow;
let stoneBase;
let woodenBase;
let canvas;
let brush;
let toolCase;
let pickerBody;
let buttonReady;
let buttonDelete;
let buttonBlur;
let buttonScreenshot;
let buttonReset;
let screenshotGroup;
let fader;
let startGame;
let tutorialText;

// List of instances.
let tools;
let colorPickers;
let buttonsBackground;

// Gameplay variables.
let runtime; // Globally accessible runtime variable.
let sTool = null; // Selected tool.
let rotationSpeed = 1200; // Base's rotation speed.
let transitionPlaying = false; // Is a transition currently playing?
let backgroundSelected = 0; // Currently selected background.

// Settings.
const SCULPT_SPEED = 0.1; // How fast the player sculpts the clay.
const STARTING_ROT_SPEED = 1200; // How fast the base rotates.

runOnStartup(async r => {
	// Code to run on the loading screen.

	// Make runtime global.
	runtime = r;
	
	// Setup event listeners.
	runtime.addEventListener("beforeprojectstart", () => onBeforeProjectStart());
	runtime.addEventListener("wheel", e => onMouseWheel(e));
	runtime.addEventListener("mousedown", e => onMouseDown(e));
	runtime.addEventListener("mouseup", e => onMouseUp(e));
});

async function onBeforeProjectStart() {
	// Code to run just before 'On start of layout'.

	// Get instances.
	background = runtime.objects.Background.getFirstInstance();
	backgroundTable = runtime.objects.BackgroundTable.getFirstInstance();
	clay = runtime.objects.Clay.getFirstInstance();
	clayShadow = runtime.objects.ClayShadow.getFirstInstance();
	stoneBase = runtime.objects.StoneBase.getFirstInstance();
	woodenBase = runtime.objects.WoodenBase.getFirstInstance();
	canvas = runtime.objects.DrawingCanvas.getFirstInstance();
	brush = runtime.objects.Brush.getFirstInstance();
	toolCase = runtime.objects.ToolCase.getFirstInstance();
	pickerBody = runtime.objects.PickerBody.getFirstInstance();
	buttonReady = runtime.objects.ButtonReady.getFirstInstance();
	buttonDelete = runtime.objects.ButtonDelete.getFirstInstance();
	buttonBlur = runtime.objects.ButtonBlur.getFirstInstance();
	buttonScreenshot = runtime.objects.ButtonScreenshot.getFirstInstance();
	buttonReset = runtime.objects.ButtonReset.getFirstInstance();
	screenshotGroup = runtime.objects.ScreenshotGroup.getFirstInstance();
	fader = runtime.objects.Fader.getFirstInstance();
	startGame = runtime.objects.StartGame.getFirstInstance();
	tutorialText = runtime.objects.TutorialText.getFirstInstance();

	// Get list of instances.
	tools = runtime.objects.Tool.getAllInstances();
	colorPickers = runtime.objects.ColorPicker.getAllInstances();
	buttonsBackground = runtime.objects.ButtonBackground.getAllInstances();

	// Add drag and drop event listeners for the tools.
	for (const tool of tools) {
		tool.behaviors.DragDrop.addEventListener("dragstart", e => onToolDragStart(e));
		tool.behaviors.DragDrop.addEventListener("drop", _ => onToolDrop());
	}

	// Show tutorial screen.
	enterTransition();
	tutorialText.behaviors.Tween.startTween("opacity", 1.0, 0.5, "in-sine");
	fader.behaviors.Tween.startTween("opacity", 0.85, 0.5, "in-out-sine");

	// Start ticking.
	runtime.addEventListener("tick", () => onTick());
}

function onToolDragStart(e) {
	// The currently selected tool is the one the player is dragging.

	sTool = e.instance;
}

function onToolDrop() {
	// Player dropped selected tool.

	// A tool must be selected in the first place.
	if (!sTool) return;

	// Limit chisels to the first half of the clay object.
	if (sTool && sTool.getChildAt(0).objectType.name == "Chisel")
		sTool.x = Math.min(sTool.x, stoneBase.x - sTool.getBoundingBox().width/2 - 8);

	// Move dropped tool back to its starting position.
	sTool.behaviors.Tween.startTween("position", [sTool.instVars.startingX, sTool.instVars.startingY], 0.1, "in-out-sine");
	sTool.behaviors.Tween.startTween("angle", 0, 0.1, "in-out-sine");

	// Unassign selected tool.
	sTool = null;
}

function onMouseWheel(e) {
	// Rotate selected tool.

	// The code is only relevant if the player is dragging a tool.
	if (!sTool) return;

	// DEG to RAD constant.
	const RAD = 0.0174533;
	
	// Smoothly rotate the tool.
	let angle = sTool.angle + (e.deltaY > 0 ? 10 * RAD : -10 * RAD)
	if (sTool.behaviors.DragDrop.isDragging)
		sTool.behaviors.Tween.startTween("angle", Math.round((angle) / (10 * RAD)) * 10 * RAD, 0.05, "in-out-sine");
}

function onMouseDown(e) {
	// Pointer down events.

	// Check if start game was pressed, if so, hide tutorial screen.
	if (mouseOverObj(startGame, e) && tutorialText.opacity == 1) {
		exitTransition();
		tutorialText.behaviors.Tween.startTween("opacity", 0.0, 0.5, "in-out-sine");
		fader.behaviors.Tween.startTween("opacity", 0.0, 0.5, "in-out-sine");
	}

	// If a transition is playing, ignore.
	if (transitionPlaying) return;

	// Player presset one of the individual buttons.
	if (mouseOverObj(buttonReady, e)) buttonReady.setAnimation("Pressed");
	if (mouseOverObj(buttonDelete, e)) buttonDelete.setAnimation("Pressed");
	if (mouseOverObj(buttonScreenshot, e)) buttonScreenshot.setAnimation("Pressed");
	if (mouseOverObj(buttonReset, e)) buttonReset.setAnimation("Pressed"); 
}

function onMouseUp(e) {
	// Pointer up events.

	// If a transition is playing, ignore.
	if (transitionPlaying) return;

	// Execute button action.
	if (mouseOverObj(buttonReady, e) && buttonReady.animationName == "Pressed")
		screenshotMode();
	if (mouseOverObj(buttonDelete, e) && buttonDelete.animationName == "Pressed")
		deleteArt();
	if (mouseOverObj(buttonScreenshot, e) && buttonScreenshot.animationName == "Pressed")
		shareScreenshot();
	if (mouseOverObj(buttonReset, e) && buttonReset.animationName == "Pressed")
		resetGame();

	// Execute blur button's action.
	if (mouseOverObj(buttonBlur, e)) {
		toggleBlur();
		buttonBlur.setAnimation(buttonBlur.animationName == "Pressed" ? "Normal" : "Pressed");
	}
		
	// Execute background button's action.
	for (const btnBg of buttonsBackground) {
		if (mouseOverObj(btnBg, e)) {
			background.setAnimation(`Background_${btnBg.animationFrame}`);
			backgroundTable.setAnimation(`Table_${btnBg.animationFrame}`);
			backgroundSelected = btnBg.animationFrame;
		}
	}

	// Restore all buttons to normal animation.
	buttonReady.setAnimation("Normal");
	buttonDelete.setAnimation("Normal");
	buttonScreenshot.setAnimation("Normal");
	buttonReset.setAnimation("Normal");
	for (const btnBg of buttonsBackground)
		btnBg.setAnimation(btnBg.animationFrame == backgroundSelected ? "Pressed" : "Normal", "current-frame");
}

async function screenshotMode() {
	// Go to screenshot mode.

	// Enter a transition.
	enterTransition();

	// Move art to the center.
	woodenBase.behaviors.Tween.startTween("x", runtime.layout.width / 2, 0.5, "in-out-sine");

	// Stop rotation.
	stoneBase.behaviors.Tween.startTween("value", 0, 0.5, "in-out-sine", {"startValue": rotationSpeed});

	// Hide tools.
	toolCase.behaviors.Tween.startTween("x", -toolCase.width * 1.5, 0.5, "in-out-sine");
	pickerBody.behaviors.Tween.startTween("x", -pickerBody.width * 1.5, 0.5, "in-out-sine");

	// Hide buttons.
	buttonDelete.behaviors.Tween.startTween("y", buttonDelete.instVars.disabledY, 0.5, "in-out-sine");
	buttonReady.behaviors.Tween.startTween("y", buttonReady.instVars.disabledY, 0.5, "in-out-sine");

	// Show screenshot buttons.
	await screenshotGroup.behaviors.Tween.startTween("y", screenshotGroup.instVars.enabledY, 0.5, "in-out-sine").finished;

	// After the screenshot buttons are on-screen, exit transition mode.
	exitTransition();
}

async function deleteArt() {
	// Delete current art and bring a new clay for sculpting.

	// Enter a transition.
	enterTransition();

	// Move the base outside the screen.
	await woodenBase.behaviors.Tween.startTween("x", runtime.layout.width + woodenBase.width * 1.5, 0.5, "in-out-sine").finished;
	
	// After the base is done moving, reset mesh.
	clay.releaseMesh();
	clayShadow.releaseMesh();
	clay.createMesh(2, 128);
	clayShadow.createMesh(2, 128);
	canvas.clearCanvas([0, 0, 0, 0]);

	// Bring the base back.
	await woodenBase.behaviors.Tween.startTween("x", woodenBase.instVars.startingX, 0.5, "in-out-sine").finished;

	// After the base is back on-screen, exit transition mode.
	exitTransition();
}

function toggleBlur() {
	// Toggle background blur.

	background.effects[0].setParameter(0, Math.abs(background.effects[0].getParameter(0) - 1))
	background.effects[1].setParameter(0, Math.abs(background.effects[1].getParameter(0) - 1))
}

async function shareScreenshot() {
	// Take and share a screenshot.

	// Hide screenshot buttons.
	await screenshotGroup.behaviors.Tween.startTween("y", screenshotGroup.instVars.disabledY, 0.5, "in-out-sine").finished;

	// Take the screenshot.
	runtime.callFunction("Screenshot");

	// Show reset button.
	buttonReset.behaviors.Tween.startTween("y", buttonReset.instVars.enabledY, 0.5, "in-out-sine").finished;
}

async function resetGame() {
	// Reset game to initial state.

	// Fade out.
	await fader.behaviors.Tween.startTween("opacity", 1, 0.5, "in-out-sine").finished;

	// Reset mesh.
	clay.releaseMesh();
	clayShadow.releaseMesh();
	clay.createMesh(2, 128);
	clayShadow.createMesh(2, 128);
	canvas.clearCanvas([0, 0, 0, 0]);

	// Reset objects positions.
	woodenBase.x = woodenBase.instVars.startingX;
	toolCase.x = toolCase.instVars.startingX;
	pickerBody.x = pickerBody.instVars.startingX;

	// Reset buttons.
	buttonDelete.y = buttonDelete.instVars.enabledY;
	buttonReady.y = buttonReady.instVars.enabledY;
	buttonReset.y = buttonReset.instVars.disabledY;
	buttonBlur.setAnimation("Pressed");

	// Reset background.
	background.setAnimation("Background_0")
	backgroundTable.setAnimation("Table_0")
	background.effects[0].setParameter(0, 1)
	background.effects[1].setParameter(0, 1)

	// Reset variables.
	sTool = null;
	rotationSpeed = STARTING_ROT_SPEED
	transitionPlaying = false;
	backgroundSelected = 0;

	// Fade in.
	await fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine").finished;
}

function enterTransition() {
	// Enter a transition.

	// Enable transition mode.
	transitionPlaying = true;

	// Drop all tools and disable DragDrop behaviors.
	for (const t of tools) {
		t.behaviors.DragDrop.drop();
		t.behaviors.DragDrop.isEnabled = false;
	}
}

function exitTransition() {
	// Exit a transition.

	transitionPlaying = false;

	// Enable DragDrop behaviors.
	for (const t of tools)
		t.behaviors.DragDrop.isEnabled = true;
}

function onTick() {
	// Code to run every tick.

	rotateClayAndBase();
	limitPosition();
	pickColor();
	sculptClay(0);
	sculptClay(1);
	paintClay();
}

function limitPosition() {
	// Limit selected chisel tool X position to half screen.

	// A tool must be selected in the first place.
	if (!sTool) return;

	if (sTool && sTool.getChildAt(0).objectType.name == "Chisel")
		sTool.x = Math.min(sTool.x, stoneBase.x - sTool.getBoundingBox().width/2 - 8);
}

function pickColor() {
	// Change brush color if the player moves it over a color picker.

	for (const cp of colorPickers) {
		if (brush.testOverlap(cp)) {
			brush.colorRgb = cp.colorRgb;
			// Interpret color array as binary and convert it to decimal to get the animation frame.
			brush.getParent().animationFrame = parseInt(cp.colorRgb.join(''), 2)
		}
	}
}

function rotateClayAndBase() {
	// Create the illusion of rotation by scrolling tiledbackgrounds.

	// Get current rotation speed from stoneBase tween.
	const t = stoneBase.behaviors.Tween.allTweens().next()?.value;
	if (t) rotationSpeed = t.value;

	// Apply rotation speed to relevant objects.
	clay.imageOffsetX = clay.imageOffsetX + rotationSpeed * runtime.dt;
	stoneBase.imageOffsetX = stoneBase.imageOffsetX + rotationSpeed * runtime.dt;
}

function sculptClay(chiselNumber) {
	// Sculpt clay with a chisel tool.

	// Tool must be a chisel, otherwise do not run this function.	
	if (!sTool || sTool.getChildCount() < chiselNumber + 1) return;
	const chisel = sTool.getChildAt(chiselNumber);
	if (!chisel || chisel.objectType.name != "Chisel") return;
	
	for (let i = 0; i < clay.getMeshSize()[1]; i++) {
		// Get left mesh point and its (x, y) coordinates.
		const mPointL = clay.getMeshPoint(0, i);
		const mPointLX = mPointL.x * clay.width + clay.x;
		const mPointLY = mPointL.y * clay.height + clay.y;

		// Get corresponding right mesh point.
		const mPointR = clay.getMeshPoint(1, i);

		// Get chisel's bounding box.
		const bbox = chisel.getBoundingBox();

		// Check if left mesh point is within chisel's y limits.
		if (mPointLY < bbox.bottom && mPointLY > bbox.top) {

			// If the chisel's is overlapping one or more left mesh points, sculpt the clay.
			if (chisel.containsPoint(mPointLX, mPointLY)) {
				clay.setMeshPoint(0, i, {"mode": "absolute", "x": mPointL.x + SCULPT_SPEED * runtime.dt, "y": mPointL.y});
				clay.setMeshPoint(1, i, {"mode": "absolute", "x": mPointR.x - SCULPT_SPEED * runtime.dt, "y": mPointR.y});
				clayShadow.setMeshPoint(0, i, {"mode": "absolute", "x": mPointL.x + SCULPT_SPEED * runtime.dt, "y": mPointL.y});
				clayShadow.setMeshPoint(1, i, {"mode": "absolute", "x": mPointR.x - SCULPT_SPEED * runtime.dt, "y": mPointR.y});
			}
		}
	}
}

function paintClay() {
	// Paint clay with the brush tool.

	// Tool must be a brush, otherwise do not run this function.
	if (!sTool) return;
	const brush = sTool.getChildAt(0);
	if (!brush || brush.objectType.name != "Brush") return;
	
	for (let i = 0; i < clay.getMeshSize()[1]; i++) {

		// Get left mesh point and its (x, y) coordinates.
		const mPointL = clay.getMeshPoint(0, i);
		const mPointLX = mPointL.x * clay.width + clay.x;
		const mPointLY = mPointL.y * clay.height + clay.y;

		// Get corresponding right mesh point and its (x, y) coordinates.
		const mPointR = clay.getMeshPoint(1, i);
		const mPointRX = mPointR.x * clay.width + clay.x;

		// Get brush's bounding box.
		const bbox = brush.getBoundingBox();

		// Check if left mesh point is within chisel's y limits.
		if (mPointLY < bbox.bottom && mPointLY > bbox.top) {

			// If the brush's collision box is to the right of the left mesh point, paint the clay.
			if ((brush.x > mPointLX && brush.x < mPointRX) || brush.containsPoint(mPointLX, mPointLY)) {
				canvas.fillRect(0, bbox.top - canvas.y, canvas.width, bbox.bottom - canvas.y, [...brush.colorRgb, 1]);
			}
		}
	}

}

function client2Layer(e) {
	// Return layer coordinates, given clientX and clientY.

	return runtime.layout.getLayer("ToolObjects").cssPxToLayer(e.clientX, e.clientY);
}

function mouseOverObj(c, e) {
	// Check if mouse pointer is over a given object.

	return c.containsPoint(...client2Layer(e))
}

function arraysEqual(a, b) {
	// Check if arrays are equal.

    return a.length === b.length && a.every((val, i) => val === b[i]);
}