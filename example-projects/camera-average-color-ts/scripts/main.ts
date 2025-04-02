
import Globals from "./globals.js";

runOnStartup(async runtime =>
{
	// On startup, insert the video element to the document, and
	// position it in the top-left of the page so it appears on-screen.
	const videoElem = Globals.videoElem;
	document.body.appendChild(videoElem);
	videoElem.style.position = "absolute";
	videoElem.style.left = "0px";
	videoElem.style.top = "0px";
	
	// Note only setting the width will proportionately resize the video
	// down to show a 320px sized thumbnail, rather than taking up the full
	// size of the video, which could take up the whole screen.
	videoElem.style.width = "320px";
	
	// Get Construct object instances in this event
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime: IRuntime)
{
	// Retrieve Construct object instances so they can be
	// updated from script conveniently
	Globals.statusTextInstance = runtime.objects.StatusText.getFirstInstance();
	Globals.averageColorTextInstance = runtime.objects.AverageColorText.getFirstInstance();
	Globals.averageColorSpriteInstance = runtime.objects.AverageColorSprite.getFirstInstance();
}
