let audioCtx = null;        // Audio context.
let oscillator = null;      // Wave oscillator.
let gainNode = null;        // Gain node.

function createAudioContext() {
    // Create the audio context (only once).
    if (!audioCtx) audioCtx = new AudioContext();
}

function playTone(gain, frequency) {
	// Play a constant sine wave tone.

    // Prevent multiple oscillators from playing simultaneously.
    if (oscillator) return;

	// Create oscillator and gain node.
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    // Generate a sine wave.
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    // Route the oscillator through the gain node to the speakers.
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Fade in briefly to avoid a click at the start.
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + 0.005);

	// Start the oscillator.
    oscillator.start();
}

function stopTone() {
	// Stop the tone.

	// If there is no oscillator playing, ignore.
    if (!oscillator) return;

	// Get current time.
    const now = audioCtx.currentTime;

    // Fade out briefly to avoid a click when stopping.
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.005);

    // Stop the oscillator after the fade-out finishes.
    oscillator.stop(now + 0.005);

	// Reset global variables.
    oscillator = null;
    gainNode = null;
}

function parseMorseCode(morseCode) {
    // Parse morse code and return message in latin characters.

    // International Morse code mapping
    // https://www.itu.int/dms_pubrec/itu-r/rec/m/r-rec-m.1677-1-200910-i!!pdf-e.pdf
    const morseMap = {
        // Letters.
        ".-"  : "A", "-...": "B", "-.-.": "C", "-.." : "D",
        "."   : "E", "..-.": "F", "--." : "G", "....": "H",
        ".."  : "I", ".---": "J", "-.-" : "K", ".-..": "L",
        "--"  : "M", "-."  : "N", "---" : "O", ".--.": "P",
        "--.-": "Q", ".-." : "R", "..." : "S", "-"   : "T",
        "..-" : "U", "...-": "V", ".--" : "W", "-..-": "X",
        "-.--": "Y", "--..": "Z",

        // Accented letters.
        "..-..": "É",

        // Figures.
        "-----": "0", ".----": "1", "..---": "2",
        "...--": "3", "....-": "4", ".....": "5",
        "-....": "6", "--...": "7", "---..": "8",
        "----.": "9",

        // Punctuation marks and signs.
        ".-.-.-":  ".", "--..--": ",", "---...": ":",
        "..--..":  "?", ".----.": "'", "-....-": "-",
        "-..-." :  "/", "-.--." : "(", "-.--.-": ")",
        ".-..-.": "\"", "-...-" : "=", ".-.-." : "+",
        "-..-"  :  "×", ".--.-.": "@",

        // Abbreviations.
        "...-."   : "[UNDERSTOOD]",
        "........": "[ERROR]",
        // "-.-"     : "[INVITATION]", (Same as K).
        ".-..."   : "[WAIT]",
        "...-.-"  : "[END OF WORK]",
        "-.-.-"   : "[START]",
    };

    // Split words by "/", then split each word into characters by spaces.
    return morseCode
        .split("/")
        .filter(word => word.length > 0)
        .map(word =>
            word
                .trim()
                .split(/\s+/)
                .map(character => morseMap[character] || "")
                .join("")
        )
        .join(" ");
}