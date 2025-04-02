
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Get the AudioContext from the Audio object.
	const audioContext = runtime.objects.Audio.audioContext;
	
	// Load audioWorklet.js - note this is in the Files folder as it's loaded separately
	// to all other modules.
	await audioContext.audioWorklet.addModule("audioWorklet.js");
	
	// Create the noise generator worklet node and connect it to the audio output.
	const noiseGeneratorNode = new AudioWorkletNode(audioContext, 'noise-generator');
	noiseGeneratorNode.connect(audioContext.destination);
}
