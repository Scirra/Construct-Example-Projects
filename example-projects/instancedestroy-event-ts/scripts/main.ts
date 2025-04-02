
// Get to the beforeproject start event
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Handle pointerdown events to destroy any piggy that was clicked on
	runtime.addEventListener("pointerdown", e => OnPointerDown(e, runtime));
	
	// Use the instancedestroy event to detect when Piggy instances are destroyed.
	runtime.objects.Piggy.addEventListener("instancedestroy", e => OnInstanceDestroy(e, runtime));
}

function OnPointerDown(e: PointerEvent, runtime: IRuntime)
{
	// Get the pointer position on layer 0.
	const layer = runtime.layout.getLayer(0)!;
	const [layerX, layerY] = layer.cssPxToLayer(e.clientX, e.clientY);
	
	// Check if any piggy is at this position and destroy it if so.
	for (const inst of runtime.objects.Piggy.instances())
	{
		if (inst.containsPoint(layerX, layerY))
		{
			inst.destroy();
			break;
		}
	}
}

// Called when any Piggy instance is destroyed
function OnInstanceDestroy(e: ObjectClassInstanceDestroyEvent, runtime: IRuntime)
{
	// Show the UID (Unique ID) of the destroyed Piggy instance in the Text object.
	// The instance that was destroyed is available as e.instance.
	const textInst = runtime.objects.Text.getFirstInstance()!;
	textInst.text = `Destroyed instance UID ${e.instance.uid}`;
}