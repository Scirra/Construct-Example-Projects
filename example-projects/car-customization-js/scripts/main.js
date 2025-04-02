/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira - Programmer
 * X: @BonzerKitten
 * E-mail: ferreiramoreiramateus@gmail.com
 *
 * Felipe Vaiano Calderan - Programmer
 * X: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 * X: @andrart7
 * E-mail: wesleymatos1989@gmail.com
 *
 * Help us make new examples by supporting our work on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Import Car class
import Car from "./car.js";


let car; // Car object
let camera; // Camera object
let menuItemList; // Menu items

// Gameplay variables
let menuItem; // Current selected menu item

// Constants
const MENUITEMS = 9; // Number of menu items


runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'.
    
    // Initial setup
    car = new Car(runtime);
    camera = runtime.objects.Camera3D;
    menuItemList = runtime.objects.MenuItem.getAllInstances();
    menuItem = 0;
    
    // Starting camera position
    camera.lookAtPosition(
        car.getX() + 84, car.getY() + 84, car.getZ() + 48,
        car.getX() - 32, car.getY(), car.getZ(),
        0, 0, 1
    )
    
    // Setup keyboard and start ticking
    runtime.addEventListener("keydown", e => onKeyDown(e));
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onKeyDown(e) {
    // Process player inputs
    
    // Change menu item
    if (e.key == "ArrowUp") {
        menuItem = menuItem == 0 ? MENUITEMS - 1 : menuItem - 1;
    }
    if (e.key == "ArrowDown") {
        menuItem = (menuItem + 1) % MENUITEMS
    }
    
    // Highlight selected menu
    for (const m of menuItemList) {
        if (m.instVars.id == menuItem) {
            m.colorRgb = [1.0, 1.0, 0.0];
        } else {
            m.colorRgb = [1.0, 1.0, 1.0];
        }
    }
    
    // Increase/Decrease current selected menu item
    switch (menuItem) {
        case 0: changeColorMenu(e); break;
        case 1: changeRimsMenu(e); break;
        case 2: changeSpoilerMenu(e); break;
        case 3: changeHoodMenu(e); break;
        case 4: changeExhaustMenu(e); break;
        case 5: changeStripesMenu(e); break;
        case 6: changeDecalsMenu(e); break;
        case 7: changeNeonMenu(e); break;
        case 8: changeHeightMenu(e); break;
    }
}

function changeColorMenu(e) {
    // Change car color

    if (e.key == "ArrowLeft") {
        car.changeColor(car.color == 0 ? car.MAXCOLOR - 1 : car.color - 1);
    } else if (e.key == "ArrowRight") {
        car.changeColor((car.color + 1) % car.MAXCOLOR);
    }
}

function changeRimsMenu(e) {
    // Change car rims
    
    if (e.key == "ArrowLeft") {
        car.changeRims(car.rims == 0 ? car.MAXRIMS - 1 : car.rims - 1);
    } else if (e.key == "ArrowRight") {
        car.changeRims((car.rims + 1) % car.MAXRIMS);
    }
}

function changeSpoilerMenu(e) {
    // Change car spoiler
    
    if (e.key == "ArrowLeft") {
        car.changeSpoiler(
            car.vspoiler == 0 ? car.MAXSPOILER - 1 : car.vspoiler - 1
        );
    } else if (e.key == "ArrowRight") {
        car.changeSpoiler((car.vspoiler + 1) % car.MAXSPOILER);
    }
}

function changeHoodMenu(e) {
    // Change car hood
    
    if (e.key == "ArrowLeft") {
        car.changeHood(car.vhood == 0 ? car.MAXHOOD - 1 : car.vhood - 1);
    } else if (e.key == "ArrowRight") {
        car.changeHood((car.vhood + 1) % car.MAXHOOD);
    }
}

