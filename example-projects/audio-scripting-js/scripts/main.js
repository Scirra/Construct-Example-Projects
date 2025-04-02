
import AudioManager from "./audioManager.js";

// Audio manager class for handling audio playback.
let audioManager = null;

// References to loaded audio files as global variables
let audioSfx5 = null;
let audioSfx7 = null;
let audioEpicArpg = null;

runOnStartup(async runtime =>
{
	// Initialise the audio manager. See AudioManager.js for details.
	audioManager = new AudioManager(runtime);
	
	// During the loading screen, load both sound files as
	// AudioBuffers and the music track all in parallel, so
	// they are ready for immediate playback on startup.
	[audioSfx5, audioSfx7, audioEpicArpg] = await Promise.all([
		audioManager.loadSound("sfx5.webm"),
		audioManager.loadSound("sfx7.webm"),
		audioManager.loadMusic("epicArpg.webm")
	]);
});

// These functions are called by the button click events.
export function PlaySfx5()
{
	audioManager.playSound(audioSfx5);
}

export function PlaySfx7()
{
	audioManager.playSound(audioSfx7);
}

export function PlayMusic()
{
	audioManager.playMusic(audioEpicArpg);
}