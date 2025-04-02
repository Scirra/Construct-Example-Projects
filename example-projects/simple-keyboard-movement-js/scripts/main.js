
// Attach a "tick" event handler on startup.
runOnStartup(async runtime =>
{
	runtime.addEventListener("tick",
							 () => Tick(runtime));
});

// This function runs every tick, like an "Every tick" event's actions.
function Tick(runtime)
{
	// Get the player instance, delta-time (dt) and the keyboard object.
	const player = runtime.objects.Player.getFirstInstance();
	const dt = runtime.dt;
	const keyboard = runtime.keyboard;
	
	// Move the player at 200 pixels per second on each axis.
	const playerSpeed = 200;
	
	// Check if each arrow key is down. If it is, move the player
	// in the direction of the arrow key, and set their angle to
	// face that direction.
	if (keyboard.isKeyDown("ArrowRight"))
	{
		player.x += playerSpeed * dt;
		player.angleDegrees = 0;
	}
	
	if (keyboard.isKeyDown("ArrowLeft"))
	{
		player.x -= playerSpeed * dt;
		player.angleDegrees = 180;
	}
	
	if (keyboard.isKeyDown("ArrowDown"))
	{
		player.y += playerSpeed * dt;
		player.angleDegrees = 90;
	}
	
	if (keyboard.isKeyDown("ArrowUp"))
	{
		player.y -= playerSpeed * dt;
		player.angleDegrees = 270;
	}
}