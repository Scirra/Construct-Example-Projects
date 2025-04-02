
import Globals from "./globals.js";

// This function runs when the button is clicked (see the event sheet)
export async function StartCamera()
{
	try {
		// Request camera input from the user. This might show a permission prompt.
		const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
		
		// If camera input approved, show it in the video element.
		const videoElem = Globals.videoElem;
		videoElem.srcObject = mediaStream;
		videoElem.play();
		
		// Start looking at the pixels in the video. This repeatedly
		// calling itself every frame using requestAnimationFrame.
		OnFrame();
	}
	catch (err)
	{
		// Handle an error - most likely the user declining the permission prompt.
		console.error(err);
		Globals.statusTextInstance!.text = "Oops! Something went wrong";
	}
}

// Called every frame after receiving camera input
function OnFrame()
{
	// Read the pixels from the camera video
	GetCameraPixels();
	
	// Tell the browser to call this function again the next frame.
	// This means the function keeps being called every frame.
	requestAnimationFrame(OnFrame);
}

function GetCameraPixels()
{
	// Get the size of the video
	const videoElem = Globals.videoElem;
	const videoWidth = videoElem.videoWidth;
	const videoHeight = videoElem.videoHeight;
	
	// If the video size is not greater than 0, it's probably not fully loaded yet.
	// Ignore this call - it will keep trying every frame until it loads.
	if (videoWidth <= 0 || videoHeight <= 0)
		return;
	
	// Pixel data cannot be directly retrieved from a video, but it can be retrieved
	// from a canvas, which the video can be drawn to. So to get the video pixel data
	// use the following three steps:
	// 1) Size the canvas to match the size of the video
	const tempCanvas = Globals.tempCanvas;
	const tempCtx = Globals.tempCtx;
	tempCanvas.width = videoWidth;
	tempCanvas.height = videoHeight;
	
	// 2) Draw the video to the canvas
	tempCtx.drawImage(videoElem, 0, 0, videoWidth, videoHeight);
	
	// 3) Retrieve the canvas pixel data
	const imageData = tempCtx.getImageData(0, 0, videoWidth, videoHeight);
	
	// Now calculate the average color from the retrieved pixel data.
	// Note this returns an array of [r, g, b] in a fractional 0-1 range.
	const averageColor = CalculateAverageColor(imageData);
	
	// Display the calculated average color in two ways:
	// 1) By setting the color of a sprite to visually show the color
	Globals.averageColorSpriteInstance!.colorRgb = averageColor;
	
	// 2) By displaying the RGB percentages in the AverageColorText object
	Globals.averageColorTextInstance!.text = `Average color: ${Math.round(averageColor[0] * 100)}% red, ${Math.round(averageColor[1] * 100)}% green, ${Math.round(averageColor[2] * 100)}% blue`;
}

// Calculate the average color from image data retrieved from the canvas
function CalculateAverageColor(imageData: ImageData): Vec3Arr
{
	// An ImageData object has a width, height, and data property with the byte data.
	// We are only interested in the byte data.
	const data = imageData.data;
	
	let totalR = 0;		// sum of red components
	let totalG = 0;		// sum of green components
	let totalB = 0;		// sum of blue components
	let count = 0;		// number of pixels summed
	
	// Taking in to account every single pixel could be slow, and we probably don't
	// need that much precision anyway. To make it faster while still being accurate
	// enough, only sample every 16th pixel.
	const samplePixelInterval = 16;
	
	// The pixel data is represented as an unsigned byte array. An unsigned byte can
	// have a value from 0-255. Each pixel is comprised of four bytes, representing the
	// red, green, blue and alpha (transparency) value of the pixel, in a repeating sequence like so:
	// [r0, g0, b0, a0, r1, g1, b1, a1, r2, g2, b2, a2, ...]
	// Note this means every pixel is 4 bytes apart. The alpha is ignored since we
	// only want the color. This loop iterates every Nth pixel according to samplePixelInterval.
	for (let index = 0; index < data.length - 4; index += samplePixelInterval * 4)
	{
		totalR += data[index];		// add R component of this pixel
		totalG += data[index+1];	// add G component of this pixel
		totalB += data[index+2];	// add B component of this pixel
		count++;					// add to number of pixels summed
	}
	
	// Calculate the average RGB components by dividing the sum by the count.
	const averageR = totalR / count;
	const averageG = totalG / count;
	const averageB = totalB / count;
	
	// Bytes return values in the range 0-255, and the average is in the same range.
	// However Construct object's color values use a fractional 0-1 range.
	// Return the average color as an array of [r, g, b] in the 0-1 range.
	return [averageR / 255, averageG / 255, averageB / 255];
}
