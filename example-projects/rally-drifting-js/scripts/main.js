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

// Settings
const SHAKEINTENSITY = 550; // Bigger vals => less shake when the car is idle
const STEERINGSPEED = 125; // How fast the car can steer

/* These variables store object instances that are referenced later.
 * Their names reflect which objects they will later be assigned to
 */
let keyboard;
let camera;
let car;
let startPosition;
let steeringWheel;
let speedPointer;
let flagPole;
let timeText;
let tutorialText;

// Gameplay variables
let camLookX; // Current X position the camera is looking at
let camLookY; // Current Y position the camera is looking at
let steeringDir; // Steering direction (to animate the steering wheel)
let lerpCarSpeed; // A smoothed version of the car speed
let startWallTime; // Starting trial time
let currentWallTime; // Current trial time
let timeRunning; // Is the time running?
let endOfTheRace; // Is the race ended?

runOnStartup(async runtime => {
    // Code to run on the loading screen.

    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Get important instances
    keyboard = runtime.keyboard;
    camera = runtime.objects.Camera3D;
    car = runtime.objects.PlayerCar.getFirstInstance();
    startPosition = runtime.objects.PlayerStartPosition.getFirstInstance();
    steeringWheel = runtime.objects.SteeringWheel.getFirstInstance();
    speedPointer = runtime.objects.SpeedometerPointer.getFirstInstance();
    flagPole = runtime.objects.FlagPoleModel.getFirstInstance();
    timeText = runtime.objects.TimeText.getFirstInstance();
    tutorialText = runtime.objects.TutorialText.getFirstInstance();
    
    // Reset global variables
    resetVariables();
    
    // Spawn bushes
    spawnBushes(runtime);
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function resetVariables() {
    // This function resets all relevant variables
    
    car.behaviors.Car.isIgnoringInput = false;
    car.angle = startPosition.angle;
    car.x = startPosition.x;
    car.y = startPosition.y;
    camLookX = car.x + Math.cos(car.angle) * 128;
    camLookY = car.y + Math.sin(car.angle) * 128;
    steeringDir = 0;
    lerpCarSpeed = 0;
    startWallTime = 0;
    currentWallTime = 0;
    timeRunning = false;
    endOfTheRace = false;
}

function spawnBushes(runtime) {
    // Bushes are spawned procedurally

    // For each tree, spawn 3 bushes nearby
    for (const t of runtime.objects.TreeModel.getAllInstances()) {
        for (let i = 0; i < 3; i++) {
            const xPos = t.x + (Math.random() - 0.5) * 100;
            const yPos = t.y + (Math.random() - 0.5) * 100;
            // Do not spawn bushes outside the map
            if (xPos > 0 && xPos < 2560 && yPos > 0 && yPos < 2560) {
                runtime.objects.BushModel.createInstance(
                    "Game",
                    t.x + (Math.random() - 0.5) * 100,
                    t.y + (Math.random() - 0.5) * 100,
                );
            }
        }
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    getInputs(runtime);
    showTime(runtime);
    setCamera(runtime);
    processCarPhysics(runtime);
    rotateBillboards(runtime);
    checkForEndOfRace();
}

function getInputs(runtime) {
    // Get player inputs, process them, and execute the proper actions
    
    // If the race has ended, ignore everything else.
    if (endOfTheRace) return;
    
    // Up starts the timer immediately, if not started already
    if (keyboard.isKeyDown("ArrowUp")) {
        if (!timeRunning) {
            timeRunning = true;
            startWallTime = runtime.wallTime;
            tutorialText.behaviors.Fade.fadeInTime = 0;
            tutorialText.behaviors.Fade.fadeOutTime = 1;
            tutorialText.behaviors.Fade.startFade();
        }
    }
    
    // When the player presses left or right, progressively turn the wheel
    if (keyboard.isKeyDown("ArrowLeft")) {
        steeringDir = lerp(steeringDir, -3.25, 0.2 * 60 * runtime.dt);
        
    } else if (keyboard.isKeyDown("ArrowRight")) {
        steeringDir = lerp(steeringDir, 3.25, 0.2 * 60 * runtime.dt);
    
    // Otherwise, progressively return the wheel to the center position
    } else {
        steeringDir = lerp(steeringDir, 0, 0.2 * 60 * runtime.dt);
    }
    
    // Apply the animation
    steeringWheel.animationFrame = 3.25 + Math.round(steeringDir);
}

function showTime(runtime) {
    // Show race time
    
    // If the time is not running, just ignore
    if (!timeRunning ) return;
    
    // Compute current race time
    const seconds = runtime.wallTime - startWallTime;
    
    // Format it as HH:MM:SS
    const fTime = new Date(seconds * 1000).toISOString().slice(11, 19);
    
    // Set the timeText as the formatted time
    timeText.text = "Time: " + fTime;
}

function setCamera(runtime) {
    // Set camera position accordingly
    
    // Place the camera inside the car and make it shake if the car is slow
    const camX = car.x + Math.cos(car.angle) * 10;
    const camY = car.y + Math.sin(car.angle) * 10;
    const camZ = car.zElevation + 20 + (Math.random() - 0.5) * Math.max(
        (280/SHAKEINTENSITY - (car.behaviors.Car.speed + 30)/SHAKEINTENSITY), 0
    );
    
    // The camera should look to a point in front of the car, at all times
    camLookX = lerp(
        camLookX, car.x + Math.cos(car.angle) * 128, 0.1 * 60 * runtime.dt
    );
    camLookY = lerp(
        camLookY, car.y + Math.sin(car.angle) * 128, 0.1 * 60 * runtime.dt)
    ;
    const camLookZ = car.zElevation + 5; // Camera looking slightly down
    
    // Apply the changes
    camera.lookAtPosition(
        camX, camY, camZ, camLookX, camLookY, camLookZ, 0, 0, 1
    );
}

function processCarPhysics(runtime) {
    /* The rally car uses mostly the Car behavior physics, but also uses some
     * extra custom bits of physics to make the gameplay more enjoyable
     */
     
    const carSpeed = car.behaviors.Car.speed;
    const carMaxSpeed = car.behaviors.Car.maxSpeed;
    
    // The fastest the car is, the less it steers
    car.behaviors.Car.steerSpeed = STEERINGSPEED/57 - carSpeed/carMaxSpeed;
    
    // Limit backwards speed
    car.behaviors.Car.speed = Math.max(-50, carSpeed);
    
    // Move the speedometer pointer smoothly
    lerpCarSpeed = lerp(lerpCarSpeed, carSpeed, 0.1 * 60 * runtime.dt);
    speedPointer.angle = (
        3.75 + 2.23/(carMaxSpeed/2) * Math.abs(lerpCarSpeed)
    ) % (2 * Math.PI);
}

function rotateBillboards(runtime) {
    // Make trees always face the player
    for (const t of runtime.objects.TreeModel.getAllInstances()) {
        t.angle = (Math.atan2(car.y-t.y, car.x-t.x));
    }
    // Make bushes always face the player
    for (const b of runtime.objects.BushModel.getAllInstances()) {
        b.angle = (Math.atan2(car.y-b.y, car.x-b.x));
        // Destroy bushes that contact the fences, so that they don't overlap
        for (const f of runtime.objects.FenceModel.getAllInstances()) {
            if (b.testOverlap(f)) b.destroy();
        }
    }
}

function checkForEndOfRace() {
    // Check for the end of the race
    
    // While car has not reached the finish line or the race is ended, ignore.
    if (!car.testOverlap(flagPole) || endOfTheRace) return;
    
    // Restart with timer
    endOfTheRace = true;
    timeRunning = false;
    car.behaviors.Car.isIgnoringInput = true;
    textMessage(5);
    tutorialText.horizontalAlign = "center";
    tutorialText.behaviors.Fade.fadeInTime = 0.25;
    tutorialText.behaviors.Fade.fadeOutTime = 0;
    tutorialText.behaviors.Fade.startFade();
}

function textMessage(t) {
    // Recursive function for the countdown to restart the race
    
    // If the timer reaches 0 seconds, restart the game with a GO GO GO message
    if (t == 0) {
        resetVariables();
        tutorialText.text = "\n\nGO GO GO!";
        tutorialText.behaviors.Fade.fadeInTime = 0;
        tutorialText.behaviors.Fade.fadeOutTime = 2;
        tutorialText.behaviors.Fade.startFade();
        
    // Otherwise, reduce the counter by one and display it to the player
    } else {
        tutorialText.text = "Your " + timeText.text + "\n" +
        "Next race starting in " + t + " seconds..."
        setTimeout(() => textMessage(t-1), 1000);
    }
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    return (1 - amt) * start + amt * end;
}