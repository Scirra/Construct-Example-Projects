
// This function is called when the button is clicked.
// This script is used as the imports for events, so scripts in events can
// directly call the fillDrawingCanvas() method.
function fillDrawingCanvas(drawingCanvasInst)
{
	// Create a new ImageData the size of the Drawing Canvas surface.
	// See: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
	const imageData = new ImageData(drawingCanvasInst.surfaceDeviceWidth,
									drawingCanvasInst.surfaceDeviceHeight);
	
	// Fill the ImageData with random greyscale pixels. This will create
	// a monochrome noise effect. Note the 'data' property of ImageData
	// uses four bytes per pixel for the R, G, B and A components.
	const data = imageData.data;
	for (let i = 0, len = data.length; i < len; i += 4)
	{
		// Generate a random byte value
		const v = Math.floor(Math.random() * 256);
		
		// Assign this to the R, G and B components. This sets a random
		// greyscale color.
		data[i] = v;
		data[i + 1] = v;
		data[i + 2] = v;
		
		// Set an opaque alpha.
		data[i + 3] = 255;
	}
	
	// Submit the pixel data to the Drawing Canvas object so it is displayed.
	drawingCanvasInst.loadImagePixelData(imageData);
}
