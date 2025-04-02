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
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instances
let sliderAttack;
let sliderRelease;
let sliderGain;
let sliderRailAttack;
let sliderRailRelease;
let sliderRailGain;
let octaveMinus;
let octavePlus;
let textOct;
let fader;

// List of instances
let keyButtons;
let waveformButtons;
let pointerDeleters;

// Object interfaces;
let pointer;

// Global objects
let audioContext;
let keyboard;

// Logic variables
let oscillators = {}; // All oscillators being played
let kbMap = {}; // Map between key names and note IDs
let wvMap = {}; // Map between digits and waveform names
let waveform = "sine"; // Current waveform being used
let globalGain = 0.25; // Notes gain (volume)
let attack = 0.01; // Notes attack (how fast the note fades to max volume)
let release = 0.01; // Notes release (how slow the note fades to 0 volume)
let octave = 4; // Notes octave
let keysDown = {}; // Which PC keyboard keys are down
let pointerMap = new Map(); // All pointers are stored here

// settings
const MAX_ATTACK = 1.0; // Maximum attack time
const MAX_RELEASE = 1.0; // Maximum release time
const MAX_GAIN = 0.25; // Maximum gain (high values will cause distortion)
const MIN_OCT = 1; // Minimum octave
const MAX_OCT = 7; // Maximum octave

runOnStartup(async runtime => {
	// Code to run on the loading screen
	
	runtime.addEventListener(
		"beforeprojectstart", () => onBeforeProjectStart(runtime)
	);
});

async function onBeforeProjectStart(runtime) {
	// Code to run just before 'On start of layout'
	
	// Get instances
	sliderAttack = runtime.objects.SliderAttack.getFirstInstance();
	sliderRelease = runtime.objects.SliderRelease.getFirstInstance();
	sliderGain = runtime.objects.SliderGain.getFirstInstance();
	sliderRailAttack = runtime.objects.SliderRailAttack.getFirstInstance();
	sliderRailRelease = runtime.objects.SliderRailRelease.getFirstInstance();
	sliderRailGain = runtime.objects.SliderRailGain.getFirstInstance();
	octaveMinus = runtime.objects.OctaveMinus.getFirstInstance();
	octavePlus = runtime.objects.OctavePlus.getFirstInstance();
	textOct = runtime.objects.TextOct.getFirstInstance();
	fader = runtime.objects.Fader.getFirstInstance();
	
	// Get list of instances
	keyButtons = runtime.objects.Key.getAllInstances();
	waveformButtons = runtime.objects.Waveform.getAllInstances();
	pointerDeleters = runtime.objects.PointerDeleter.getAllInstances();
	
	// Get object interfaces
	pointer = runtime.objects.Pointer;
	
	// Get global objects
	const audioObject = runtime.objects.Audio;
	audioContext = audioObject.audioContext;
	keyboard = runtime.keyboard;
	
	// Map keyboard keys to note IDs
	const keySet = "ZSXCFVGBNJMK".split("")
	                             .map(i => "Key" + i)
								 .concat(["Comma"]);
								 
	for (const [i, e] of keySet.entries()) {
		kbMap[e] = i + 1;
	}
	
	// Map digits to waveform buttons
	const wvSet = ["sine", "square", "triangle", "sawtooth"];
	
	for (const [i, e] of wvSet.entries()) {
		wvMap[i + 1] = e;
	}
	
	// Start ticking
	runtime.addEventListener("tick", () => onTick(runtime));
	
	// Keyboard events
	runtime.addEventListener("keydown", e => onKeyDown(e));
	runtime.addEventListener("keyup", e => onKeyUp(e));
	
	// Pointer (mouse/touch) events
	runtime.addEventListener("pointerdown", e => onPointerDown(e, runtime));
	runtime.addEventListener("pointerup", e => onPointerUp(e));
	runtime.addEventListener("pointercancel", e => onPointerUp(e));
	runtime.addEventListener("pointermove", e => onPointerMove(e, runtime));
}

function onKeyDown(e) {
	// Process key down
	
	// Hide tutorial
	if (fader.opacity == 0.95) {
		fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
		return;
	}
	
	// If touch is being used, ignore.
	if (pointerMap.size > 0) {
		return;
	}
	
	// Mark key as pressed
	keysDown[e.key] = true;

	// Select waveform
	for (const wv of waveformButtons) {
		if (e.key in wvMap) {
			if (wvMap[e.key] == wv.animationName) {
				wv.animationFrame = 1;
				waveform = wv.animationName;
			} else {
				wv.animationFrame = 0;
			}
			stopAll();
		}
	}
	
	// Decrease octave
	if (e.key == "ArrowLeft") {
		octaveMinus.animationFrame = 1;
		octave = Math.max(octave - 1, MIN_OCT);
		textOct.text = octave.toString();
		stopAll();
	}
	
	// Increase octave
	if (e.key == "ArrowRight") {
		octavePlus.animationFrame = 1;
		octave = Math.min(octave + 1, MAX_OCT);
		textOct.text = octave.toString();
		stopAll();
	}
}

