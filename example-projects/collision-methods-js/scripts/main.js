
// Import the collision utility methods.
import { PushOutAngle, PushOutSolidAngle } from "./collisionMethods.js";

// A function to call when clicking "push out", as a convenient way to change
// what the button does.
let pushOutButtonClickFunc = null;

// On startup, wait for the "beforeprojectstart" event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

// Initialization when starting the project.
async function OnBeforeProjectStart(runtime)
{
	// Call the curent click handler when clicking the 'Push out' button.
	const pushOutButton = runtime.objects.PushOut.getFirstInstance();
	pushOutButton.addEventListener("click", () =>
	{
		if (pushOutButtonClickFunc)
			pushOutButtonClickFunc();
	});
	
	// Use different methods to handle each of the two layouts.
	const pushOutAngleLayout = runtime.getLayout("PushOutAngle");
	pushOutAngleLayout.addEventListener("beforelayoutstart",
		() => OnStartPushOutAngleLayout(runtime));
		
	const pushOutSolidLayout = runtime.getLayout("PushOutSolid");
	pushOutSolidLayout.addEventListener("beforelayoutstart",
		() => OnStartPushOutSolidLayout(runtime));
}

// Initialization for the 'PushOutAngle' layout.
async function OnStartPushOutAngleLayout(runtime)
{
	// Get instances on this layout.
	const moveInst = runtime.objects.MoveSprite.getFirstInstance();
	const obstacleInst = runtime.objects.ObstacleSprite.getFirstInstance();
	
	const maxDistInput = runtime.objects.MaxDistInput.getFirstInstance();
	const stepInput = runtime.objects.StepInput.getFirstInstance();
	const resultText = runtime.objects.ResultText.getFirstInstance();
	
	// Set the 'Push out' button click function.
	pushOutButtonClickFunc = (() =>
	{
		// Get the step and maxDist parameters from the inputs.
		const step = Number(stepInput.text);
		const maxDist = Number(maxDistInput.text);
		
		// Attempt to push the MoveSprite out of the obstacle
		// at the reverse of its current angle (i.e. backwards).
		const result = PushOutAngle(moveInst, obstacleInst, moveInst.angle + Math.PI, step, maxDist);
		
		// Display whether pushing out succeeded in a text object.
		resultText.text = (result ? "OK" : "Failed");
	});
}

// Initialization for the 'PushOutSolid' layout.
async function OnStartPushOutSolidLayout(runtime)
{
	// Get instances on this layout.
	const moveInst = runtime.objects.MoveSprite.getFirstInstance();
	
	const maxDistInput = runtime.objects.MaxDistInput.getFirstInstance();
	const stepInput = runtime.objects.StepInput.getFirstInstance();
	const resultText = runtime.objects.ResultText.getFirstInstance();
	
	// Set the 'Push out' button click function.
	pushOutButtonClickFunc = (() =>
	{
		// Get the step and maxDist parameters from the inputs.
		const step = Number(stepInput.text);
		const maxDist = Number(maxDistInput.text);
		
		// Attempt to push the MoveSprite out of any solids
		// at the reverse of its current angle (i.e. backwards).
		const result = PushOutSolidAngle(moveInst, moveInst.angle + Math.PI, step, maxDist);
		
		// Display whether pushing out succeeded in a text object.
		resultText.text = (result ? "OK" : "Failed");
	});
}
