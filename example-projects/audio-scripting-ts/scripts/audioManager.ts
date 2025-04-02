
// This class helps manage audio playback code. You may find it useful
// to re-use it in your own projects as well.
export default class AudioManager
{
	runtime: IRuntime;
	audioContext: AudioContext;

	constructor(runtime: IRuntime, contextOpts?: AudioContextOptions)
	{
		this.runtime = runtime;
		this.audioContext = new AudioContext(contextOpts);
	}
	
	// Load an AudioBuffer from a project file name e.g. "sfx5.webm".
	async loadSound(url: string)
	{
		// Note that media files, including sound and music, are
		// exported under a media folder, so add that to the URL.
		const audioUrl = this.runtime.assets.mediaFolder + url;

		// Ask the runtime to fetch the URL as an ArrayBuffer
		// for decoding.
		const arrayBuffer = await this.runtime.assets.fetchArrayBuffer(audioUrl);

		// Once the compressed audio data has been loaded as an
		// ArrayBuffer, decode it to an AudioBuffer ready for playback.
		const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

		return audioBuffer;
	}
	
	// Play an AudioBuffer.
	playSound(audioBuffer: AudioBuffer)
	{
		const source = this.audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(this.audioContext.destination);
		source.start(0);
	}
	
	// Load a music track. This uses the <audio> element instead of
	// Web Audio, because music tracks tend to be a lot longer,
	// and Web Audio can only play fully decompressed tracks, whereas
	// the <audio> element can stream tracks.
	async loadMusic(url: string)
	{
		// Create an <audio> element.
		const audioElem = new Audio();
		
		// Specify the src to load, similar to with loading sounds.
		audioElem.src = this.runtime.assets.mediaFolder + url;
		
		// Load the audio element, and wait for the canplaythrough event
		// to fire to indicate it's loaded enough to play to the end.
		audioElem.load();
		await this.waitForCanPlayThrough(audioElem);
		
		return audioElem;
	}
	
	// Helper method to return a promise that resolves when the
	// "canplaythrough" event fires, indicating it's ready for playback.
	// It also rejects if the error event fires.
	waitForCanPlayThrough(audioElem: HTMLAudioElement)
	{
		return new Promise((resolve, reject) =>
		{
			audioElem.addEventListener("canplaythrough", resolve);
			audioElem.addEventListener("error", reject);
		});
	}
	
	playMusic(audioElem: HTMLAudioElement)
	{
		// Use the play() method of HTMLMediaElement. It will start
		// streaming playback without fully decompressing the file.
		audioElem.play();
	}
}