function onKeyUp(e) {
	// Process key up
	
	// Mark key as released
	keysDown[e.key] = false;

	// Release decrease octave button
	if (e.key == "ArrowLeft") {
		octaveMinus.animationFrame = 0;
	}
	
	// Release increase octave button
	if (e.key == "ArrowRight") {
		octavePlus.animationFrame = 0;
	}
}

function getPointerLayerPos(e, runtime) {
	// Return layer position of the pointer, given its client position

	return runtime.layout.getLayer(0).cssPxToLayer(e.clientX, e.clientY);
}

function onPointerDown(e, runtime) {
	// Create pointer object
	
	// Hide tutorial
	if (fader.opacity == 0.95) {
		fader.behaviors.Tween.startTween("opacity", 0, 0.5, "in-out-sine");
		return;
	}
	
	// Get layer coordinates, based on client coordinates
	const [x, y] = getPointerLayerPos(e, runtime);
	
	// Create the object itself and make it invisible
	const p = pointer.createInstance("Synth", x, y);
	p.instVars.pointerId = e.pointerId;
	p.isVisible = false;
	
	// Set its pointerID as the current touch pointerID
	pointerMap.set(e.pointerId, p);
}

function onPointerUp(e) {
	// Destroy pointer object

	// Pick correct pointer object
	const p = pointerMap.get(e.pointerId);
	
	// If no pointer object was found, ignore
	if (!p) return;
	
	// Destroy and delete it from pointer map
	p.destroy();
	pointerMap.delete(e.pointerId);
}

function onPointerMove(e, runtime) {
	// Move pointer object
	
	// Pick correct pointer object
	const p = pointerMap.get(e.pointerId);
	
	// If no pointer object was found, ignore
	if (!p) return;
	
	// Get layer coordinates, based on client coordinates
	const [x, y] = getPointerLayerPos(e, runtime);
	
	// Apply coordinates to pointer object
	p.setPosition(x, y);
}

function onTick(runtime) {
	// Code to run every tick
	
	// Clear keys down when the window loses focus
	if (!document.hasFocus()) {
		keysDown = [];
	}
	
	// Delete pointers when they go through pointerDeleters
	for (const p of pointer.getAllInstances()) {
		for (const d of pointerDeleters) {
			if (p.testOverlap(d)) {
				pointerMap.delete(p.instVars.pointerId);
				p.destroy();
			}
		}
	}
	
	// Switch between pointer and keyboard processing
	if (!Object.values(keysDown).includes(true)) {
		processTouchInputs();
	} else {
		processKeyPresses(runtime);
	}
}

function processKeyPresses(runtime) {
	// Process key presses

	for (const k of Object.keys(kbMap)) {
		// Check for key pressed
		if (keyboard.isKeyDown(k)) {
			// Set key as pressed and play sound
			play(getFrequency(kbMap[k] + octave * 12), waveform);
			for (const ke of keyButtons) {
				if (ke.animationName == k) {
					ke.animationFrame = 1;
				}
			}
		// Check for key released
		} else {
			// Set key as released and stop sound
			stop(getFrequency(kbMap[k] + octave * 12));
			for (const ke of keyButtons) {
				if (ke.animationName == k) {
					ke.animationFrame = 0;
				}
			}
		}
	}
	
	// Increase gain
	if (keyboard.isKeyDown("ArrowUp")) {
		globalGain = Math.min(globalGain + 0.5 * runtime.dt, MAX_GAIN);
		sliderGain.y = lerp(0.0, MAX_GAIN, 56, 24, globalGain);
	}
	
	// Decrease gain
	if (keyboard.isKeyDown("ArrowDown")) {
		globalGain = Math.max(globalGain - 0.5 * runtime.dt, 0);
		sliderGain.y = lerp(0.0, MAX_GAIN, 56, 24, globalGain);
	}
	
	// Decrease attack
	if (keyboard.isKeyDown("KeyQ")) {
		attack = Math.max(attack - runtime.dt, 0.01);
		sliderAttack.x = lerp(0.01, MAX_ATTACK, 128, 192, attack);
	}
	
	// Increase attack
	if (keyboard.isKeyDown("KeyW")) {
		attack = Math.min(attack + runtime.dt, MAX_ATTACK);
		sliderAttack.x = lerp(0.01, MAX_ATTACK, 128, 192, attack);
	}
	
	// Decrease release
	if (keyboard.isKeyDown("KeyR")) {
		release = Math.max(release - runtime.dt, 0.01);
		sliderRelease.x = lerp(0.01, MAX_RELEASE, 128, 192, release);
	}
	
	// Increase release
	if (keyboard.isKeyDown("KeyT")) {
		release = Math.min(release + runtime.dt, MAX_ATTACK);
		sliderRelease.x = lerp(0.01, MAX_RELEASE, 128, 192, release);
	}
}

