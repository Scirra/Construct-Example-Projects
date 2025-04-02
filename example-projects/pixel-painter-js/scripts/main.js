/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

// Available colors.
const COLORS = {
    none:       [0.0000, 0.0000, 0.0000, 0.0000],
    black:      [0.0000, 0.0000, 0.0000, 1.0000],
    darkblue:   [0.1137, 0.1686, 0.3255, 1.0000],
    darkpurple: [0.4941, 0.1451, 0.3255, 1.0000],
    darkgreen:  [0.0000, 0.5294, 0.3176, 1.0000],
    brown:      [0.6706, 0.3216, 0.2118, 1.0000],
    darkgray:   [0.3725, 0.3412, 0.3098, 1.0000],
    gray:       [0.7608, 0.7647, 0.7804, 1.0000],
    white:      [1.0000, 0.9451, 0.9098, 1.0000],
    red:        [1.0000, 0.0000, 0.3020, 1.0000],
    orange:     [1.0000, 0.6392, 0.0000, 1.0000],
    yellow:     [1.0000, 0.9255, 0.1529, 1.0000],
    green:      [0.0000, 0.8941, 0.2118, 1.0000],
    blue:       [0.1608, 0.6784, 1.0000, 1.0000],
    lavender:   [0.5137, 0.4627, 0.6118, 1.0000],
    pink:       [1.0000, 0.4667, 0.6588, 1.0000],
    peach:      [1.0000, 0.8000, 0.6667, 1.0000]
};

// References to instances and interfaces.
let mouse, toolButtons, colorButtons;
let canvas, tempCanvas, cursor, cursorPx, newButton;
let saveButton, themeButton, background, canvasBG;

// Variables.
let leftButton = false;            // Is left mouse button currently pressed?
let toolOperation = false;        // Is a tool operation in progress?
let pLoc = {x: -1, y: -1};        // Previous mouse location.
let currColor = COLORS.black;    // Currently selected color.
let currTool = "Pencil";        // Currently selected tool.
let dStart = {x: -1, y: -1};    // Position where a drag action started.
let tempButton = null;            // Button temporarily clicked down.
let theme = 0;                    // 0 = Light theme | 2 = Dark theme.

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => OnBeforeProjectStart(runtime)
    );
});

async function OnBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'.
    
    // Get instances.
    canvas = runtime.objects.Canvas.getFirstInstance();
    tempCanvas = runtime.objects.TempCanvas.getFirstInstance();
    cursor = runtime.objects.Cursor.getFirstInstance();
    cursorPx = runtime.objects.CursorPx.getFirstInstance();
    newButton = runtime.objects.New.getFirstInstance();
    saveButton = runtime.objects.Save.getFirstInstance();
    themeButton = runtime.objects.Theme.getFirstInstance();
    background = runtime.objects.Background.getFirstInstance();
    canvasBG = runtime.objects.CanvasBackground.getFirstInstance();
    
    // Get list of instances.
    colorButtons = runtime.objects.Color.getAllInstances();
    toolButtons = runtime.objects.Tool.getAllInstances();
    
    // Remove mouse cursor.
    runtime.mouse.setCursorStyle("None");
    
    // Mouse events.
    runtime.addEventListener("pointerdown", e => onMouseDown(e, runtime));
    runtime.addEventListener("pointerup", e => onMouseUp(e, runtime));
    runtime.addEventListener("pointermove", e => onMouseMove(e, runtime));
}

// Auxiliary functions =========================================================

function canvasPos(e, runtime) {
    // Return correct cursor position over the canvas.
    
    // Get layer position from client's cursor position.
    const lay = runtime.layout.getLayer("CanvasLayer");
    let [x, y] = lay.cssPxToLayer(e.clientX, e.clientY);
    
    // Get canvas position from layer position.
    x = Math.floor(x - canvas.x);
    y = Math.floor(y - canvas.y);
    
    return [x, y]; // Return x and y coordinates.
}

function cursorOverObj(c, e, runtime) {
    // Check if cursor is over a given object.
    
    return c.containsPoint(
        ...runtime.layout.getLayer("CanvasLayer")
        .cssPxToLayer(e.clientX, e.clientY)
    )
}

