
// Get to the "beforeprojectstart" event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Add a pointermove event handler on the runtime.
	// This will be called any time a mouse cursor or touch moves.
	runtime.addEventListener("pointermove", e => OnPointerMove(e, runtime));
}

function OnPointerMove(e, runtime)
{
	// Get layer 0, which is the only layer in the layout, which also
	// has our piggy instance on it.
	const layer = runtime.layout.getLayer(0);
	
	// The pointer position is given in 'client' co-ordinates, which are
	// in CSS pixels relative to the canvas. To get the corresponding position
	// on the layer, which takes in to account scrolling, scaling etc., the
	// client co-ordinates are passed to the layer's cssPxToLayer() method.
	// It returns an array with the result [x, y] position, and this can be
	// put in to two variables with destructuring syntax.
	const [layerX, layerY] = layer.cssPxToLayer(e.clientX, e.clientY);
	
	// Now position the piggy instance at the correct layer position.
	const piggyInst = runtime.objects.Piggy.getFirstInstance();
	piggyInst.x = layerX;
	piggyInst.y = layerY;
}
