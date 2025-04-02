/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * X: @BonzerKitten
 * E-mail: ferreiramoreiramateus@gmail.com
 *
 * Felipe Vaiano Calderan - Programmer
 * X: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 *
 * E-mail: wesleymatos1989@gmail.com
 * X: @andrart7
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instaces
let mPointer;
let buttonCheck;
let buttonRestart;

// List of instances
let pickers;

// Object interfaces
let slot;
let piece;

// Global objects
let keyboard;
let mouse;

// Game variables
let itb; // Initial table values (loaded from JSON)
let table; // Stores NumberSlots
let dragging; // NumberPiece currently being dragged
let gameOver; // Is the game over?

// Settings
const PIECESIZE = 96; // Piece side size
const LEFTMOST = 548; // Leftmost position for the table
const TOPMOST = 128; // Topmost position for the table
const SMALLGAP = PIECESIZE + 4; // Small gap between pieces
const LARGEGAP = PIECESIZE + 16; // Large gap between pieces
const STARTCHANCE = 0.6; // Chance of a slot starting filled
const ERRCOLOR = [1.0, 0.2, 0.2]; // Error color
const WINCOLOR = [0.2, 1.0, 0.2]; // Win color

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});


async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Things that happen before the layout starts
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Mouse events
    runtime.addEventListener("mousedown", (e) => onMouseDown(e));
    runtime.addEventListener("mouseup", (e) => onMouseUp(e, runtime));
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));    
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Get instances
    mPointer = runtime.objects.MousePointer.getFirstInstance();
    buttonCheck = runtime.objects.ButtonCheck.getFirstInstance();
    buttonRestart = runtime.objects.ButtonRestart.getFirstInstance();
    
    // Get list of instances
    pickers = runtime.objects.NumberPicker.getAllInstances();
    
    // Get object interfaces
    slot = runtime.objects.NumberSlot;
    piece = runtime.objects.NumberPiece;
    
    // Get global objects
    mouse = runtime.mouse;
    
    // Set game variables
    dragging = null;
    gameOver = false;
    
    // Load initial table
    fetch('./initialTable.json')
    .then((response) => response.json())
    .then((json) => {
        // Pick a seed
        const itbObj = json["seeds"][
            Math.floor(Math.random() * json["seeds"].length)
        ];
        
        // Create 2D array from an object
        itb = Object.keys(itbObj).sort().map(key => itbObj[key])
        
        // Permute numbers, rows and cols
        permuteTable();
        
        // Build Sudoku table
    }).then(() => buildTable());
}

function shuffleNumbers() {
    // Randomly swap all instances of a number by another
    
    for (let i = 1; i <= 9; i++) {
        const rnd = Math.floor(Math.random() * itb.length) + 1;
        
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (itb[x][y] == i) itb[x][y] = rnd;
                else if (itb[x][y] == rnd) itb[x][y] = i;
            }
        }
    }
}

function shuffleRows() {
    // Randomly swap rows
    
    for (let i = 0; i < 9; i++) {
        const j = Math.floor(i / 3) * 3 + Math.floor(Math.random() * 3);
        [itb[i], itb[j]] = [itb[j].slice(), itb[i].slice()];
    }
}

function shuffleCols() {
    // Randomly swap columns

    for (let i = 0; i < 9; i++) {
        const j = Math.floor(i / 3) * 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < 9; k++){
            [itb[k][i], itb[k][j]] = [itb[k][i], itb[k][j]];
        }
    }
}

function permuteTable() {
    // Use a series of algorithms to permute the table
    
    shuffleNumbers();
    shuffleRows();
    shuffleCols();
}

