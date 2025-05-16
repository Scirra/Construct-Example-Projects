/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

// Import utility functions.
import { cubic, clamp, lerp, rnd } from './utils.js';

// Global runtime.
let runtime: IRuntime;

// Global objects.
let camera: I3DCameraObjectType;
let keyboard: IKeyboardObjectType;

// Object types.
let billboard: IObjectType<InstanceType.Billboard>;

// List of instances.
let objIcons: InstanceType.ObjIcon[];
let walls: InstanceType.Walls[];

// Instances.
let cursor: InstanceType.Cursor;
let cursorPole: InstanceType.CursorPole;
let cursorIcon: InstanceType.CursorIcon;
let cursorIconTex: InstanceType.CursorIconTex;
let terrain: InstanceType.Terrain;
let pickerUI: InstanceType.PickerUI;
let objSelector: InstanceType.ObjSelector;
let radius: InstanceType.Radius;
let tutoScr: InstanceType.TutorialScreen;
let water: InstanceType.Water;

// Canvas to request mouse lock.
let mouseLocker: HTMLCanvasElement;

// Settings.
const SENS = 0.5; // Mouse sensitivity.
const RESX = 160; // Mesh horizontal resolution.
const RESY = 160; // Mesh vertical resolution.
const CAM_DIST = 700; // Camera distance from the center.
const CAM_ELEV_SPD = 10; // Camera elevation speed.
const CAM_ROT_SPD = 0.025; // Camera rotation speed.
const T_ELEV_SPD = 20; // Terrain elevation speed.
const MIN_BRUSH_RADIUS = 1; // Minimum brush radius.
const MAX_BRUSH_RADIUS = 50; // Maximum brush radius.

// Gameplay variables.
let bRadius = 10; // Brush radius.
let terrainGrid = Array.from(
	{ length: RESX }, () => Array(RESY).fill(50)
); // Mesh grid array;
let gridSize = { width: 0, height: 0 }; // Size of each mesh rect.
let lmbDown = false; // Is the left mouse button down?
let rmbDown = false; // Is the right mouse button down?
let camAngle = 0; // Camera angle.
let camHeight = 400; // Camera height.
let shiftDown = false; // Is the left shift key down?
let tool = "sculpt"; // Currently selected tool.
let pickedObj = "Tree0_3"; // Currently selected billboard object.

// =============================================================================
// Startup.
// =============================================================================

runOnStartup(async r => {
	// Code to run on the loading screen.

	// Make runtime accessible globally.
	runtime = r;

	r.addEventListener("beforeprojectstart", () => OnBeforeProjectStart());
});

async function OnBeforeProjectStart() {
	// Code to run just before 'On start of layout'.

	// Get global objects.
	camera = runtime.objects.Camera3D;
	keyboard = runtime.keyboard;

	// Get object types.
	billboard = runtime.objects.Billboard;

	// Get list of instances.
	objIcons = runtime.objects.ObjIcon.getAllInstances();
	walls = runtime.objects.Walls.getAllInstances();

	// Get instances.
	cursor = runtime.objects.Cursor.getFirstInstance()!;
	cursorPole = runtime.objects.CursorPole.getFirstInstance()!;
	cursorIcon = runtime.objects.CursorIcon.getFirstInstance()!;
	cursorIconTex = runtime.objects.CursorIconTex.getFirstInstance()!;
	terrain = runtime.objects.Terrain.getFirstInstance()!;
	objSelector = runtime.objects.ObjSelector.getFirstInstance()!;
	pickerUI = runtime.objects.PickerUI.getFirstInstance()!;
	radius = runtime.objects.Radius.getFirstInstance()!;
	tutoScr = runtime.objects.TutorialScreen.getFirstInstance()!;
	water = runtime.objects.Water.getFirstInstance()!;

	// Set starting position.
	cursor.setPosition(400, 400);
	cursor.zElevation = 345;

	// Setup camera.
	setCamera3D();

	// Setup terrain.
	terrain.setFixedResolutionMode(terrain.width, terrain.height)
	terrain.createMesh(RESX, RESY);
	gridSize.width = terrain.width / RESX;
	gridSize.height = terrain.width / RESY;
	bRadius = 1000;
	startingTerrainElevation();
	updateTerrainElevation(50);
	updateTerrainColor();
	bRadius = 10;

	// Setup UI.
	pickerUI.isVisible = false;

	// Setup instances.
	radius.setSize(
		gridSize.width * bRadius * 2,
		gridSize.height * bRadius * 2
	);

	// Create a canvas to request mouse lock.
	mouseLocker = document.createElement("canvas");
	document.body.appendChild(mouseLocker);

	// Event listeners.
	runtime.addEventListener("keydown", e => onKeyDown(e));
	runtime.addEventListener("keyup", e => onKeyUp(e));
	runtime.addEventListener("mousedown", e => onMouseDown(e));
	runtime.addEventListener("mouseup", e => onMouseUp(e));
	runtime.addEventListener("mousemove", e => onMouseMove(e));
	runtime.addEventListener("wheel", e => onMouseWheel(e));
	runtime.addEventListener("tick", () => onTick());
}

