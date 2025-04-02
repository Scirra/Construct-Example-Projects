
// Some utility methods to calculate the angle and distance
// between two points.
function AngleTo(x1, y1, x2, y2)
{
	return Math.atan2(y2 - y1, x2 - x1);
}

function DistanceTo(x1, y1, x2, y2)
{
	return Math.hypot(x2 - x1, y2 - y1);
}

// Export a PointerInfo class which represents information about an individual pointer.
// This allows tracking the state of a pointer, such as a mouse cursor, touch or
// pen, over time. This is a good way to detect different actions like gestures.
export class PointerInfo {

	// PointerInfo is created in the "pointerdown" event.
	constructor(runtime, e)
	{
		// Save the runtime reference
		this.runtime = runtime;
		
		// Save the start position of this pointer in client (CSS) co-ordinates.
		this.startClientX = e.clientX;
		this.startClientY = e.clientY;
		
		// Calculate where this pointer is on the layer.
		const [layerX, layerY] = this.CssPxToLayer(e.clientX, e.clientY);
		
		// Create a Tiled Background that is used to show a line from the start position
		// to the current position of the pointer. However since the pointer hasn't moved
		// yet, leave it at a width of 0. This will be updated when the pointer moves.
		this.lineMarker = runtime.objects.TiledBackground.createInstance(0, layerX, layerY);
		this.lineMarker.width = 0;
		
		// Create both a start and end marker to show the beginning and current positions
		// of the pointer. The end marker is created at the start position, but will be
		// moved when the pointer moves.
		this.startMarker = runtime.objects.StartMarker.createInstance(0, layerX, layerY);
		this.endMarker = runtime.objects.EndMarker.createInstance(0, layerX, layerY);
		
		// Also create a text label to display the pointer details.
		this.textLabel = runtime.objects.PointerLabel.createInstance(0, layerX + 20, layerY - 15);
		this.textLabel.text = `pointerType "${e.pointerType}"
pointerId ${e.pointerId}`;
	}
	
	// This is a helper function to convert client (CSS) co-ordinates to layer co-ordinates.
	// Note objects in the layout use layer co-ordinates rather than CSS co-ordinates.
	CssPxToLayer(clientX, clientY)
	{
		const layer = this.runtime.layout.getLayer(0);
		return layer.cssPxToLayer(clientX, clientY);
	}
	
	// Called when this pointer has moved.
	OnMove(e)
	{
		// Get both the start and current position of this pointer in layer co-ordinates.
		const [startLayerX, startLayerY] = this.CssPxToLayer(this.startClientX, this.startClientY);
		const [endLayerX, endLayerY] = this.CssPxToLayer(e.clientX, e.clientY);
		
		// Move the end marker to the current position.
		this.endMarker.x = endLayerX;
		this.endMarker.y = endLayerY;
		
		// Update the Tiled Background used to show a line between the start and current
		// positions. Set its angle to point from the start to the end position, and set
		// its width to the distance between them.
		this.lineMarker.angle = AngleTo(startLayerX, startLayerY, endLayerX, endLayerY);
		this.lineMarker.width = DistanceTo(startLayerX, startLayerY, endLayerX, endLayerY);
	}
	
	// The pointer has ended, and the user action should be applied.
	OnUp(e)
	{
		// ... apply any necessary user action here ...
		
		this.Destroy();
	}
	
	// The pointer has ended, but the user action should not be applied.
	// (See comments on OnPointerCancel() in main.js.)
	OnCancel(e)
	{
		this.Destroy();
	}
	
	// When the pointer ends (either by the pointerup or pointercancel events)
	// destroy all the objects it used to visualize the pointer.
	Destroy()
	{
		this.lineMarker.destroy();
		this.startMarker.destroy();
		this.endMarker.destroy();
		this.textLabel.destroy();
	}
}