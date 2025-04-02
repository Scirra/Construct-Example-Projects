/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Felipe Vaiano Calderan - Programmer
 * Twitter: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 * Twitter: @andrart7
 * E-mail: wesleymatos1989@gmail.com
 *
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// The constants below are general settings for gameplay aspects
const WORLDGRAVITY = 0.25;  // The World's gravity
const ROCKETTHRUST = 0.255; // How powerful the rocket's thrust is
const ROCKETTORQUE = 0.02;  // How powerful the rocket's rotation is
const STARTINGFUEL = 999;   // Fuel quantity the player has on start
const FUELUSAGE    = 0.5;   // How fast the fuel depletes
const WAITINGTIME  = 1000;  // Waiting time before inputs are enabled
const STARSPEED    = 0.08;  // How fast the stars move
const MINRAYDIST   = 80;    // Minimum raycast distance to activate LED
const STARTPOS = {
    x: 132, y: 70
}; // Where the rocket starts

// List below contains all possible positions where the landing pad can spawn
const LANDINGPADPOSITIONS = [
    { x:  88, y: 352 },
    { x: 264, y: 208 },
    { x: 488, y: 352 },
    { x: 616, y: 288 }
];

// The following constants adjust how precise a landing needs to be valid
const MAXLANDINGSPEEDX = 10; // Max viable speed in X for a successful landing
const MAXLANDINGSPEEDY = 20; // Max viable speed in Y for a successful landing
const MAXLANDINGANGLE  = 10; // Max viable angle for a successful landing

// These variables store object instances that are referenced later.
// Their names reflect which objects they will later be assigned to
let rocket: InstanceType.Rocket;
let rocketCollider: InstanceType.RocketCollider;
let goodBadLED: InstanceType.GoodBadLED;
let terrain: InstanceType.Terrain;
let landingPad: InstanceType.LandingPad;
let beacon: InstanceType.Beacon;
let starfield: InstanceType.Starfield;
let infoText: InstanceType.InfoText;
let pauseText: InstanceType.pauseText | null;
let keyboard: IKeyboardObjectType;

// Finally, these are used to monitor the current state of the game
let fuel: number; // Fuel left
let landings: number; // Number of landings
let landed: boolean; // Is the rocket on the ground?
let inputsEnabled: boolean; // Are the inputs enabled?
let landingPadPositionIndex: number; // Current landing position index (from the list)