// =============================================================================
// Keyboard events.
// =============================================================================

function onKeyDown(e: KeyboardEvent) {
	// Process "on key down" events.

	// Show object picker UI.
	if (e.code == "Space") {
		// Automatically change to place tool for convenience.
		tool = "place";

		// Set cursor animation to current picked object.
		cursorIconTex.setAnimation(pickedObj);

		// Show object picker UI.
		pickerUI.isVisible = true;

		// Unlock the mouse so that the user can pick an object.
		document.exitPointerLock();
	}
}

function onKeyUp(e: KeyboardEvent) {
	// Process "on key up" events.

	// Tool selection (only works if picker UI is invisible).
	if (!pickerUI.isVisible) {
		switch (e.code) {
			case "Digit1":
				tool = "sculpt";
				cursorIconTex.setAnimation("Sculpt");
				break;
			case "Digit2":
				tool = "smoothen";
				cursorIconTex.setAnimation("Smoothen");
				break;
			case "Digit3":
				tool = "place";
				cursorIconTex.setAnimation(pickedObj);
				break;
			case "Digit0":
				for (const wall of walls) {
					wall.isVisible = !radius.isVisible;
				}
				cursorPole.isVisible = !radius.isVisible
				cursorIcon.isVisible = !radius.isVisible;
				radius.isVisible = !radius.isVisible;
				break;
		}
	}

	// Action to hide object picker.
	if (e.code == "Space") {
		// Hide UI.
		pickerUI.isVisible = false;

		// Lock the mouse to move in-game cursor.
		mouseLocker.requestPointerLock();
	}

	// Action to show/hide the tutorial/help screen.
	if (e.code == "Enter") {
		tutoScr.isVisible = !tutoScr.isVisible;
	}
}

function getKeyboardInputs() {
	// Process continuous keyboard inputs.

	// Directional inputs.
	const inputRight = +keyboard.isKeyDown("KeyD");
	const inputLeft = +keyboard.isKeyDown("KeyA");
	const inputUp = +keyboard.isKeyDown("KeyW");
	const inputDown = +keyboard.isKeyDown("KeyS");

	// Modifier input.
	shiftDown = keyboard.isKeyDown("ShiftLeft")

	// Compute directional axes.
	const horizontalAxis = inputRight - inputLeft;
	const verticalAxis = inputUp - inputDown;

	// Update camera angle based on horizontal axis.
	camAngle -= horizontalAxis * CAM_ROT_SPD *
		60 * runtime.dt * (1 + +shiftDown);

	// Completed a full circle.
	if (Math.abs(camAngle) >= 2 * Math.PI) {
		camAngle = 0;
	}

	// Update camera height based on vertical axis.
	camHeight = clamp(
		camHeight + verticalAxis * CAM_ELEV_SPD *
		60 * runtime.dt * (1 + +shiftDown),
		200, 800
	);
}

// =============================================================================
// Mouse events.
// =============================================================================

function onMouseDown(e: MouseEvent) {
	// Process "on mouse down" events.

	// Get pressed mouse buttons.
	if (e.button == 0) lmbDown = e.button == 0;
	if (e.button == 2) rmbDown = e.button == 2;

	// Request mouse lock when the user clicks for the first time.
	if (
		document.pointerLockElement !== mouseLocker &&
		!pickerUI.isVisible
	) {
		mouseLocker.requestPointerLock();
	}
}

