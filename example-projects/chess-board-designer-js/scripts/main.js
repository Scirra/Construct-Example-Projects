/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * E-mail: ferreiramoreiramateus@gmail.com | X: @BonzerKitten
 *
 * Felipe Vaiano Calderan - Programmer
 * E-mail: fvcalderan@gmail.com | X: @fvcalderan
 *
 * Wesley Andrade - Artist
 * E-mail: wesleymatos1989@gmail.com | X: @andrart7
 *
 * Help us make new examples by supporting our work on
 * https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instances
let cursor;
let btnFEN2Board;
let btnBoard2FEN;
let chkCastleBK;
let chkCastleBQ;
let chkCastleWK;
let chkCastleWQ;
let chkNextB;
let chkNextW;
let inputEnPassant;
let inputFEN;
let inputFullmoves;
let inputHalfmoves;
let textInfo;

// Object interfaces
let piece;
let piecePicker;
let square;

// Global objects
let mouse;

// Gameplay variables
let dragging; // Piece currently being dragged

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});


async function onBeforeProjectStart(runtime) {
	// Code to run just before 'On start of layout'.
	
	// Get object instances
	cursor = runtime.objects.Cursor.getFirstInstance();
	btnFEN2Board = runtime.objects.BtnFEN2Board.getFirstInstance();
	btnBoard2FEN = runtime.objects.BtnBoard2FEN.getFirstInstance();
	chkCastleBK = runtime.objects.ChkCastleBK.getFirstInstance();
	chkCastleBQ = runtime.objects.ChkCastleBQ.getFirstInstance();
	chkCastleWK = runtime.objects.ChkCastleWK.getFirstInstance();
	chkCastleWQ = runtime.objects.ChkCastleWQ.getFirstInstance();
	chkNextB = runtime.objects.ChkNextB.getFirstInstance();
	chkNextW = runtime.objects.ChkNextW.getFirstInstance();
	inputEnPassant = runtime.objects.InputEnPassant.getFirstInstance();
	inputFEN = runtime.objects.InputFEN.getFirstInstance();
	inputFullmoves = runtime.objects.InputFullmoves.getFirstInstance();
	inputHalfmoves = runtime.objects.InputHalfmoves.getFirstInstance();
	textInfo = runtime.objects.TextInfo.getFirstInstance();
	
	// Get object interfaces
	piece = runtime.objects.Piece;
	piecePicker = runtime.objects.PiecePicker;
	square = runtime.objects.Square;
	
	// Get global objects
	mouse = runtime.mouse;
	
	// Set game variables
    dragging = null;
	
	// Build chess board
	buildBoard();
	
	// Place starting pieces
	FEN2Board();

	// Add onClick events for buttons and checkboxes
	btnFEN2Board.addEventListener("click", () => makeBoardFromFEN());
	btnBoard2FEN.addEventListener("click", () => Board2FEN());
	chkNextB.addEventListener("click", () => chkNextW.isChecked = false);
	chkNextW.addEventListener("click", () => chkNextB.isChecked = false);

	// Treat invalid inputs with on change event
	inputEnPassant.addEventListener("change", () => makeEnpassantInputValid());
	inputFullmoves.addEventListener("change", () => {
		inputFullmoves.text = Math.max(
			0, parseInt(inputFullmoves.text)
		).toString();
	});
	inputHalfmoves.addEventListener("change", () => {
		inputHalfmoves.text = Math.max(
			0, parseInt(inputHalfmoves.text)
		).toString();
	});
	
	// Mouse events
    runtime.addEventListener("mousedown", (e) => onMouseDown(e));
    runtime.addEventListener("mouseup", (e) => onMouseUp(e));

	// Start ticking
	runtime.addEventListener("tick", () => onTick(runtime));
}

function buildBoard(runtime) {
	// Build the chess table

	for (let j = 0; j < 8; j++) {
		for (let i = 0; i < 8; i++) {
			const s = square.createInstance("Game", 120 + i*64, 128 + j*64);
			s.setAnimation(((i + j) % 2).toString());
			[s.instVars.tileX, s.instVars.tileY] = [i, j];
		}
	}
}

function makeBoardFromFEN() {
	// Use FEN String to position the pieces and adjust the settings
	
	// Execute parsing and get errors
	const errors = FEN2Board();
	
	// If there are errors, show them to the user
	if (errors.size > 0) {
		textInfo.fontColor = [1, 0, 0];
		textInfo.text = "FEN String has errors:";
		for (const e of errors)
			textInfo.text += "\n - " + e;
	
	// Otherwise, tell the user that the string is correct
	} else {
		textInfo.fontColor = [0, 0.5, 0];
		textInfo.text = "FEN String is correct.";
	}
}

