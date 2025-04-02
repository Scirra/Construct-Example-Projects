
// Add the beforeprojectstart event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Add a function to call when clicking the button.
	const buttonInst = runtime.objects.Button.getFirstInstance();
	buttonInst.addEventListener("click", () => OnButtonClick(runtime));
}

// This function is called when the button is clicked.
function OnButtonClick(runtime)
{
	// Iterate only the Piggy instances yielded by the movablePiggys function.
	// As it's a generator function, it can be used with for-of loops.
	for (const inst of movablePiggys(runtime))
	{
		// Move the piggy to the right.
		// This will only affect piggys whose 'movable' instance variable is set.
		inst.x += 20;
	}
}

// This is a generator function, denoted by function*. It iterates
// only piggy instances whose 'movable' instance variable is enabled.
// See the Layout View to see the instances which set the instance
// variable - to make it clearer, the ones that don't set it have a
// reduced opacity. For more details about generator functions see:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
function* movablePiggys(runtime)
{
	// Iterate all the piggy instances.
	for (const inst of runtime.objects.Piggy.instances())
	{
		// If this piggy's 'movable' instance variable is enabled,
		// yield the instance. This means the for-of loop will run
		// once for this instance. Other instances are skipped.
		if (inst.instVars.movable)
			yield inst;
	}
}

