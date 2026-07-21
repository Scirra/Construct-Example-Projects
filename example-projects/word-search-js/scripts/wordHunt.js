function canPlace(table, word, x, y, dx, dy) {
    // Check whether a word can be placed at a given position.

    for (let i = 0; i < word.length; i++) {
        // Get current position on the board.
        const px = x + dx * i;
        const py = y + dy * i;

        // Letters cannot be placed outside the board.
        if (px < 0 || px >= table.width || py < 0 || py >= table.height) {
            return false;
        }

        // Get current letter.
        const cell = table.grid[py][px];

        // Letters cannot be placed over DIFFERENT letters.
        if (cell !== null && cell !== word[i]) {
            return false;
        }
    }

    return true;
}

export class Table {
    constructor(width, height, words) {
        // Generate a Word Search table.

        this.width = width;
        this.height = height;

        // Define relevant constants.
        const DIRECTIONS = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1],
        ];
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const MAX_ATTEMPTS = 100;

        // Build grid and fill it with null.
        this.grid = Array.from(
            { length: height }, () => Array(width).fill(null)
        );

        // Sort by decreasing length, so longer words are placed first.
        const sortedWords = [...words].sort(
            (a, b) => b.length - a.length
        );

        // Track placed and unplaced words.
        this.placedWords = [];
        this.unplacedWords = [];

        for (const originalWord of sortedWords) {
            // In case the word has mixed case, make it fully uppercase.
            const word = originalWord.toUpperCase();

            let placed = false;

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                // Pick a random (x, y) position on the board.
                const x = Math.floor(Math.random() * width);
                const y = Math.floor(Math.random() * height);

                // Pick a random direction.
                const [dx, dy] = DIRECTIONS[
                    Math.floor(Math.random() * DIRECTIONS.length)
                ];

                // Place the word at (x, y) using (dx, dy) direction, if possible.
                if (canPlace(this, word, x, y, dx, dy)) {
                    for (let i = 0; i < word.length; i++) {
                        this.grid[y + dy * i][x + dx * i] = word[i];
                    }
                    this.placedWords.push(originalWord);
                    placed = true;
                    break;
                }
            }

            // Word could not be placed.
            if (!placed) {
                this.unplacedWords.push(originalWord);
            }
        }

        // Fill empty cells with random letters.
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.grid[y][x] === null) {
                    this.grid[y][x] = ALPHABET[Math.floor(
                        Math.random() * ALPHABET.length
                    )];
                }
            }
        }
    }

    getWord(startX, startY, dx, dy, length) {
        // Return selected letters / word.
        let word = "";

        for (let i = 0; i < length; i++) {
            // New (x, y) coordinate.
            const x = startX + dx * i;
            const y = startY + dy * i;

            // Invalid position.
            if (y < 0 || y >= this.grid.length ||
                x < 0 || x >= this.grid[y].length
            ) {
                return null;
            }

            // Add letter at the current coordinate.
            word += this.grid[x][y];
        }

        // Return the complete word.
        return word;
    }
}