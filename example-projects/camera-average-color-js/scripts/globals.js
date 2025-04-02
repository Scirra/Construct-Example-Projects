
// Global variables: create a <video> element, and a 2D canvas context
// for getting pixel data from the video
const tempCanvas = document.createElement("canvas");

const Globals = {
	videoElem: document.createElement("video"),
	tempCanvas,
	tempCtx: tempCanvas.getContext("2d"),

	// Global variables referring to Construct object instances
	statusTextInstance: null,
	averageColorTextInstance: null,
	averageColorSpriteInstance: null
};

export default Globals;
