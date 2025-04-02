
// Get to the "beforeprojectstart" event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Add events to handle tick (to advance the game by one frame) and
	// pointerdown (when any click or touch happens).
	runtime.addEventListener("tick", () => Tick(runtime));
	
	runtime.addEventListener("pointerdown", () => OnPointerDown(runtime));
}

// Called to "tick" the game (advance it by one frame).
function Tick(runtime)
{
	// Always point the player towards the mouse.
	PointPlayerTowardsMouse(runtime);
	
	// Tick every bullet instance so they move forwards.
	for (const bulletInst of runtime.objects.Bullet.instances())
	{
		TickBullet(runtime, bulletInst);
	}
}

function TickBullet(runtime, bulletInst)
{
	// Calculate the distance to move, using a speed of 600 pixels per second.
	const moveDist = 600 * runtime.dt;
	
	// Move the bullet at it's current angle by the calculated distance.
	const angle = bulletInst.angle;
	bulletInst.x += Math.cos(angle) * moveDist;
	bulletInst.y += Math.sin(angle) * moveDist;
	
	// If the bullet overlaps a solid, destroy it.
	if (bulletInst.testOverlapSolid())
	{
		bulletInst.destroy();
	}
}

// A math function to return the angle in radians from the first position to the second.
function AngleTo(x1, y1, x2, y2)
{
	return Math.atan2(y2 - y1, x2 - x1);
};

function PointPlayerTowardsMouse(runtime)
{
	// Get the position of the mouse on layer 0.
	const [mouseX, mouseY] = runtime.mouse.getMousePosition(0);
	
	// Point the player at the angle from the player to the mouse.
	const playerInst = runtime.objects.Player.getFirstInstance();
	playerInst.angle = AngleTo(playerInst.x, playerInst.y, mouseX, mouseY);
}

// Called when a mouse click or touch happens.
function OnPointerDown(runtime)
{
	// Get the location of the player's first image point, which is at the end of their gun.
	const playerInst = runtime.objects.Player.getFirstInstance();
	const [imgPtX, imgPtY] = playerInst.getImagePoint(1);
	
	// Create a bullet at that position, and set its angle to the same as the player.
	const bulletInst = runtime.objects.Bullet.createInstance(0, imgPtX, imgPtY);
	bulletInst.angle = playerInst.angle;
}