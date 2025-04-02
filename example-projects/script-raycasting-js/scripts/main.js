
// Get to the "beforeprojectstart" event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	runtime.addEventListener("tick", () => Tick(runtime));
}

// Every tick, use raycasting to check how far each YellowLine instance should extend.
function Tick(runtime)
{
	for (const inst of runtime.objects.YellowLine.instances())
	{
		RaycastLine(inst);
	}
}

// Use raycasting - which is part of the Line-of-Sight (LOS) behavior - to find how far the
// instance can extend before it hits a solid. The lines are really Tiled Backgrounds;
// their width controls how far the line extends from their origin. They also have the Sine
// behavior to oscillate the angle back and forth, better demonstrating the raycasting effect.
function RaycastLine(inst)
{
	// Get the Line-of-Sight behavior in a variable to use as a shorthand.
	const LOS = inst.behaviors.LineOfSight;
	
	// Find a point at the line-of-sight's range in the direction of the YellowLine instance.
	const targetX = inst.x + Math.cos(inst.angle) * LOS.range;
	const targetY = inst.y + Math.sin(inst.angle) * LOS.range;
	
	// Cast a ray to that point and check if it collided.
	const ray = LOS.castRay(inst.x, inst.y, targetX, targetY);
	
	if (ray.didCollide)
	{
		// The ray hit an obstacle: set the Tiled Background width to the distance to that
		// obstacle, so it extends all the way there.
		inst.width = ray.hitDistance;
		
		// The ray hitX and hitY properties also give the precise hit location - see the manual entry for more details:
		// https://www.construct.net/make-games/manuals/construct-3/scripting/scripting-reference/behavior-interfaces/line-of-sight
	}
	else
	{
		// The ray didn't hit anything: set the Tiled Background width to the maximum range.
		// It will extend all the way offscreen.
		inst.width = LOS.range;
	}
}