function makeEnpassantInputValid() {
	// Do not let the user type invalid en passant

	// Shorthand
	const enp = inputEnPassant.text;
	
	// If there is nothing written, en passant is unavailable
	if (enp.length == 0) return;

	// En passant can only have 2 characters: a letter and a number
	if (enp.length > 2) inputEnPassant.text = enp.substring(0, 2);

	// Check if letter and numbers are valid
	const c1 = (["a", "b", "c", "d", "e", "f", "g", "r"].includes(enp[0]));
	const c2 = (["3", "6"].includes(enp[1]));

	// If the letter is not valid, clear en passant input
	if (!c1) inputEnPassant.text = "";
	
	// If the number is not valid, keep only the letter
	if (!c2 && c1) inputEnPassant.text = enp[0];
}

function onMouseDown(e) {
	// Process mouse down events
	
	// If already dragging a piece, ignore
	if (dragging) return;
	
	// Pick piece from piece picker
	for (const pp of piecePicker.getAllInstances()) {
		if (cursor.testOverlap(pp)) {
		
			// Create the piece, set the animation, and assign it to dragging
			const p = piece.createInstance("Game", cursor.x, cursor.y);
			p.setAnimation(pp.animationName);
			dragging = p;
		}
	}
	
	// Pick piece from the board
	for (const p of piece.getAllInstances()) {
		if (cursor.testOverlap(p)) {
		
			// Remove piece from hierarchy and assign it to dragging
			p.removeFromParent();
			dragging = p;
		}
	}
}

function onMouseUp(e) {
	// Process mouse up events
	
	// If not dragging a piece, ignore
	if (!dragging) return;
	
	// Stores if the user dropped the piece on a valid position
	let validPos = false;
	
	// Get all squares and check if the piece was dropped on one of them
	for (const s of square.getAllInstances()) {
		if (cursor.testOverlap(s)) {
			// If the square already has a piece, it is invalid
			if (s.getChildCount() > 0 || !dragging) break;
		
			// Put the piece on the square and create a hierarchy
			[dragging.x, dragging.y] = [s.x, s.y];
			s.addChild(dragging);
			
			// User is no longer dragging a piece
			dragging = null;
			
			// Piece dropped on a valid position
			validPos = true;
		}
	}
	
	// If the piece was dropped on an invalid position, destroy it
	if (!validPos) {
		dragging.destroy();
		dragging = null;
	}
}

function destroyAllPieces() {
	// Destroy all pieces currently on the board
	
	for (let j = 0; j < 8; j++) {
		for (let i = 0; i < 8; i++) {
			for (const s of square.getAllInstances()) {
				if (s.instVars.tileX == i && s.instVars.tileY == j) {
					// Get child piece at square (i, j)
					const childPiece = s.getChildAt(0);
					
					// If it exists, remove it from hierarchy, then delete it
					if (childPiece) {
						s.removeChild(childPiece);
						childPiece.destroy();
					}
				}
			}
		}
	}
}