runOnStartup(async runtime => {
    /* This function runs on the startup, but here the project is not fully
     * loaded, so we add an Event Listener that calls a function as soon as the
     * project is started
     */
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime: IRuntime) {
    /* This function runs right before the project starts. It sets up the
     * initial configuration for the game, such as attributing values to the
     * global variables that store object instances
    */
    
    // Disable the inputs, so the player cannot move the rocket immediately
    inputsEnabled = false;
    
    // Setup object instances
    rocket = runtime.objects.Rocket.getFirstInstance()!;
    rocketCollider = runtime.objects.RocketCollider.getFirstInstance()!;
    goodBadLED = runtime.objects.GoodBadLED.getFirstInstance()!;
    terrain = runtime.objects.Terrain.getFirstInstance()!;
    landingPad = runtime.objects.LandingPad.getFirstInstance()!;
    beacon = runtime.objects.Beacon.getFirstInstance()!;
    starfield = runtime.objects.Starfield.getFirstInstance()!;
    infoText = runtime.objects.InfoText.getFirstInstance()!;
    pauseText = runtime.objects.pauseText.getFirstInstance()!;
    keyboard = runtime.keyboard!;
    
    /* The Rocket and RocketCollider should move and turn together, so it is
     * convenient to make one a child of the other. The same applies to the
     * GoodBadLED
     */
    rocket.addChild(rocketCollider, {
        transformX: true,
        transformY: true,
        transformAngle: true
    });
    rocket.addChild(goodBadLED, {
        transformX: true,
        transformY: true,
        transformAngle: true
    });
    
    // Attach the beacon to the landing pad
    landingPad.addChild(beacon, {
        transformX: true,
        transformY: true,
    });
    
    // Set gravity and enable Rocket-Terrain collision
    rocket.behaviors.Physics.behavior.worldGravity = WORLDGRAVITY;
    rocket.behaviors.Physics.behavior.setCollisionsEnabled(
        runtime.objects.Rocket, runtime.objects.Terrain, true
    );
    
    // Make pause text flash
    pauseText.behaviors.Flash.flash(0.25, 0.25, Number.MAX_SAFE_INTEGER);
    
    // Start the game
    restartGame();
    
    // Stop the rocket from moving, until a key is pressed
    rocket.behaviors.Physics.isImmovable = true;
    
    // Add Event Listener to trigger a function every tick
    runtime.addEventListener("tick", () => onTick(runtime));
    
    // Add Event Listener to unpause the game if a key is pressed
    runtime.addEventListener("keydown", (_) => unpauseGame());
}

function onTick(runtime: IRuntime) {
    /* This function executes every tick and control core game functionalities,
     * Such as capturing player's inputs, update UI and check collisions
     */
    moveStarfield(runtime);   // Make stars move slowly
    setLEDAnimation();        // Set the correct LED animation
    stabilizeRocket();        // Make rocket steady, before inputs are on
    getPlayerInputs(runtime); // Capture player's inputs
    checkLaunch();            // Check if the rocket was launched
    checkCollision(runtime);  // Check collisions
    updateInfoText();         // Update the UI
}

function unpauseGame() {
    // If the game is paused and the player presses a key, unpause it.
    if (pauseText) {
        rocket.behaviors.Physics.isImmovable = false;
        rocket.behaviors.Physics.isBullet = true;
        rocket.behaviors.Physics.angularVelocity = 0;
        rocket.angle = 0;
        pauseText.destroy();
        pauseText = null;
    }
}

function onExplosionAnimationEnd(e: SpriteAnimationEndEvent) {
    // This function destroys an explosion when its animation ends
    e.instance.destroy();
}

function restartGame() {
    // Reset global variables
    landings = 0;
    landed = false;
    fuel = STARTINGFUEL;

    // Reset rocket position and physics
    rocket.setAnimation("StopThrust");
    rocket.animationFrame = 5;
    rocket.x = STARTPOS.x;
    rocket.y = STARTPOS.y;
    rocket.behaviors.Physics.angularVelocity = 0;
    rocket.angle = 0;

    // Reset landing pad position
    resetLandingPad();

    // Wait a little before the player can input
    setTimeout(() => inputsEnabled = true, WAITINGTIME);
}

function resetLandingPad() {
    // Here, a new landing pad position is randomly chosen
    let newPosIndex;
    
    // Choose a new position that is not the current one
    while (true) {
        newPosIndex = Math.floor(Math.random() * 4);
        if (newPosIndex != landingPadPositionIndex) break;
    }
    landingPadPositionIndex = newPosIndex;
    
    // Place the landing pad on the new position
    landingPad.x = LANDINGPADPOSITIONS[landingPadPositionIndex].x;
    landingPad.y = LANDINGPADPOSITIONS[landingPadPositionIndex].y;
}

function moveStarfield(runtime: IRuntime) {
    // Change starfield's image offsets to make the stars move and loop
    starfield.imageOffsetX += STARSPEED * 60 * runtime.dt;
    starfield.imageOffsetY -= STARSPEED * 60 * runtime.dt;
}

function setLEDAnimation() {
    /* When the rocket has the right speed and angle, the LED flashes green,
     * otherwise it blinks red more slowly
     */
     
    // First the rocket casts a ray below it
    const ray = rocket.behaviors.LineOfSight.castRay(
        rocket.x, rocket.y, rocket.x, rocket.y + 1000
    );
    
    /* The only object the ray can collide with is the landing pad, because
     * it is the only object with the Solid behavior. If a collision happened,
     * calculate the distance to check if it is close enough to make the LED
     * blink. If it is not close enough, keep the LED off.
     */
    if (ray.didCollide && ray.hitDistance < MINRAYDIST) {
        // Is the rocket almost upright?
        const angle = rocket.angle * (180 / Math.PI);
        const lowangle = angle > 360 - MAXLANDINGANGLE
                         || angle < MAXLANDINGANGLE;

        // Is the rocket slow enough to perform a successful landing?
        const lowvelX = Math.abs(
            rocket.behaviors.Physics.getVelocityX()
        ) < MAXLANDINGSPEEDX;
        const lowvelY = rocket.behaviors.Physics.getVelocityY()
            < MAXLANDINGSPEEDY && rocket.behaviors.Physics.getVelocityY() > 0;
        
        let currentAnimFrame;

        // If the parameters are good, blink green
        if (lowangle && lowvelX && lowvelY) {
            currentAnimFrame = goodBadLED.animationFrame;
            goodBadLED.setAnimation("Good");
            goodBadLED.animationFrame = currentAnimFrame;

        // Otherwise, blink red
        } else {
            currentAnimFrame = goodBadLED.animationFrame;
            goodBadLED.setAnimation("Bad");
            goodBadLED.animationFrame = currentAnimFrame;
        }

    // LED Off
    } else {
        goodBadLED.setAnimation("Off");
    }
}

function stabilizeRocket() {
    // While inputs are not enabled, keep the rocket steady
    if (inputsEnabled) return;

    rocket.behaviors.Physics.angularVelocity = 0; // Stop rotation
    rocket.angle = 0;                             // Hold upright position
}

function getPlayerInputs(runtime: IRuntime) {
    // Get player's inputs (if enabled) and process them
    if (!inputsEnabled) return;
    
    // Apply right torque
    if (keyboard.isKeyDown("ArrowRight") && !landed)
        rocket.behaviors.Physics.applyTorque(ROCKETTORQUE);
        
    // Apply left torque
    if (keyboard.isKeyDown("ArrowLeft") && !landed)
        rocket.behaviors.Physics.applyTorque(-ROCKETTORQUE);
        
    // Thrust
    if (keyboard.isKeyDown("ArrowUp") && fuel > 0) {
        // Apply force in the rocket's facing direction
        rocket.behaviors.Physics.applyForceAtAngle(
            ROCKETTHRUST, rocket.angle - Math.PI / 2, 0
        );
        // Set animation
        rocket.setAnimation("Thrust");
        // Consume fuel
        fuel = Math.max(fuel - FUELUSAGE * 60 * runtime.dt, 0);
    
    // Stop thrust animation
    } else if (rocket.animationName != "StopThrust") {
        rocket.setAnimation("StopThrust");
    }
}

function checkLaunch() {
    /* When the rocket is landed and the player sends it up again, the game
     * considers it a new launch and make so the rocket is no longer landed
     */
    if (landed && rocket.behaviors.Physics.getVelocityY() < -5) landed = false;
}

function checkCollision(runtime: IRuntime) {
    // This function process Rocket-Terrain and Rocket-LandingPad collisions
    
    // First, a set of conditions are created to be later checked
    
    // Is the rocket collider overlapping the terrain?
    const overlapTerrain = terrain.testOverlap(rocketCollider);
    
    // Is the rocket almost upright?
    const angle = rocket.angle * (180 / Math.PI);
    const lowangle = angle > 360 - MAXLANDINGANGLE || angle < MAXLANDINGANGLE;
    
    // Is the rocket slow enough to perform a successful landing?
    const lowvelX = Math.abs(
        rocket.behaviors.Physics.getVelocityX()
    ) < MAXLANDINGSPEEDX;
    const lowvelY = rocket.behaviors.Physics.getVelocityY()
        < MAXLANDINGSPEEDY && rocket.behaviors.Physics.getVelocityY() > 0;
    
    // Is the rocket collider overlapping the landing pad?
    const overlapPad = landingPad.testOverlap(rocketCollider);

    /* If all above conditions are true and the rocket is not landed, it
     * has just landed successfully.
     */
    if (
        overlapTerrain && lowangle && lowvelX
        && lowvelY && overlapPad && !landed
    ) {
        landed = true;        // set as landed
        landings += 1;        // add 1 to landings counter
        resetLandingPad();    // reset landing pad's position
        
    // If it is overlapping the terrain but is not landed, it has crashed
    } else if (overlapTerrain && !landed) {
        // Create explosion
        const explosion = runtime.objects.Explosion.createInstance(
            "Foreground", rocket.x, rocket.y
        );
        // Add Event Listener to destroy explosion when the animation finishes
        explosion.addEventListener(
            "animationend", e => onExplosionAnimationEnd(e)
        );
        // Disable inputs and restart the game
        inputsEnabled = false;
        restartGame();
    }
}

function updateInfoText() {
    // Here the information textbox is updated
    
    // Format the number of landings by padding it with 0s
    const txtLandings = landings.toString().padStart(3, '0');
    
    // Format the amount of fuel by padding it with 0s and removing decimals
    const txtFuel = fuel.toFixed(0).padStart(3, '0');
    
    // Write everything in the textbox
    infoText.text = "Landings: " + txtLandings + "\nFuel: " + txtFuel;
}