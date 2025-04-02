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

// Import Player class
import Player from "./player.js";

const MAXPOINTS = 20; // Maximum amount of points before a restart
const WAITTIME = 500; // Time (ms) to wait before a rematch

// These variables store object instances that are referenced later.
let keyboard;
let tutorialText;

let player1;
let player1Sprite;
let player1SpriteLegs;
let player1Score;
let player1Spawn;
let player1Glove;

let player2;
let player2Sprite;
let player2SpriteLegs;
let player2Score;
let player2Spawn;
let player2Glove;

// List of object instances
let spotlights;

// Gameplay variables
let canFight; // Can the players fight?
let tickEnabled; // Should the game run?

runOnStartup(async runtime => {
	// Code to run on the loading screen.
	
	runtime.addEventListener(
		"beforeprojectstart", () => onBeforeProjectStart(runtime)
	);
});

async function onBeforeProjectStart(runtime) {
	// Code to run just before 'On start of layout'
	
	keyboard = runtime.keyboard;
	
	let p1head, p2head, p1body, p2body, p1armL, p1armR, p2armL, p2armR;
	
	// Get heads
	for (const h of runtime.objects.PlayerHead.getAllInstances()) {
		if (h.instVars.whooseHead == "PlayerOne") p1head = h;
		else p2head = h;
	}
	// Get bodies
	for (const b of runtime.objects.PlayerBody.getAllInstances()) {
		if (b.instVars.whooseBody == "PlayerOne") p1body = b;
		else p2body = b;
	}
	// Get arms
	for (const a of runtime.objects.PlayerArm.getAllInstances()) {
		if (a.instVars.whichArm == "PlayerOneLeft") p1armL = a;
		else if (a.instVars.whichArm == "PlayerOneRight") p1armR = a;
		else if (a.instVars.whichArm == "PlayerTwoLeft") p2armL = a;
		else p2armR = a;
	}
	
	// Get player sprites
	player1Sprite = runtime.objects.PlayerOneSprite.getFirstInstance();
	player1SpriteLegs = runtime.objects.PlayerOneSpriteLegs.getFirstInstance();
	player2Sprite = runtime.objects.PlayerTwoSprite.getFirstInstance();
	player2SpriteLegs = runtime.objects.PlayerTwoSpriteLegs.getFirstInstance();
	
	
	// Create logical player objects of type Player
	player1 = new Player(
		p1body, p1head, p1armL, p1armR, player1Sprite, player1SpriteLegs,
		"KeyW", "KeyS", "KeyA", "KeyD", "Space"
	)
	player2 = new Player(
		p2body, p2head, p2armL, p2armR, player2Sprite, player2SpriteLegs,
		"ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"
	)
	
	// Get object instances
	player1Score = runtime.objects.PlayerOneScore.getFirstInstance();
	player2Score = runtime.objects.PlayerTwoScore.getFirstInstance();
	player1Spawn = runtime.objects.PlayerOneSpawn.getFirstInstance();
	player2Spawn = runtime.objects.PlayerTwoSpawn.getFirstInstance();
	player1Glove = runtime.objects.PlayerOneGlove.getFirstInstance();
	player2Glove = runtime.objects.PlayerTwoGlove.getFirstInstance();
	tutorialText = runtime.objects.TutorialText.getFirstInstance();
	
	// Get list of object instances
	spotlights = runtime.objects.Spotlight.getAllInstances();
	
	// Assign initial values to variables
	canFight = false;
	tickEnabled = true;

	// Start ticking
	runtime.addEventListener("tick", () => onTick(runtime));
}

function onTick(runtime) {
	// Code to run every tick
	
	if (!tickEnabled) return; // If the match has not begun, ignore
	
	// Hide tutorial and start fight
	hideTutorial();
	
	// Get inputs from players, if they can fight
	if (canFight) {
		player1.getInput(runtime, keyboard, canFight, player2);
		player2.getInput(runtime, keyboard, canFight, player1);
	}
	
	// Make them always face each other
	playersFaceEachOther();
	
	// Animate spotlights
	animateSpotlights();
	
	// Update scores when a player succeeded hitting the other
	const p1Success = player1.checkHit(player2);
	const p2Success = player2.checkHit(player1);
	updateScores(p1Success, p2Success);
}

function hideTutorial() {
	// If the tutorial is visible, hide it and start the fight.
	
	 // If fight is already happening, ignore
	if (tutorialText.opacity < 1) return;
	
	if (keyboard.isKeyDown("Space") || keyboard.isKeyDown("Enter")) {
		// Reset positions
		player1.body.x = player1Spawn.x;
		player1.body.y = player1Spawn.y;
		player2.body.x = player2Spawn.x;
		player2.body.y = player2Spawn.y;
		
		// Wait a little before being able to punch
		setTimeout(() => canFight = true, WAITTIME/5);
		
		// Hide text
		tutorialText.behaviors.Fade.fadeInTime = 0;
        tutorialText.behaviors.Fade.fadeOutTime = 0.25;
        tutorialText.behaviors.Fade.startFade();
	}
}

function playersFaceEachOther() {
	// Make players always face each other in the X axis
	if (player1.body.x < player2.body.x) {
		player1.body.angle = 0;
		player2.body.angle = Math.PI;
	} else {
		player1.body.angle = Math.PI;
		player2.body.angle = 0;
	}
}

function updateScores(p1Success, p2Success) {
	// Update players scores and check for a winner
	
	if (!canFight) return; // If players cannot fight, ignore
	
	// Update scores and rescale gloves for a cool effect
	if (p1Success) {
		player1Score.text = "x" + (+player1Score.text.substring(1) + 1);
		player1Glove.behaviors.Tween.startTween(
			"scale", [1.2, 1.2], 0.1, "in-out-sine", {pingPong: true}
		);
	}
	if (p2Success) {
		player2Score.text = "x" + (+player2Score.text.substring(1) + 1);
		player2Glove.behaviors.Tween.startTween(
			"scale", [1.2, 1.2], 0.1, "in-out-sine", {pingPong: true}
		);
	}
	
	// Check for a winner
	if (player1Score.text == "x" + MAXPOINTS.toString()) playerWon("1");
	if (player2Score.text == "x" + MAXPOINTS.toString()) playerWon("2");
}

function playerWon(pNo) {
	// Show who won the match and wait for restart
	
	// Fade message that shows who won
	const message = "Player " + pNo + " won.\nPress Space or Enter to Rematch"
	tutorialText.text = message;
	tutorialText.behaviors.Fade.fadeInTime = 0.5;
	tutorialText.behaviors.Fade.fadeOutTime = 0;
	tutorialText.behaviors.Fade.startFade();
	
	// Disable fighting and ticking
	canFight = false;
	tickEnabled = false;
	
	// Reset score text
	player1Score.text = "x0";
	player2Score.text = "x0";
	
	// Wait a little before the game can be restarted
	setTimeout(() => tickEnabled = true, WAITTIME);
}

function animateSpotlights() {
	// Animate spotlights according to their variables and sine behaviors
	for (const s of spotlights) {
		s.x = s.instVars.initialX + Math.cos(
			s.instVars.lookingAngle + s.behaviors.Sine.value
		) * s.instVars.distance;
		
		s.y = s.instVars.initialY + Math.sin(
			s.instVars.lookingAngle + s.behaviors.Sine.value
		) * s.instVars.distance;
	}
}