function onMouseUp(e: MouseEvent) {
	// Process "on mouse up" events.

	// Picker UI is visible, therefore process object selection.
	if (lmbDown && pickerUI.isVisible) {
		// Check which object is under the mouse pointer.
		for (const obj of objIcons) {
			if (mouseOverObj(obj, e)) {
				// Select this object and move selector for visual cue.
				pickedObj = obj.animationName;
				cursorIconTex.setAnimation(pickedObj);
				objSelector.setPosition(obj.x, obj.y);
			}
		}

	// Place picked object (remove is processed in processMouse function.)
	} else if (lmbDown && tool == "place") {
		// Calculate number of billboards to place according to brush radius.
		const nObj = bRadius * (1 + 2 * +shiftDown * +(bRadius > 15));

		// Get a random starting angle.
		const startingAngle = Math.random() * 2 * Math.PI;

		// Place nObj of the selected object.
		for (let i = 0; i < nObj; i++) {

			// Get new angle based on the randomized starting angle.
			const angle = startingAngle + i * 2 * Math.PI / bRadius;

			// Random radius with square root to ensure uniform distribution.
			const dist = Math.sqrt(Math.random()) * bRadius * gridSize.width;

			// Polar to Cartesian transformation.
			const posX = cursor.x + dist * Math.cos(angle);
			const posY = cursor.y + dist * Math.sin(angle);

			// Check for valid position.
			if (
				posX >= 0 && posX < terrain.width &&
				posY >= 0 && posY < terrain.height
			) {
				// Create the billboard.
				const b = billboard.createInstance(
					"Objects", posX, posY, true
				);

				// Set animation according to the picked object.
				(b.getChildAt(0) as ISpriteInstance).setAnimation(pickedObj);

				// Animals require specific orientations.
				if (pickedObj == "Giraffe") {
					b.height = 25.6 * (Math.random() < 0.5 ? -1 : 1);
				}
				if (pickedObj == "Elephant" || pickedObj == "Moose") {
					b.height = 25.6 * (Math.random() < 0.5 ? -1 : 1);
					b.zHeight = 16;
				}
			}
		}

	// Just update the color of the terrain.
	} else {
		updateTerrainColor();
	}

	// Get released mouse buttons.
	if (e.button == 0) lmbDown = false;
	if (e.button == 2) rmbDown = false;
}

function onMouseMove(e: MouseEvent) {
	// Move the in-game cursor.

	// Ignore cursor movement while the mouse is not locked.
	if (document.pointerLockElement !== mouseLocker) {
		return;
	}

	// Movement delta.
	const dx = e.movementX * SENS;
	const dy = e.movementY * SENS;

	// Sine and cosine of the camera angle.
	const sin = Math.sin(camAngle);
	const cos = Math.cos(camAngle);

	// Move the cursor according to deltas and camera angle.
	cursor.x += dx * sin + dy * cos;
	cursor.y -= dx * cos - dy * sin;
}

function onMouseWheel(e: WheelEvent) {
	// Process "mouse wheel" events.

	// Increment amount depends on the Shift state.
	const inc = shiftDown ? 5 : 1;

	// Increase/Decrease brush size.
	if (e.deltaY < 0) {
		bRadius = Math.min(bRadius + inc, MAX_BRUSH_RADIUS);
	} else {
		bRadius = Math.max(bRadius - inc, MIN_BRUSH_RADIUS);
	}

	// Update radius sprite size.
	radius.setSize(
		gridSize.width * bRadius * 2,
		gridSize.height * bRadius * 2
	);
}

function processMouse() {
	// Process continuous mouse input.

	// If UI is visible, ignore.
	if (pickerUI.isVisible) return;

	switch (tool) {
		// Sculpt tool.
		case "sculpt":
			const elev = +lmbDown - +rmbDown;
			updateTerrainElevation(elev);
			cursorIconTex.animationFrame = +(elev < 0);
			break;

		// Smoothen/roughen tool.
		case "smoothen":
			if (lmbDown) {
				smoothenTerrain();
				cursorIconTex.animationFrame = 0;
			} else if (rmbDown) {
				roughenTerrain();
				cursorIconTex.animationFrame = 1;
			} else {
				cursorIconTex.animationFrame = 0;
			}
			break;
		
		// Place/remove tool (place is processed in onMouseUp function.)
		case "place":
			// Remove objects inside brush radius.
			if (rmbDown) {
				billboard.getAllInstances().forEach(
					b => b.testOverlap(radius) && b.destroy()
				);
			}
			break;
	}
}

// =============================================================================
// Ticking.
// =============================================================================

