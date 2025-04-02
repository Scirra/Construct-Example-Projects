
// Variables for the three instances used in the vehicle
let carBodyInst: InstanceType.CarBody;
let backWheelInst: InstanceType.BackWheel;
let frontWheelInst: InstanceType.FrontWheel;

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime: IRuntime)
{
	runtime.addEventListener("tick", () => Tick(runtime));
	
	// Get the three instances used in the vehicle now that they are available
	carBodyInst = runtime.objects.CarBody.getFirstInstance()!;
	backWheelInst = runtime.objects.BackWheel.getFirstInstance()!;
	frontWheelInst = runtime.objects.FrontWheel.getFirstInstance()!;
	
	// Create revolute joints from the body to the wheels.
	// Note the numbers refer to image points on the car body.
	carBodyInst.behaviors.Physics.createRevoluteJoint(1, backWheelInst);
	carBodyInst.behaviors.Physics.createRevoluteJoint(2, frontWheelInst);
}

function Tick(runtime: IRuntime)
{
	// Code to run every tick.
	// While the left mouse button is held down, apply a force of 100
	// on the back wheel towards the mouse.
	const mouse = runtime.mouse!;
	
	if (mouse.isMouseButtonDown(0))
	{
		const [mouseX, mouseY] = mouse.getMousePosition();
		
		backWheelInst.behaviors.Physics.applyForceTowardPosition(100, mouseX, mouseY);
	}
}