function pointerOnTop(other) {
	// Check if a pointer is on top of an object
	
	for (const p of pointer.getAllInstances()) {
		if (p.testOverlap(other)) {
			return p;
		}
	}
	return null;
}

function processTouchInputs() {
	// Process touchscreen inputs
	
	// Play a key
	for (const ke of keyButtons) {
		// Set key as pressed and play sound
		if (pointerOnTop(ke)) {
			play(getFrequency(kbMap[ke.animationName] + octave*12), waveform);
			ke.animationFrame = 1;	
		// Set key as released and stop sound
		} else if (!Object.values(keysDown).includes(true)){
			stop(getFrequency(kbMap[ke.animationName] + octave * 12))
			ke.animationFrame = 0;
		}
	}
	
	// Change attack
	let p = pointerOnTop(sliderRailAttack);
	if (p) {
		attack = lerp(128, 192, 0.01, MAX_ATTACK, (sliderAttack.x = p.x));
	}
	
	// Change release
	p = pointerOnTop(sliderRailRelease);
	if (p) {
		release = lerp(128, 192, 0.01, MAX_RELEASE, (sliderRelease.x = p.x));
	}
	
	// Change gain
	p = pointerOnTop(sliderRailGain);
	if (p) {
		globalGain = lerp(56, 24, 0.0, MAX_GAIN, (sliderGain.y = p.y));
	}
	
	// Select waveform
	for (const wv of waveformButtons) {
		if (p = pointerOnTop(wv)) {
			wv.animationFrame = 1;
			waveform = wv.animationName;
			pointerMap.delete(p.instVars.pointerId);
			p.destroy();
		} else if (wv.animationName != waveform) {
			wv.animationFrame = 0;
		}
	}
	
	// Decrease octave
	if (p = pointerOnTop(octaveMinus)) {
		// Only execute action, if button is not being held
		if (octaveMinus.animationFrame == 0) {
			octave = Math.max(octave - 1, MIN_OCT);
			textOct.text = octave.toString();
			stopAll();
		}
		octaveMinus.animationFrame = 1;
	} else {
		octaveMinus.animationFrame = 0;
	}
	
	// Increase octave
	if (p = pointerOnTop(octavePlus)) {
		// Only execute action, if button is not being held
		if (octavePlus.animationFrame == 0) {
			octave = Math.min(octave + 1, MAX_OCT);
			textOct.text = octave.toString();
			stopAll();
		}
		octavePlus.animationFrame = 1;
	} else {
		octavePlus.animationFrame = 0;
	}
}


function createOscillator(frequency, waveform) {
	// Create a new oscillator to play a note

	// Create oscillator and gain nodes
	const oscillator = audioContext.createOscillator();
	const gain = audioContext.createGain();
	
	// Set oscillator type and frequency
	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
	
	// Connect oscillator node to gain node
	oscillator.connect(gain);
	
	// Connect gain node to destination (output) node
	gain.connect(audioContext.destination);
	
	// Set gain node initial value and lerp to wanted value
	gain.gain.setValueAtTime(0, audioContext.currentTime);
	gain.gain.linearRampToValueAtTime(
		globalGain, audioContext.currentTime + attack
	);
	
	// Start the oscillator
	oscillator.start();
	
	// Return oscillator and gain nodes
	return [oscillator, gain];
}

function play(freq, waveStr) {
	// Play a frequency, if it doesn't exist yet

	if (!oscillators[freq]) {
		oscillators[freq] = createOscillator(freq, waveStr);
	}
}

function stop(freq) {
	// Stop a frequency, if it exists

	// Check if there is a frequency playing
	if (oscillators[freq]) {
	
		// Get this frequency oscillator nodes
		const [oscillator, gain] = oscillators[freq];
		
		// Lerp to 0 gain (volume)
		gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime);
		gain.gain.linearRampToValueAtTime(
			0, audioContext.currentTime + release
		);
		
		// Stop the oscillator after release time
		oscillator.stop(audioContext.currentTime + release);
		
		// Delete it from the oscillators array
		delete oscillators[freq];
	}
}

function stopAll() {
	// Stop all frequencies currently playing

	for (const freq in oscillators) {
		stop(freq);
	}
}

function getFrequency(n) {
	// Get frequency of key N, where N=49 is A (La) at 440Hz
	
	return Math.pow(2, (n-49)/12) * 440;
}

function lerp(x0, x1, y0, y1, x) {
	// Auxiliary linear interpolation function

	return (y1 - y0)/(x1 - x0) * (x - x0) + y0;
}