function FEN2Board() {
	// Parse FEN String and set the board/settings accordingly
	
	// Extract FEN parts from inputFEN
	let [board, next, castle, enp, halfm, fullm] = inputFEN.text.split(" ");
	
	// List of errors during FEN parsing
	let error = [];
	
	// Get next move
	switch (next) {
		case "w":
			chkNextW.isChecked = true;
			chkNextB.isChecked = false;
			break;
		case "b":
			chkNextW.isChecked = false;
			chkNextB.isChecked = true;
			break;
		default:
			error.push("Invalid next move");
	}
	
	// Clear castle options
	chkCastleBK.isChecked = false;
	chkCastleBQ.isChecked = false;
	chkCastleWK.isChecked = false;
	chkCastleWQ.isChecked = false;
	
	// Get castle options
	if (castle.length > 4) {
		error.push("Invalid castle option");
	} else {
		for (const c of castle) {
			switch (c) {
				case "K":
					chkCastleWK.isChecked = true;
					break;
				case "Q":
					chkCastleWQ.isChecked = true;
					break;
				case "k":
					chkCastleBK.isChecked = true;
					break;
				case "q":
					chkCastleBQ.isChecked = true;
					break;
				case "-":
					break;
				default:
					error.push("Invalid castle option");
			}
		}
	}

	// Clear en-passant input
	inputEnPassant.text = "";
	
	// Get en passant option
	if (enp.length == 1) {
		if (enp != "-") {
			error.push("Invalid en passant option");
		}
	} else {
		// Valid table positions range from "a" to "h"
		if (["a", "b", "c", "d", "e", "f", "g", "r"].includes(enp[0])) {
			inputEnPassant.text = inputEnPassant.text + enp[0];
		} else {
			inputEnPassant.text = "";
			error.push("Invalid en passant option");
		}
		
		// En passant are only possible on the 3rd and 6th rows
		if (["3", "6"].includes(enp[1])) {
			inputEnPassant.text = inputEnPassant.text + enp[1];
		} else {
			inputEnPassant.text = "";
			error.push("Invalid en passant option");
		}
	}

	// Get halfmoves
	const intHalfm = parseInt(halfm);
	if (isNaN(intHalfm) || intHalfm < 0) error.push("Invalid halmoves value");
	else inputHalfmoves.text = intHalfm.toString();
	
	// Get fullmoves
	const intFullm = parseInt(fullm);
	if (isNaN(intFullm) || intFullm < 0) error.push("Invalid fullmoves value");
	else inputFullmoves.text = intFullm.toString();

	// Place pieces on the board
	
	// Split board by rows
	const sboard = board.split("/");
	
	// Start current tile X and Y positions at (0, 0)
	let [currX, currY] = [0, 0];
	
	// Destroy all pieces currently on the board
	destroyAllPieces();
	
	// Loop each row of the board
	for (const row of sboard) {
		// Loop each square (character) of the row
		for (const char of row) {
		
			// Assign current square and remove child piece (if any)
			let currSq;
			for (const s of square.getAllInstances())
				if (s.instVars.tileX == currX && s.instVars.tileY == currY)		
					currSq = s;
			
			// If no square was assigned for this iteration, board is invalid
			if (currSq == null) {
				error.push("Invalid board");
				break;
			}
		
			// Character is a number, therefore empty spaces must be added
			if (char >= '0' && char <= '9') {
				currX += parseInt(char) - 1;

			// Character is a letter, so a new piece must be added to currSq
			} else {		
				// Check if letter is valid
				if (["P","N","B","R","Q","K"].includes(char.toUpperCase())) {
					// Create piece instance
					const p = piece.createInstance("Game", currSq.x, currSq.y);
					
					// Set the animation to match the informed letter
					p.setAnimation(
						char == char.toUpperCase() ? char : "_" + char
					);
					
					// Add piece to the current square
					currSq.addChild(p);
					
				// Invalid letter detected
				} else {
					error.push("Invalid board");
				}
			}
			
			// Got to the next currX
			currX++;
		}
		
		// Check if row has correct amount of elements
		if (currX != 8) error.push("Invalid board");
		
		// Reset CurrX and go to the next currY
		currX = 0;
		currY++;
	}
	
	// Check if board has correct amount of rows
	if (currY != 8) error.push("Invalid board");
	
	// If there is an error, clear the board
	if (error.length > 0) destroyAllPieces();
	
	// If an error happened, return it
	return new Set(error);
}

function Board2FEN() {
	// Parse board/settings and set the FEN String accordingly
	
	// Start with an empty FEN string
	let fen = "";
	
	// Add pieces to FEN
	for (let j = 0; j < 8; j++) {
	
		// Counter of blank spaces
		let blank = 0;
		
		for (let i = 0; i < 8; i++) {
			for (const s of square.getAllInstances()) {
				if (s.instVars.tileX == i && s.instVars.tileY == j) {
					// If square has a piece, add it to FEN
					if (s.getChildCount() > 0) {
						// Add blanks (if > 0) and reset the counter
						if (blank > 0) {
							fen += blank.toString();
							blank = 0;
						}
						
						// Add new piece
						const c = s.getChildAt(0).animationName;
						fen += c.length > 1 ? c[1] : c;
						
					// Otherwise, add to the counter of blank spaces
					} else {
						blank ++;
					}
				}
			}
		}
		
		// Add blanks (if > 0)
		if (blank > 0) fen += blank.toString();
		
		// Add separator
		if (j < 7) fen += "/";
	}
	
	// Add next move to FEN
	fen += chkNextB.isChecked ? " b " : " w ";

	// Add available castles to FEN (if none is available, add "-")
	let castles = chkCastleWK.isChecked || chkCastleWQ.isChecked ||
	              chkCastleBK.isChecked || chkCastleBQ.isChecked;
	if (chkCastleWK.isChecked) fen += "K";
	if (chkCastleWQ.isChecked) fen += "Q";
	if (chkCastleBK.isChecked) fen += "k";
	if (chkCastleBQ.isChecked) fen += "q";
	if (!castles) fen += "-";
	
	// Add en passant to FEN
	if (inputEnPassant.text.length == 2) fen += " " + inputEnPassant.text;
	else fen += " -";
	
	// Add halfmoves
	fen += " " + inputHalfmoves.text;
	
	// Add fullmoves
	fen += " " + inputFullmoves.text;
	
	inputFEN.text = fen;
}

function onTick(runtime) {
	// Code to run every tick.

	// Get current mouse position
    const mousePos = mouse.getMousePosition("Game");
    
    // Update invisible mouse pointer position
    cursor.setPosition(...mousePos);
    
    // Update dragged object position (if any)
    dragging?.setPosition(...mousePos);
}