function saveImage(imageData) {
    // Save canvas image to PNG.
    
    // Create a temporary standard canvas and set its properties.
    const c = document.createElement('canvas');
    c.width = imageData.width;
    c.height = imageData.height;
    
    // Put image data into the canvas.
    c.getContext('2d').putImageData(imageData, 0, 0);

    // Convert contents into a blob and invoke a download.
    c.toBlob(function(blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "PixelPainterImage.png";
        link.click();
    }, 'image/png');
    
    c.remove(); // Remove the canvas from the DOM.
}

// Mouse events ================================================================

function onMouseDown(e, runtime) {
    // Process mouse down events.
    
    const [x, y] = canvasPos(e, runtime); // Get canvas (x, y).
    
    // Left mouse button.
    if (e.button == 0) {
        
        // Check if the user clicked a color that is not yet selected.
        for (const c of colorButtons) {
            if (cursorOverObj(c, e, runtime) && c.animationFrame % 2 == 0) {
                c.animationFrame = 1 + theme;
                tempButton = c;
            }
        }
        
        // Check if the user clicked a tool that is not yet selected.
        for (const t of toolButtons) {
            if (cursorOverObj(t, e, runtime) && t.animationFrame % 2 == 0) {
                t.animationFrame = 1 + theme;
                tempButton = t;
            }
        }
        
        // Check if the user clicked the new button.
        if (
            cursorOverObj(newButton, e, runtime) &&
            newButton.animationFrame % 2 == 0
        ) {
            newButton.animationFrame = 1 + theme;
            tempButton = newButton;
        }
        
        // Check if the user clicked the save button.
        if (
            cursorOverObj(saveButton, e, runtime) &&
            saveButton.animationFrame % 2 == 0
        ) {
            saveButton.animationFrame = 1 + theme;
            tempButton = saveButton;
        }
        
        // Check if user clicked the theme button.
        if (cursorOverObj(themeButton, e, runtime)) {
            // Swap theme.
            theme = Math.abs(theme - 2);
            
            // Apply theme to objects.
            themeButton.animationFrame = +(theme == 2);
            background.animationFrame = +(theme == 2);
            canvasBG.animationFrame = +(theme == 2);
            cursor.animationFrame = +(theme == 2);
            toolButtons.forEach(
                t => t.animationFrame = t.animationFrame % 2 + theme
            )
            colorButtons.forEach(
                c => c.animationFrame = c.animationFrame % 2 + theme
            )
            newButton.animationFrame = newButton.animationFrame % 2 + theme;
            saveButton.animationFrame = saveButton.animationFrame % 2 + theme;
            
        }
        
        // If the cursor is inside the canvas, start painting.
        if (cursorOverObj(canvas, e, runtime)) {
            applyCurrentTool(x, y); // Apply current tool.
            leftButton = true; // Left button is pressed.
            toolOperation = true; // Start a tool operation.
        }
    }
    
    // Set previous location.
    [pLoc.x, pLoc.y] = [x, y];
}

function onMouseMove(e, runtime) {
    // Process mouse down events.
    
    const [x, y] = canvasPos(e, runtime); // Get canvas (x, y).
    
    // Set cursor position (not constrained by pixel position).
    const lay = runtime.layout.getLayer("CanvasLayer");
    const [mx, my] = lay.cssPxToLayer(e.clientX, e.clientY);
    cursor.setPosition(mx, my);
    
    // Set cursor animation.
    if (cursorOverObj(canvas, e, runtime)) {
        cursor.setAnimation(
            currTool == "Eraser" ? "Eraser" : "Others"
        );
        cursorPx.isVisible = currTool != "Eraser";
    } else {
        cursor.setAnimation("Pointer");
        cursorPx.isVisible = false;
    }
    cursor.animationFrame = +(theme == 2);
    
    // Left mouse button.
    if (leftButton && toolOperation) {
        if (["Pencil", "Eraser"].includes(currTool)) {
            applyCurrentTool(x, y);
        } else if (["Line", "Ellipse", "Rectangle"].includes(currTool)) {
            applyCurrentDragTool(x, y);
        }
        
        [pLoc.x, pLoc.y] = [x, y]; // Set previous location.
    }
}