function changeExhaustMenu(e) {
    // Change car exhaust
    
    if (e.key == "ArrowLeft") {
        car.changeExhaust(
            car.exhaust == 0 ? car.MAXEXHAUST - 1 : car.exhaust - 1
        );
    } else if (e.key == "ArrowRight") {
        car.changeExhaust((car.exhaust + 1) % car.MAXEXHAUST);
    }
}

function changeStripesMenu(e) {
    // Change car stripes
    
    if (e.key == "ArrowLeft") {
        car.changeStripes(
            car.stripes == 0 ? car.MAXSTRIPES - 1 : car.stripes - 1
        );
    } else if (e.key == "ArrowRight") {
        car.changeStripes((car.stripes + 1) % car.MAXSTRIPES);
    }
}

function changeDecalsMenu(e) {
    // Change car decals
    
    if (e.key == "ArrowLeft") {
        car.changeDecals(
            car.decals == 0 ? car.MAXDECALS - 1 : car.decals - 1
        );
    } else if (e.key == "ArrowRight") {
        car.changeDecals((car.decals + 1) % car.MAXDECALS);
    }
}

function changeNeonMenu(e) {
    // Change car neon
    
    if (e.key == "ArrowLeft") {
        car.changeNeon(
            car.vneon == 0 ? car.MAXNEON - 1 : car.vneon - 1
        );
    } else if (e.key == "ArrowRight") {
        car.changeNeon((car.vneon + 1) % car.MAXNEON);
    }
}

function changeHeightMenu(e) {
    // Change car neon
    
    if (e.key == "ArrowLeft") {
        car.changeHeight(-1);
    } else if (e.key == "ArrowRight") {
        car.changeHeight(1);
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    setCamera(runtime);
}

function setCamera(runtime) {
    // Ajust the camera & platform to focus on a point of interest

     switch(menuItem) {
        case 0: lookAtShort(runtime, null, 84, 84, 48); break;
        case 1: lookAtShort(runtime, Math.PI, 52, 52, 12); break;
        case 2: lookAtShort(runtime, 1.45 * Math.PI, 64, 64, 32); break;
        case 3: lookAtShort(runtime, 2.4*Math.PI, 68, 68, 48); break;
        case 4: lookAtShort(runtime, 1.3 * Math.PI, 64, 64, 16); break;
        case 5: lookAtShort(runtime, 0, 0, 64, 128); break;
        case 6: lookAtShort(runtime, -1.3*Math.PI, 58, 58, 56); break;
        case 7: lookAtShort(runtime, null, 68, 68, 18); break;
        case 8: lookAtShort(runtime, null, 68, 68, 18); break;
    }
}

function lookAtShort(runtime, angle, xOff, yOff, zOff) {
    // Shorthand for car angle and camera look at combo
    
    const camX = camera.getCameraPosition()[0];
    const camY = camera.getCameraPosition()[1];
    const camZ = camera.getCameraPosition()[2];
    
    // Set car angle (moving / static)
    if (angle == null) {
        car.setAngle(car.getAngle() + 0.01 * 60 * runtime.dt);
    } else {
        car.setAngle(angleLerp(car.getAngle(), angle, 6 * runtime.dt));
    }
    
    // Set camera look at position
    camera.lookAtPosition(
        lerp(camX, car.getX() + xOff, 0.1 * 60 * runtime.dt),
        lerp(camY, car.getY() + yOff, 0.1 * 60 * runtime.dt),
        lerp(camZ, 4 + zOff, 0.1 * 60 * runtime.dt),
        car.getX() - 32, car.getY(), 4,
        0, 0, 1
    )
}

function lerp(start, end, amt) {
    // Simple helper function for linear interpolation
    
    return (1 - amt) * start + amt * end;
}


function angleLerp(start, end, amt) {
    // Simple helper function for angle interpolation

    const cos = (1 - amt) * Math.cos(start) + amt * Math.cos(end);
    const sin = (1 - amt) * Math.sin(start) + amt * Math.sin(end);
    return Math.atan2(sin, cos);
}