function buildTable() {
    // Build Sudoku table
    
    // Create a 9 x 9 table with nulls
    table = Array.from({length: 9}, () => Array(9).fill(null));
    
    // Current X and Y positions
    let currX = LEFTMOST;
    let currY = TOPMOST;

    for (let j = 0; j < 9; j++) {
        for (let i = 0; i < 9; i++) {
            // Create the slot
            const s = slot.createInstance("Game", currX, currY);
            
            // Set its coordinates
            s.instVars.xCoord = j;
            s.instVars.yCoord = i;
            
            // STARTCHANCE of slot having a fixed initial value
            if (Math.random() < STARTCHANCE) {
                s.setAnimation("Fixed");
                s.animationFrame = itb[j][i];
            
            // 1-STARTCHANCE of this slot being empty
            } else {
                s.animationFrame = 0;
            }
            
            // Store it in the table array
            table[i][j] = s;
            
            // Increment X position according to GAP size
            currX += (i % 3 == 2) ? LARGEGAP : SMALLGAP;
        } 
        
        // Increment Y position according to GAP size
        currY += (j % 3 == 2) ? LARGEGAP : SMALLGAP;
        
        // Reset X position to LEFTMOST
        currX = LEFTMOST;
    }
}

function onMouseDown(e) {
    // Process mouse down event
    
    // Player must not be dragging a piece and the game must not be over
    if (dragging || gameOver) {
        return;
    }
        
    // Check if the player clicked a non-empty NumberPicker
    for (const s of slot.getAllInstances()) {
        if (
            mPointer.testOverlap(s) &&
            s.animationFrame != 0 &&
            s.animationName != "Fixed"
        ) {

            // Create a NumberPiece below the mouse
            const p = piece.createInstance("Game", mPointer.x, mPointer.y);
            
            // Make it the same number as the picker
            p.animationFrame = s.animationFrame;
            
            // Play a quick bounce animation
            p.behaviors.Tween.startTween(
                "size", [p.imageWidth * 1.2, p.imageHeight * 1.2],
                0.1, "in-out-sine", {pingPong: true}
            );

            // Set dragged object to created piece
            dragging = p;
            
            // Set slot animation as empty
            s.animationFrame = 0;
        }
    }
    
    // Check if the player clicked a NumberSlot
    for (const pck of pickers) {
        if (mPointer.testOverlap(pck)) {

            // Create a NumberPiece below the mouse
            const p = piece.createInstance("Game", mPointer.x, mPointer.y);

            // Make it the same number as the picker
            p.animationFrame = pck.animationFrame;
            
            // Play a quick bounce animation
            p.behaviors.Tween.startTween(
                "size", [p.imageWidth * 1.2, p.imageHeight * 1.2],
                0.1, "in-out-sine", {pingPong: true}
            );

            // Set dragged object to created piece
            dragging = p;
        }
    }
}

function onMouseUp(e, runtime) {
    // Process mouse up event

    // Execute RESTART button press action
    if (mPointer.testOverlap(buttonRestart) || gameOver) {
        runtime.goToLayout(1);
    }
    
    // Execute CHECK button press action
    if (mPointer.testOverlap(buttonCheck) && !gameOver) {
    
        // If the player got everything correct, play a nice animation
        if (checkSolution()) {
            playWinAnimation(0, 0);
        }
        
        // Game is over
        gameOver = true;
    }
    
    // Player must be dragging a piece
    if (!dragging) {
        return;
    }

    // Store if the player has performed a valid click
    let validClick = false; 

    // Check if player clicked a slot
    for (const s of slot.getAllInstances()) {
        if (mPointer.testOverlap(s)) {

            // If the slot is empty, "place" the dragged piece there
            if (s.animationFrame == 0) {

                // Set the slot animation equal to the dragged piece
                s.animationFrame = dragging.animationFrame;

                // Destroy the dragged piece
                dragging.destroy();
                dragging = null;

                // Player performed a valid click
                validClick = true;
            }
        }
    }

    // If the player didn't perform a valid click, destroy dragged piece
    if (!validClick) {
    
        // Play a sinking animation
        dragging.behaviors.Tween.startTween(
            "size", [0, 0], 0.25, "in-out-sine", {destroyOnComplete: true}
        );
        dragging = null;
    }
}

