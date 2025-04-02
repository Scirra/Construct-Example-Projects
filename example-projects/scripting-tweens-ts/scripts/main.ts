
// Get to the "beforeprojectstart" event
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Listen for pointerdown events (a mouse click or touch).
	runtime.addEventListener("pointerdown", (e: PointerEvent) => OnPointerDown(e, runtime));
}

// A math function to return the angle in radians from the first position to the second.
function AngleTo(x1: number, y1: number, x2: number, y2: number)
{
	return Math.atan2(y2 - y1, x2 - x1);
};

function OnPointerDown(e: PointerEvent, runtime: IRuntime)
{
	// Get position of pointer on layer 0.
	const layer = runtime.layout.getLayer(0)!;
	const [layerX, layerY] = layer.cssPxToLayer(e.clientX, e.clientY);
	
	// Get the piggy sprite instance.
	const spriteInst = runtime.objects.Sprite.getFirstInstance()!;
	
	// Use the Tween behavior to tween the position to the target layer position over 3 seconds.
	spriteInst.behaviors.Tween.startTween("position", [layerX, layerY], 3, "in-out-sine");
	
	// Also calculate the angle to the target position, and tween to that angle over 1 second.
	const angleToTarget = AngleTo(spriteInst.x, spriteInst.y, layerX, layerY) + (Math.PI / 2);
	spriteInst.behaviors.Tween.startTween("angle", angleToTarget, 1, "in-out-sine");
	
	// See more ways to control tweens in the Tween behavior script interface manual entry:
	// https://www.construct.net/make-games/manuals/construct-3/scripting/scripting-reference/behavior-interfaces/tween
}