function onTick() {
	// Code to run every tick.

	processMouse();
	setCamera3D();
	getKeyboardInputs();

	// Update water image offset.
	water.imageOffsetX += water.behaviors.SineH.value;
	water.imageOffsetY += water.behaviors.SineV.value;

	// Update cursor z-Elevation.
	cursor.zElevation = bicubic(
		cursor.x / gridSize.width, cursor.y / gridSize.height
	);

	// Update cursor icon angle to face the camera.
	cursorIcon.angle = camAngle;

	// Update billboards Z-Elevation and angle to face the camera.
	for (const b of billboard.getAllInstances()) {
		b.zElevation = bicubic(b.x / gridSize.width, b.y / gridSize.height);
		b.angle = camAngle;
	}
}

function setCamera3D() {
	// Set camera position and angle.

	// Compute camera position and angle.
	const camPos: [number, number, number] = [
		400 + Math.cos(camAngle) * CAM_DIST,
		400 + Math.sin(camAngle) * CAM_DIST,
		camHeight
	];

	// Apply camera settings.
	camera.lookAtPosition(...camPos, 400, 400, 0, 0, 0, 1);
}

// =============================================================================
// Terrain operations.
// =============================================================================

function startingTerrainElevation() {
	// Generate starting terrain elevation.

	// Terrain generation function.
	const terrainGen = (x: number, y: number) =>
		Math.sin(x * 0.1) * Math.sin(y * 0.1) * 10 +
		Math.sin(x * 0.2 + y * 0.3) * 5 +
		Math.sin(x * 0.5) * Math.cos(y * 0.4) * 2;

	// Apply function to mesh points.
	for (let i = 0; i < terrainGrid.length; i++) {
		for (let j = 0; j < terrainGrid[0].length; j++) {
			terrainGrid[i][j] = terrainGen(i, j) * 0.75 + 40;
		}
	}
}

function updateTerrainElevation(tElev: number) {
	// Update terrain elevation according to inputs.

	// If no terrain elevation is being changed, return.
	if (tElev == 0) return;

	// Compute mesh points inside the brush.
	const points = pointsInsideBrush();

	// Sculpt terrain around the cursor.
	for (const p of points) {
		const tx = p[0];
		const ty = p[1];

		/* Compute a "falloff", so that the hardness of the adjustment decays
		 * for points farther away from the cursor */
		const dx = tx - cursor.x / gridSize.width;
		const dy = ty - cursor.y / gridSize.height;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const normDist = Math.min(dist / bRadius, 1);
		const falloff = 1 - (normDist) ** 2 * (3 - 2 * normDist);

		// Compute new elevation.
		let zElev = terrainGrid[tx][ty];
		zElev += tElev * T_ELEV_SPD * runtime.dt *
			(1 + 2 * +shiftDown) * falloff;
		zElev = clamp(zElev, 0, 100);

		// Apply new elevation.
		terrain.setMeshPoint(tx, ty, {
			mode: "relative", x: 0, y: 0, u: 0, v: 0,
			zElevation: zElev
		});

		// Store in terrainGrid.
		terrainGrid[tx][ty] = zElev;
	}
}

function updateTerrainColor() {
	// Update terrain color according to elevation.

	// Create empty image data.
	const imgData = new ImageData(terrain.width, terrain.height);

	for (let i = 0; i < terrain.width; i++) {
		for (let j = 0; j < terrain.height; j++) {

			// Compute (x, y) mesh point.
			const x = i / gridSize.width;
			const y = j / gridSize.height;

			// Interpolate height for current pixel plus noise.
			const h = bicubic(x, y)! + rnd(19 * x * 61 * y) * 10;

			// Calculate pixel color based on its height.
			let r, g, b;

			// Peak (stone).
			if (h > 95) {
				r = lerp(h, 95, 100, 95, 114);
				g = lerp(h, 95, 100, 87, 105);
				b = lerp(h, 95, 100, 79, 95);

				// Mountain (grass to stone).
			} else if (h > 80) {
				r = lerp(h, 80, 95, 34, 95);
				g = lerp(h, 80, 95, 70, 87);
				b = lerp(h, 80, 95, 45, 79);

				// Field (grass).
			} else if (h > 25) {
				r = lerp(h, 25, 80, 80, 34);
				g = lerp(h, 25, 80, 130, 70);
				b = lerp(h, 25, 80, 87, 45);

				// Basin (sand to grass).
			} else if (h > 8) {
				r = lerp(h, 8, 25, 206, 80);
				g = lerp(h, 8, 25, 183, 130);
				b = lerp(h, 8, 25, 119, 87);

				// Water level (sand).
			} else {
				[r, g, b] = [206, 183, 119];
			}

			// Build color.	
			const color = [r, g, b, 255];

			// Set (r, g, b, a).
			for (let p = 0; p < 4; p++) {
				imgData.data[4 * (imgData.width * j + i) + p] = color[p];
			}
		}
	}

	// Load image data into terrain.
	terrain.loadImagePixelData(imgData);
}

