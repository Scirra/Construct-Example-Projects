// This list of lists represents the state of the board
export let table = [
	["Empty", "Empty", "Empty"],
	["Empty", "Empty", "Empty"],
	["Empty", "Empty", "Empty"]
];

export function resetTable()
{
	// Reset the table to Empty
	table = [
		["Empty", "Empty", "Empty"],
		["Empty", "Empty", "Empty"],
		["Empty", "Empty", "Empty"]
	];
}

export function getEmpty(t)
{
	// Return empty spaces indices
	const emptyIndices = [];
	for (let x = 0; x < 3; x++)
		for (let y = 0; y < 3; y++)
			if (t[x][y] == "Empty")
				emptyIndices.push({x: x, y: y});
	return emptyIndices;
}

export function checkGameOver(t)
{
	// Check if a player has won the match
	if (t[0][0] == t[0][1] && t[0][1] == t[0][2] && t[0][0] != "Empty")
		return { player: t[0][0], spaces: [[0, 0], [0, 1], [0, 2]] };
	else if (t[1][0] == t[1][1] && t[1][1] == t[1][2] && t[1][0] != "Empty")
		return { player: t[1][0], spaces: [[1, 0], [1, 1], [1, 2]] };
	else if (t[2][0] == t[2][1] && t[2][1] == t[2][2] && t[2][0] != "Empty")
		return { player: t[2][0], spaces: [[2, 0], [2, 1], [2, 2]] };
	else if (t[0][0] == t[1][0] && t[1][0] == t[2][0] && t[0][0] != "Empty")
		return { player: t[0][0], spaces: [[0, 0], [1, 0], [2, 0]] };
	else if (t[0][1] == t[1][1] && t[1][1] == t[2][1] && t[0][1] != "Empty")
		return { player: t[0][1], spaces: [[0, 1], [1, 1], [2, 1]] };
	else if (t[0][2] == t[1][2] && t[1][2] == t[2][2] && t[0][2] != "Empty")
		return { player: t[0][2], spaces: [[0, 2], [1, 2], [2, 2]] };
	else if (t[0][0] == t[1][1] && t[1][1] == t[2][2] && t[0][0] != "Empty")
		return { player: t[0][0], spaces: [[0, 0], [1, 1], [2, 2]] };
	else if (t[0][2] == t[1][1] && t[1][1] == t[2][0] && t[0][2] != "Empty")
		return { player: t[0][2], spaces: [[0, 2], [1, 1], [2, 0]] };
	// Check for a draw
	else if (getEmpty(t).length == 0)
		return { player: "Draw", spaces: null};
	// Nothing special going on
	else
		return { player: "Nothing", spaces: null};
}

export function minimax(t, player, a, b, depth)
{
	// Minimax algorithm with Alpha-Beta pruning
	
	// Check if game is over. Depth is an incentive to win as fast as possible
	const whoWon = checkGameOver(t).player;
	if      (whoWon == "Nought") return { score: -10 + depth, bestMove: null };
	else if (whoWon == "Cross" ) return { score:  10 - depth, bestMove: null };
	else if (whoWon == "Draw"  ) return { score:   0        , bestMove: null };
	
	// Shuffled possible moves. NOTE: not the best way to shuffle, but sufficient
	const moveList = getEmpty(t).sort(() => 0.5 - Math.random());
	
	let bestMove;
	let bestScore;
	
	// Crosses try to maximize the score
	if (player == "Cross") {
		bestScore = -Infinity;
		for (const move of moveList) {
			t[move.x][move.y] = "Cross"; // Do the move
			const score = minimax(t, "Nought", a, b, depth + 1).score;
			t[move.x][move.y] = "Empty"; // Undo the move
			if (score > bestScore) {
				bestScore = score; // Save best score
				bestMove = move;   // Save best move
			}
			// Pruning
			a = Math.max(a, score);
			if (a >= b) break;
		}
		return {score: bestScore, bestMove: bestMove};
		
	// Noughts try to minimize the score
	} else {
		bestScore = Infinity;
		for (const move of moveList) {
			t[move.x][move.y] = "Nought"; // Do the move
			const score = minimax(t, "Cross", a, b, depth + 1).score;
			t[move.x][move.y] = "Empty"; // Undo the move
			if (score < bestScore) {
				bestScore = score; // Save best score
				bestMove = move;   // Save best move
			}
			// Pruning
			b = Math.min(b, score);
			if (b <= a) break;
		}
		return {score: bestScore, bestMove: bestMove};
	}
}