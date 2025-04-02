
import * as YouTube from "./youTube.js";

runOnStartup(async runtime =>
{
	// On startup, wait for the YouTube API to load before continuing (see YouTube.js)
	await YouTube.LoadAPI();
	
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Before starting the project, create the YouTube player (see youTube.js).
	// The method accepts the ID of the iframe element and any
	// event handlers that you want to listen for in the YouTube player.
	// For the full reference on the YouTube API, see:
	// https://developers.google.com/youtube/iframe_api_reference
	// Also note:
	// - the iframe id is set with the ID property on the iframe object in Construct
	// - the iframe URL is set to an embed URL with enablejsapi=1 in the query string
	const stateTextInst = runtime.objects.StateText.getFirstInstance();
	
	const ytPlayer = await YouTube.CreatePlayer("youtubeIframe", {
		"onStateChange": e =>
		{
			// When the player state changes, show it in the StateText object.
			stateTextInst.text = "State: " + e.data;
		}
	});
	
	// Make the play, pause and volume controls affect video using the YouTube API.
	const playButtonInst = runtime.objects.Play.getFirstInstance();
	const pauseButtonInst = runtime.objects.Pause.getFirstInstance();
	const sliderBarInst = runtime.objects.SliderBar.getFirstInstance();
	
	playButtonInst.addEventListener("click", () => ytPlayer["playVideo"]());
	pauseButtonInst.addEventListener("click", () => ytPlayer["pauseVideo"]());
	sliderBarInst.addEventListener("change", () => ytPlayer["setVolume"](sliderBarInst.value));
}