function onMouseUp(e, runtime) {
    // Process mouse up events.
    
    const [x, y] = canvasPos(e, runtime); // Get canvas (x, y).
    [pLoc.x, pLoc.y] = [-1, -1]; // Set previous location.
    
    // Left button is up.    
    if (e.button == 0) {
    
        // Reset tempButton animation, if necessary.
        if (tempButton && tempButton.animationFrame % 2 != 0) {
            tempButton.animationFrame -= 1;
        }
    
        // Check if the user selected a color.
        for (const c of colorButtons) {
            if (cursorOverObj(c, e, runtime) && c == tempButton) {
                currColor = COLORS[c.animationName];
                colorButtons.forEach(b => b.animationFrame = theme);
                c.animationFrame = 1 + theme;
                cursorPx.colorRgb = currColor;
            }
        }
        
        // Check if the user selected a tool.
        for (const t of toolButtons) {
            if (cursorOverObj(t, e, runtime) && t == tempButton) {
                currTool = t.animationName;
                toolButtons.forEach(b => b.animationFrame = theme);
                t.animationFrame = 1 + theme;
            }
        }
        
        // Check if the user clicked the new button.
        if (
            cursorOverObj(newButton, e, runtime) && newButton == tempButton
        ) {
            newButton.animationFrame = theme;
            canvas.clearCanvas(COLORS.none);
        }
        
        // Check if the user clicked the save button.
        if (
            cursorOverObj(saveButton, e, runtime) && saveButton == tempButton
        ) {
            saveButton.animationFrame = theme;
            canvas.getImagePixelData().then(img => saveImage(img));
        }
        
        // Check if there is a pending drawing to be made permanent.
        if (
            ["Line", "Ellipse", "Rectangle"].includes(currTool) && toolOperation
        ) {
            applyCurrentDragTool(x, y, true);
        }
        
        // Left button released and tool operation stopped.
        leftButton = false;
        toolOperation = false;
        
        // Reset tempButton, as no tool is currently being selected.
        tempButton = null;
    }
}

// General tool functions ======================================================

function applyCurrentTool(x, y) {
    // Apply current tool.
    
    switch (currTool) {
        case "Pencil":    pencilTool(x, y);               break;
        case "Eraser":    eraserTool(x, y);               break;
        case "Line":      [dStart.x, dStart.y] = [x, y];  break;
        case "Rectangle": [dStart.x, dStart.y] = [x, y];  break;
        case "Ellipse":   [dStart.x, dStart.y] = [x, y];  break;
        case "Bucket":    bucketTool(x, y);               break;
    }
}

function applyCurrentDragTool(x, y, permanent=false) {
    // Update current tool.
    
    switch (currTool) {
        case "Line":      dragTool(x, y, "Line", permanent);      break;
        case "Rectangle": dragTool(x, y, "Rectangle", permanent); break;
        case "Ellipse":   dragTool(x, y, "Ellipse", permanent);   break;
    }
}

// Pencil tool =================================================================

function pencilTool(x, y) {
    // Paint canvas using the pencil tool.
    
    if (pLoc.x == -1 || pLoc.y == -1) {
        canvas.fillRect(x, y, x + 1, y + 1, currColor);
    } else {
        canvas.fillRect(pLoc.x, pLoc.y, pLoc.x + 1, pLoc.y + 1, currColor);
        canvas.fillRect(x, y, x + 1, y + 1, currColor);
        canvas.line(pLoc.x, pLoc.y, x, y, currColor, 1);
    }
}

// Eraser tool =================================================================

function eraserTool(x, y) {
    // Erase canvas using the eraser tool.

    canvas.clearRect(x - 4, y - 4, x + 4, y + 4, COLORS.none);
    tempCanvas.clearRect(x - 4, y - 4, x + 4, y + 4, COLORS.none);
}

// Drag tools ==================================================================