function findErrors(arr) {
    // Find repeated numbers or zeroes inside an array/set
    
    // Start with an empty list of indices
    let indices = [];
    
    // Go through the array
    for (let i = 0; i < arr.length; i++) {
    
        // if a zero is found, push the index to indices array
        if (arr[i] == 0) {
            indices.push(i);
        }
        
        for (let j = 0; j < i; j++) {
        
            // If a repetition is found, push the indices to indices array
            if (arr[i] == arr[j]) {
                indices.push(j);
                indices.push(i);
            }
        }
    }
    
    // Return a set of the indices array to eliminta duplicate indices
    return new Set(indices);
}

function playWinAnimation(i, j) {
    // Play an animation where pieces sequentially turn WINCOLOR
    
    // Shorthand for the table
    let s = table[i][j];
    
    // Move piece to the top
    s.moveToTop();
    
    // Change the color to WINCOLOR
    s.behaviors.Tween.startTween("color", WINCOLOR, 0.5, "in-out-sine");
    
    // Size bounce animation
    s.behaviors.Tween.startTween(
        "size", [s.imageWidth * 1.2, s.imageHeight * 1.2],
        0.25, "in-out-sine", {pingPong: true}
    );
    
    // increment i to go to the next piece
    i++;
    
    // If i reached the maximum value, reset it and increment j
    if (i == table[j].length) {
        i = 0;
        j++;
    }
    
    // While j hasn't reached the maximum value, recursively call the function
    if (j != table.length) {
        setTimeout(() => playWinAnimation(i, j), 25);
    }
}

function showError(s) {
    // Animate and paint the slot to reveal an error
    
    s.moveToTop();
    s.behaviors.Tween.startTween("color", ERRCOLOR, 0.5, "in-out-sine");
    s.behaviors.Tween.startTween(
        "size", [s.imageWidth * 1.2, s.imageHeight * 1.2],
        0.25, "in-out-sine", {pingPong: true}
    );
}

function checkSolution() {
    /* Check if the solution is correct. Note that we can't just compare with
     * the intial board, since the puzzle generator doesn't check uniqueness.
     * A solution is correct if there are no repeated numbers in rows, cols or
     * boxes, according to Sudoku rules
    */
    
    // Assume the solution is correct
    let correct = true;
    
    // Check columns
    for (let i = 0; i < table.length; i++) {
        
        // Find errors
        const errors = findErrors(table[i].map(obj => obj.animationFrame));

        // If there is an error, show the wrong slots and toggle correct
        correct &= errors.size == 0
        errors.forEach(e => showError(table[i][e]));
    }
    
    // Check rows
    for (let i = 0; i < table[0].length; i++) {
        
        // Get row
        const  row = table.map(row => row[i]);
        
        // Find errors
        const errors = findErrors(row.map(obj => obj.animationFrame));
        
        // If there is an error, show the wrong slots and toggle correct
        correct &= errors.size == 0
        errors.forEach(e => showError(row[e]));
    }

    // Check blocks
    for (let cby = 0; cby < 9; cby += 3) {
        for (let cbx = 0; cbx < 9; cbx += 3) {
            
            // Get block starting at (cbx, cby)
            let sliced = [];
            for (let j = cby; j < cby + 3; j++) {
                for (let i = cbx; i < cbx + 3; i++) {
                    sliced.push(table[i][j])
                }
            }
            
            // Find errors
            const errors = findErrors(sliced.map(obj => obj.animationFrame));
            
            // If there is an error, show the wrong slots and toggle correct
            correct &= errors.size == 0
            errors.forEach(e => showError(sliced[e]));
        }
    }
    
    // Return if the player got everything correct or not
    return correct;
}

function onTick(runtime) {
    // Code to run every tick
    
    // Get current mouse position
    const mousePos = mouse.getMousePosition("Game");
    
    // Update invisible mouse pointer position
    mPointer.setPosition(...mousePos);
    
    // Update dragged object position (if any)
    dragging?.setPosition(...mousePos);
}