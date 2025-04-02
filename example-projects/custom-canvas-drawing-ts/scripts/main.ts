
// Wait for project to start
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

// HTML canvas element to create in between HTML layers,
// and a CanvasRenderingContext2D
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

async function OnBeforeProjectStart(runtime: IRuntime)
{
	const platformInfo = runtime.platformInfo;
	
	// Just before the project starts, create a custom <canvas> element
	// sized the same as Construct's own canvas, and and insert it on
	// HTML layer 0 (i.e. in between "Front" and "Back").
	// Note the canvas size must be set to the device width and height,
	// and the style size set to the CSS width and height, to support
	// high-density displays with full resolution.
	canvas = document.createElement("canvas");
	canvas.width = platformInfo.canvasDeviceWidth;
	canvas.height = platformInfo.canvasDeviceHeight;
	canvas.style.width = platformInfo.canvasCssWidth + "px";
	canvas.style.height = platformInfo.canvasCssHeight + "px";
	
	runtime.getHTMLLayer(0).appendChild(canvas);
	
	// Get the 2D rendering context from the custom canvas.
	ctx = canvas.getContext("2d")!;
	
	// When the window is resized, update the custom canvas to
	// match the new size.
	runtime.addEventListener("resize", e => ResizeCanvas(e));
	
	// Render to the custom canvas every tick.
	runtime.addEventListener("tick", () => Tick(runtime));
}

// When the window is resized, update the canvas size to match the new
// size (again using both the device and CSS sizes).
function ResizeCanvas(e: ConstructResizeEvent)
{
	canvas.width = e.deviceWidth;
	canvas.height = e.deviceHeight;
	canvas.style.width = e.cssWidth + "px";
	canvas.style.height = e.cssHeight + "px";
}

// A utility function to create a rainbow gradient to draw the line with
function CreateRainbowGradient(p1x: number, p1y: number, p2x: number, p2y: number)
{
	const gradient = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
	
	gradient.addColorStop(0, "red");
	gradient.addColorStop(0.16, "orange");
	gradient.addColorStop(0.32, "yellow");
	gradient.addColorStop(0.48, "green");
	gradient.addColorStop(0.64, "blue");
	gradient.addColorStop(0.82, "indigo");
	gradient.addColorStop(1, "violet");
	
	return gradient;
}

// Every tick, render to the canvas
function Tick(runtime: IRuntime)
{
	const platformInfo = runtime.platformInfo;
	const time = runtime.gameTime;
	
	// Note canvas rendering is done in device units
	const deviceWidth = platformInfo.canvasDeviceWidth;
	const deviceHeight = platformInfo.canvasDeviceHeight;
	
	// Some sizes need to be scaled to match the scaling Construct
	// uses as the window size changes. Use the render scale of the
	// Construct layer behind the custom canvas as the scale factor.
	const renderScale = runtime.layout.getLayer(0)!.renderScale;
	
	// Clear the canvas to transparent before re-rendering it
	ctx.clearRect(0, 0, deviceWidth, deviceHeight);
	
	// Calculate some margin sizes proportional to the display size
	// to use for positioning the bezier points
	const margin1X = deviceWidth / 6;
	const margin1Y = deviceHeight / 6;
	const margin2X = deviceWidth / 8;
	const margin2Y = deviceHeight / 10;
	
	// Determine the start and end points, using a sin calculation to
	// oscillate them over time
	const p1x = margin1X + Math.sin(time * 1.3) * margin2X;
	const p1y = deviceHeight - margin1Y;
	
	const p2x = (deviceWidth - margin1X) + Math.sin(time * 1.4) * margin2X;
	const p2y = deviceHeight - margin1Y;
	
	// Determine the bexier control points, also using a sin calculation to
	// oscillate them over time
	const cp1x = margin1X + Math.sin(time) * margin2X;
	const cp1y = margin1Y + Math.sin(time * 0.5) * margin2Y;
	
	const cp2x = (deviceWidth - margin1X) + Math.sin(time * 1.5) * margin2X;
	const cp2y = margin1Y + Math.sin(time * 2) * margin2Y;
	
	// Create a rainbow gradient, and draw the bezier path using the
	// calculated points. Note that the line width is adjusted by the
	// render scale so it adapts to the window size.
	ctx.strokeStyle = CreateRainbowGradient(p1x, p1y, p2x, p2y);
	ctx.lineWidth = 60 * renderScale;
	ctx.beginPath();
	ctx.moveTo(p1x, p1y);
	ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
	ctx.stroke();
	
	// To help visualize the control points, render them as small squares.
	const squareSize = 20 * renderScale;
	const halfSquareSize = squareSize / 2;
	ctx.fillStyle = "red";
	ctx.fillRect(p1x - halfSquareSize, p1y - halfSquareSize, squareSize, squareSize);
	
	ctx.fillStyle = "blue";
	ctx.fillRect(cp1x - halfSquareSize, cp1y - halfSquareSize, squareSize, squareSize);
	
	ctx.fillStyle = "blue";
	ctx.fillRect(cp2x - halfSquareSize, cp2y - halfSquareSize, squareSize, squareSize);
	
	ctx.fillStyle = "red";
	ctx.fillRect(p2x - halfSquareSize, p2y - halfSquareSize, squareSize, squareSize);
}
