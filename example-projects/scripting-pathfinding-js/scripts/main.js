
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	runtime.addEventListener("pointerdown", e => OnPointerDown(e, runtime));
}

async function OnPointerDown(e, runtime)
{
	// Get the position of the input on the "Game" layer.
	const layer = runtime.layout.getLayer("Game");
	const [layerX, layerY] = layer.cssPxToLayer(e.clientX, e.clientY);
	
	// Use the Pathfinding behavior on the Sprite instance to calculate a path
	// to the target position. This is asynchronous so it needs to be awaited.
	const spriteInst = runtime.objects.Sprite.getFirstInstance();
	const Pathfinding = spriteInst.behaviors.Pathfinding;
	const didFindPath = await Pathfinding.findPath(layerX, layerY);
	
	// Regardless of if a path was found, destroy any existing node objects showing
	// a prior path, along with their labels.
	for (const nodeInst of runtime.objects.Node.getAllInstances())
	{
		nodeInst.destroy();
	}
	
	for (const labelInst of runtime.objects.Label.getAllInstances())
	{
		labelInst.destroy();
	}
	
	// If a path was found, create Node objects at each point along the path,
	// along with text labels with the node number, to display the route that was found.
	if (didFindPath)
	{
		let index = 0;
		
		for (const [nx, ny] of Pathfinding.nodes())
		{
			runtime.objects.Node.createInstance("Game", nx, ny);
			
			const labelInst = runtime.objects.Label.createInstance("Game", nx, ny + 1);
			labelInst.text = `${index++}`;
		}
	}
}