function dragTool(x, y, tool, permanent=false) {
    // Draw a line on the canvas.
    
    // Draw to temporary or permanent canvas?
    const drawTo = permanent ? canvas : tempCanvas;
    
    // Apply drawing.
    tempCanvas.clearCanvas(COLORS.none);
    
    // Set starting and ending points.
    const [startX, endX] = [Math.min(dStart.x, x), Math.max(dStart.x, x)];
    const [startY, endY] = [Math.min(dStart.y, y), Math.max(dStart.y, y)];
    
    // Select drag-type tool.
    switch (tool) {
        case "Line":
            drawTo.fillRect(
                dStart.x, dStart.y, dStart.x + 1, dStart.y + 1, currColor
            );
            drawTo.fillRect(x, y, x + 1, y + 1, currColor);
            drawTo.line(dStart.x, dStart.y, x, y, currColor, 1);
            break;
        case "Rectangle":
            drawTo.outlineRect(startX, startY, endX, endY, currColor, 1);
            break;
        case "Ellipse":
            drawTo.outlineEllipse(
                Math.abs(endX + startX) / 2, Math.abs(endY + startY) / 2,
                Math.abs(endX - startX) / 2, Math.abs(endY - startY) / 2,
                currColor, 1, false
            );
            break;
    }
    
}

// Bucket tool =================================================================

async function bucketTool(x, y) {
    // Fill area with current selected color.
    
    // Fix small offset issue.
    let xOffset = 0, yOffset = 0;
    
    if (x == canvas.width - 1) {
        x = canvas.width - 2;
        xOffset = 1;
    }
    if (y == canvas.height - 1) {
        y = canvas.height - 2;
        yOffset = 1;
    }
    
    // Invalid placement (outside canvas).
    if (!canvas.containsPoint(x + canvas.x + 1, y + canvas.y + 1)) return;
    
    // Apply offset (if necessary).
    x += xOffset;
    y += yOffset;

    const pxData = await canvas.getImagePixelData(); // Get pixel data.
    const color2Replace = getPxColor(pxData, x, y); // Get color to be replaced.
    floodFill(pxData, x, y, color2Replace); // Apply flood fill algorithm.
    canvas.loadImagePixelData(pxData); // Load new data into the canvas.
}

function getPxColor(pxData, x, y) {
    // Get pixel color (r, g, b, a) at (x, y).
    
    const color = [];
    
    for (let i = 0; i < 4; i++) {
        color.push(pxData.data[4 * (pxData.width * y + x) + i]);
    }
    
    return color;
}

function setPxColor(pxData, x, y) {
    // Set pixel color at (x, y).
    
    // Map currColor to 0-255 range.
    const cc255 = currColor.map(v => Math.round(v * 255));
    
    // Set (r, g, b, a).
    for (let i = 0; i < 4; i++) {
        pxData.data[4 * (pxData.width * y + x) + i] = cc255[i];
    }
}

function coordEq(a, b) {
    // Compare coordinates a and b.
    
    return a[0] == b[0] && a[1] == b[1];
}

function colorEq(a, b) {
    // Compare colors a and b.
    
    return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
}

function floodFill(pxData, x, y, c2r) {
    // Use Breadth-First Search to perform a flood fill
    // Reference: https://en.wikipedia.org/wiki/Breadth-first_search

    // Map currColor to 0-255 range.
    const cc255 = currColor.map(v => Math.round(v * 255));

    // Directions for moving in the canvas (right, left, down, up).
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0]
    ];
    
    // Setup conditions to abort a flood fill operation.
    const incorrectColor = !colorEq(getPxColor(pxData, x, y), c2r);
    const alreadyThatColor = colorEq(getPxColor(pxData, x, y), cc255);

    // Check for abort conditions.
    if (incorrectColor || alreadyThatColor) {
        return;
    }

    const queue = [[x, y]]; // BFS queue.

    // BFS loop.
    while (queue.length > 0) {
        
        const [currX, currY] = queue.shift(); // Gete element from the queue.
        setPxColor(pxData, currX, currY); // set pixel color as currColor.

        // Explore neighbors.
        for (const [dx, dy] of directions) {
            const newX = currX + dx, newY = currY + dy;

            // Setup conditions to add new neighbor.
            const insideX = newX >= 0 && newX < pxData.width;
            const insideY = newY >= 0 && newY < pxData.height;
            const compatible = colorEq(getPxColor(pxData, newX, newY), c2r);
            const notInQueue = !queue.some(arr => coordEq(arr, [newX, newY]))
            
            // If all conditions are met, push it into the queue.
            if (insideX && insideY && compatible && notInQueue)
                queue.push([newX, newY]);
        }
    }
}