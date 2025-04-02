export class BowlingGame {
    /* Represents a bowling game consisting of 10 frames. 
     * Each frame includes up to 2 rolls, except for the 10th frame, which may have
     * up to 3 rolls due to strikes and spares. 
     */

    constructor() {
        this.rolls = [];
        this.frames = [];
    }

    roll(pins) {
        // Add a roll score to the array of rolls.
        this.rolls.push(pins);
    }

    computeScore() {
        // Update score and frames information.
        
        this.frames = []; // Reset frames.
        let totalScore = 0; // Calculated score.
        let ri = 0; // Index of the current roll.

        /* Calculates the score for each frame, including two extra virtual
         * frames to handle strikes and spares in the final frame.
         */
        for (let frame = 0; frame < 12; frame++) {
            const frameRolls = [];
            
            // Strike!
            if (this.rolls[ri] == 10) {
                // Only a single row was performed and knocked the 10 pins.
                frameRolls.push(10);
                
                // 10 pins knocked.
                totalScore += 10;
    
                // Two rolls are added as bonus.
                totalScore += (this.rolls[ri+1] || 0) + (this.rolls[ri+2] || 0);
                
                // Increase roll index by 1.
                ri += 1;
            
            // Spare!
            } else if (
                ri + 1 < this.rolls.length &&
                this.rolls[ri] + this.rolls[ri + 1] == 10
            ) {
                // Two rolls were performed.
                frameRolls.push(this.rolls[ri], this.rolls[ri + 1]);
                
                // 10 pins knocked.
                totalScore += 10;
                
                // Roll is added as bonus.
                totalScore += this.rolls[ri + 2] || 0;
                
                // Increase roll index by 2.
                ri += 2;
                
            // Open frame.
            } else {
                // Two rolls were performed.
                frameRolls.push(this.rolls[ri], this.rolls[ri + 1]);
                
                // No bonus.
                totalScore += (this.rolls[ri] || 0) + (this.rolls[ri+1] || 0);
                    
                // Increase roll index by 2.
                ri += 2;
            }
            
            // Update frame.
            this.frames.push({
                frame: frame,
                rolls: frameRolls,
                total: totalScore}
            );
        }
        
        // Merge last frame with 2 potential virtual frames and clean up.
        this.frames[9].rolls =
            [this.frames[9], this.frames[10], this.frames[11]]
            .filter(frame => frame)
            .flatMap(frame => frame.rolls || [])
            .filter(e => e != null);
        this.frames.length = Math.min(10, this.frames.length);
    }
}