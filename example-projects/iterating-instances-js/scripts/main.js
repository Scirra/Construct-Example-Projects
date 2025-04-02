
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
	// Iterate every single Piggy sprite instance using a for-of loop.
	for (const inst of runtime.objects.Piggy.instances())
	{
		// Make the instance 10% bigger.
		inst.width *= 1.1;
		inst.height *= 1.1;
	}
}