function bicubic(x: number, y: number) {
	// Perform bicubic interpolation to find Z for an arbitrary (x, y) point.

	const i = Math.floor(x);
	const j = Math.floor(y);
	const values = [];

	// Get 4x4 neighborhood around (i, j).
	for (let m = -1; m <= 2; m++) {
		const row = [];
		for (let n = -1; n <= 2; n++) {
			const xi = clamp(i + m, 0, terrainGrid.length - 1);
			const yj = clamp(j + n, 0, terrainGrid[0].length - 1);
			row.push(terrainGrid[xi][yj]);
		}
		// Interpolate each row horizontally.
		const val = cubic(row[0], row[1], row[2], row[3], y - j);
		values.push(val);
	}

	// Interpolate final result vertically.
	return cubic(values[0], values[1], values[2], values[3], x - i);
}

function smoothenTerrain() {
	// Smoothen terrain by blurring the elevations inside the brush.

	// Get mesh points inside the brush.
	const points = pointsInsideBrush();

	// Collect values in the blur area.
	let sum = 0;
	let count = 0;
	for (const p of points) {
		sum += terrainGrid[p[0]][p[1]];
		count++;
	}

	// Compute average avoiding division by zero.
	if (count == 0) return;
	const avg = sum / count;

	// Apply the blur to the area.
	for (const p of points) {

		// Compute new, smoothened, elevation.
		let newElev;
		if (shiftDown) {
			newElev = (avg + terrainGrid[p[0]][p[1]]) / 2;
		} else {
			newElev = (avg + 19 * terrainGrid[p[0]][p[1]]) / 20;
		}

		// Lerp between elevations.
		terrainGrid[p[0]][p[1]] = lerp(
			runtime.dt * 60, 0, 1, terrainGrid[p[0]][p[1]], newElev
		);

		// Apply elevation.
		terrain.setMeshPoint(p[0], p[1], {
			mode: "relative", x: 0, y: 0, u: 0, v: 0,
			zElevation: terrainGrid[p[0]][p[1]]
		});
	}
}

function roughenTerrain() {
	// Apply randomized elevation changes inside the brush radius.

	// Get mesh points inside the brush.
	const points = pointsInsideBrush();

	// Randomize area elevation.
	for (const p of points) {

		// Get randomized noise.
		const r = shiftDown ? Math.random() * 8 - 4 : Math.random() * 2 - 1;

		// Compute new elevation.
		const newElev = clamp(
			terrainGrid[p[0]][p[1]] + r * 60 * runtime.dt, -100, 100
		);

		// Apply elevation.
		terrainGrid[p[0]][p[1]] = newElev;
		terrain.setMeshPoint(p[0], p[1], {
			mode: "relative", x: 0, y: 0, u: 0, v: 0,
			zElevation: newElev
		});
	}
}

// =============================================================================
// Misc.
// =============================================================================


function pointsInsideBrush() {
	// Return mesh points inside the brush.

	const x = cursor.x / gridSize.width;
	const y = cursor.y / gridSize.height;
	const r = bRadius;

	const points = [];

	for (let i = Math.ceil(x - r); i <= Math.floor(x + r); i++) {
		for (let j = Math.ceil(y - r); j <= Math.floor(y + r); j++) {
			const dx = i - x;
			const dy = j - y;
			if (dx * dx + dy * dy <= r * r) {
				// If point is within bounds, add it to the points array.
				if (i > 0 && i < RESX && j > 0 && j < RESY) {
					points.push([i, j]);
				}
			}
		}
	}

	return points;
}

function mouseOverObj(c: any, e: MouseEvent) {
	// Check if mouse pointer is over a given object.

	return c.containsPoint(
		...runtime.layout.getLayer("UI")!
			.cssPxToLayer(e.clientX, e.clientY)
	)
}