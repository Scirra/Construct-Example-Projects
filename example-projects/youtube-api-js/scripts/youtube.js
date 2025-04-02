
// Note for a full reference on the YouTube API, refer to the official documentation at:
// https://developers.google.com/youtube/iframe_api_reference

// Called on startup to load the YouTube API script.
// This method returns a promise so it can be conveniently awaited.
export function LoadAPI()
{
	// This code to add the script tag is taken from the YouTube API samples.
	const scriptTag = document.createElement("script");
	scriptTag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
	
	// Return a promise that resolves when the script finishes loading.
	// The YouTube script calls a global onYouTubeIframeAPIReady() function
	// when it has finished loading, so make that resolve the returned promise.
	return new Promise(resolve =>
	{
		globalThis["onYouTubeIframeAPIReady"] = resolve;
	});
}

// Create a YouTube player for a given iframe ID.
// Extra event handlers can optionally be provided too.
// This also returns a promise that resolves when onReady is called
// so it can be conveniently awaited.
export function CreatePlayer(iframeId, eventHandlers)
{
	return new Promise(resolve =>
	{
		if (!eventHandlers)
			eventHandlers = {};
		
		// Resolve the returned promise when the onReady callback runs.
		// Note the event target is the created YouTube player.
		eventHandlers["onReady"] = (e => resolve(e.target));
		
		// Create a new YT.Player object. This doesn't need to be stored
		// in a variable, since it will pass itself (via e.target)
		// when it has finished loading and runs the onReady callback.
		// Note the names use string properties on globalThis rather than
		// just using YT.Player for compatibility with advanced minification.
		new globalThis["YT"]["Player"](iframeId, {
			"events": eventHandlers
		});
	});
}
