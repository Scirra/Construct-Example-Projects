/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

import { BowlingGame } from './BowlingGame.js';

// Instances.
let player;
let playerMeter;
let ball;
let bonusScreen;
let textGameOver;

// Lists of instances.
let frames;
let pins;
let pinUI;
let ballZones;
let gutterZones;

// Objects.
let textRoll;
let textScore;

// Global objects.
let kbd;
let tc;

// Behaviors.
let tm;

// Game states.
const state = { MOVE: 0, AIM: 1, THROW: 2, PERF: 3, BALL: 4, OVER: 5, TUTO: 6 };

// Bonus states
const bonus = { NOTHING: 0, SPARE: 1, STRIKE: 2 };

// Settings.
const MOVE_RANGE = 50; // Player's movement range.
const MOVE_SPEED = 80; // Player's movement speed.
const SCR_WIDTH = 320; // Screen width.
const BALL_SPEED = 80; // Ball's movement speed.

// Gameplay variables.
let game; // Logical bowling game.
let gameState = state.TUTO; // What is currently happening in the game.
let pinsKnocked = 0; // Number of pins knocked by the roll.
let replacePins = false; // Should the pin-setter replace the pins?
let frameRolls = 0; // Number of rolls performed this frame.

runOnStartup(async runtime => {
    // Code to run on the loading screen.

    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

function onBeforeProjectStart(runtime) {
    // Code to run just before the project starts.

    // Keyboard events.
    runtime.addEventListener("keyup", e => onKeyDown(runtime, e));

    // Procedures that happen before the layout starts.
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );

    // Start ticking.
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
    // Code to run just before the layout starts.

    // Creat new logical bowling game instance.
    game = new BowlingGame();

    // Setup gameplay variables.
    gameState = state.TUTO;
    pinsKnocked = 0;
    replacePins = false;
    frameRolls = 0;

    // Shorthand.
    const ro = runtime.objects;

    // Get instances.
    player = ro.Player.getFirstInstance();
    playerMeter = ro.PlayerMeter.getFirstInstance();
    ball = ro.Ball.getFirstInstance();
    bonusScreen = ro.BonusScreen.getFirstInstance();
    textGameOver = ro.TextGameOver.getFirstInstance();
    tm = ro.TimerManager.getFirstInstance().behaviors.Timer;

    // Get lists of instances.
    pins = ro.Pin.getAllInstances();
    pinUI = ro.PinUI.getAllInstances();
    pinUI.sort((a, b) => a.instVars.pinNum - b.instVars.pinNum);
    ballZones = ro.BallZone.getAllInstances();
    gutterZones = ro.GutterZone.getAllInstances();
    frames = ro.Frame.getAllInstances();
    frames.sort((a, b) => a.instVars.frameNum - b.instVars.frameNum);

    // Get global objects.
    kbd = runtime.keyboard;
    tc = runtime.timelineController;

    // Get text roll and score objects.
    textRoll = ro.TextRoll;
    textScore = ro.TextScore;

    for (const f of frames) {
        // Create textboxes.
        const tr0 = textRoll.createInstance("FG", ...f.getImagePoint("Roll0"));
        const tr1 = textRoll.createInstance("FG", ...f.getImagePoint("Roll1"));
        const scr = textScore.createInstance("FG", ...f.getImagePoint("Score"));

        // Make them children of the frame.
        f.addChild(tr0);
        f.addChild(tr1);
        f.addChild(scr);

        // Special case for last frame (one extra TextRoll).
        if (f.instVars.frameNum == 9) {
            const tr2 = textRoll.createInstance(
                "FG", ...f.getImagePoint("Roll2")
            );
            f.addChild(tr2);
        }
    }

    // Capture player animation changes.
    player.addEventListener(
        "framechange", e => onPlayerFrameChange(e, runtime)
    );

    // Capture pin animation changes.
    for (const p of pins) {
        p.addEventListener(
            "framechange", e => onPinFrameChange(e, runtime)
        );
    }

    // Capture ball timer trigger.
    tm.addEventListener("timer", e => onTimer(e, runtime));

}

function updateUI() {
    // Update game UI.

    // Store the type of bonus.
    let bonusType = bonus.NOTHING;

    // Update each Frame object.
    for (let i = 0; i < frames.length; i++) {

        // Get logical information about the current frame. 
        const { rolls, total } = game.frames[i];

        // Helper function to update the text for each roll.
        const setRollText = (frameIdx, rowIdx, pos) => {
            const f = frames[frameIdx]; // Current frame object.

            // Check if roll exists and is defined.
            if (rolls.length > rowIdx && rolls[rowIdx] != null) {

                // Strike!
                if (
                    rolls[rowIdx] == 10 &&
                    ((pos > 0 && game.frames[i].rolls[pos-1] != 0) || pos == 0)
                ) {
                    f.getChildAt(i < 9 ? 1 : pos).text = "X";
                    bonusType = bonus.STRIKE;

                    // Spare!
                } else if (
                    rowIdx > 0 && rolls[rowIdx - 1] !== 10 &&
                    rolls[rowIdx - 1] + rolls[rowIdx] == 10
                ) {
                    f.getChildAt(pos).text = "/";
                    bonusType = bonus.SPARE;

                    // Open frame.
                } else {
                    f.getChildAt(pos).text = rolls[rowIdx].toString();
                    bonusType = bonus.NOTHING;
                }
            }
        };

        // Regular frames have up to 2 rolls, while the last has up to 3.
        if (i == 9) {
            setRollText(i, 0, 0);
            setRollText(i, 1, 1);
            setRollText(i, 2, 3);
        } else {
            setRollText(i, 0, 0);
            setRollText(i, 1, 1);
        }

        // Update frame score.
        if (total != null && game.frames[i].rolls[0] != null) {
            frames[i].getChildAt(2).text = total.toString();
        }
    }

    // Return bonus type.
    return bonusType;
}

function onKeyDown(runtime, e) {
    // Process key down event.

    // The only available action key is SPACE.
    if (e.key != " ") {
        return;
    }

    // Shorthands.
    const pm = playerMeter;
    const bi = ball.instVars;

    // Change to MOVE state.
    const changeToMove = () => {
        gameState = state.MOVE;
        tc.play("HideTutorial");
    }

    // Change to AIM state.
    const changeToAim = () => {
        gameState = state.AIM;

        // Animate player meter sprite.
        pm.setAnimation("Aim");
        pm.setSize(1, 1);
        pm.behaviors.Sine.isEnabled = true;
        pm.behaviors.Tween.startTween(
            "size", [pm.imageWidth, pm.imageHeight], 0.5, "out-back"
        );
        pm.behaviors.Tween.startTween(
            "opacity", 100, 0.5, "in-out-sine"
        );
    };

    // Change to THROW state.
    const changeToThrow = () => {
        gameState = state.THROW;

        // Change player meter animation.
        pm.animationSpeed = 15;
        pm.setAnimation("Throw");
        pm.behaviors.Sine.isEnabled = false;
    }

    // Change to PERF (perform throw) state.
    const changeToPerf = () => {
        gameState = state.PERF;

        // Animate player meter sprite.
        pm.animationSpeed = 0;
        pm.behaviors.Tween.startTween(
            "size", [1, 1], 0.5, "in-back"
        );
        pm.behaviors.Tween.startTween(
            "opacity", 0, 0.5, "in-out-sine"
        );

        // Set ball's angle of motion and speed ratio.
        bi.angleOfMotion = pm.angle;
        bi.speedRatio = (pm.animationFrame + 1) / pm.animation.frameCount;

        // Animate player.
        player.setAnimation("Throw");
    }

    // Change to TUTO state.
    const changeToTuto = () => {
        // Stop all currently playing timelines.
        for (const tl of tc.allTimelines()) {
            tl.stop();
        }

        // Play restart timeline.
        tc.play("Restart");

        // Restart the layout.
        tm.startTimer(0.5, "restartlayout", "once");
        
    }

    // Switch game state.
    switch (gameState) {
        case state.TUTO: changeToMove(); break;
        case state.MOVE: changeToAim(); break;
        case state.AIM: changeToThrow(); break;
        case state.THROW: changeToPerf(); break;
        case state.OVER: changeToTuto();break;
    }
}

function onPlayerFrameChange(e, runtime) {
    // Process Player sprite frame changes.

    if (e.animationName == "Throw") {
        // Throw ball and change game state.
        if (e.animationFrame == 7) {
            ball.setPosition(...player.getImagePoint("Ball"));
            gameState = state.BALL;

            // Prepare to pick up the ball.
        } else if (e.animationFrame == 10) {
            // Set player's animation.
            player.setAnimation(
                player.x < SCR_WIDTH / 2 ? "Walk_Right" : "Walk_Left"
            );

            // Move player to the center of the screen.
            player.behaviors.Tween.startTween(
                "position",
                [161, 155],
                Math.abs(player.x - SCR_WIDTH / 2) / 70,
                "linear"
            ).finished.then(_ => player.setAnimation("Idle"));
        }
    }
}

function movePlayer(runtime) {
    // Move player left and right.

    // Only valid if current game state is MOVE.
    if (gameState != state.MOVE) {
        return;
    }

    // Get current X-axis input.
    const xAxis = kbd.isKeyDown("ArrowRight") - kbd.isKeyDown("ArrowLeft");

    // Move right.
    if (xAxis > 0 && player.x < SCR_WIDTH / 2 + MOVE_RANGE) {
        player.x += MOVE_SPEED * runtime.dt;
        player.setAnimation("Walk_Ball_Right", "current-frame");

        // Move left.
    } else if (xAxis < 0 && player.x > SCR_WIDTH / 2 - MOVE_RANGE) {
        player.x -= MOVE_SPEED * runtime.dt;
        player.setAnimation("Walk_Ball_Left", "current-frame");

        // Stay put.
    } else {
        player.setAnimation("Idle_Ball", "current-frame");
    }
}

function moveBall(runtime) {
    // Move bowling ball.

    // Remap ratio to avoid ball being thrown too slowly.
    const r = 0.5 + ((ball.instVars.speedRatio - 0.1) * (1 - 0.5)) / (1 - 0.1);

    // Throw properties.
    const aom = ball.instVars.angleOfMotion + Math.PI / 2;
    const spd = BALL_SPEED * r;

    // Move the ball.
    if (gameState == state.BALL) {
        ball.x += spd * Math.sin(aom) * runtime.dt;
        ball.y -= spd * Math.cos(aom) * runtime.dt;
    }

    // Change ball size according to ball zones.
    for (const bz of ballZones) {
        if (ball.testOverlap(bz) && bz.ballAnim != ball.animationName) {
            // Change size of the ball by swapping the animation.
            ball.setAnimation(bz.instVars.ballAnim, "current-frame");

            // Special case for last zone: ball fades-out smoothly.
            if (bz.instVars.ballAnim == "Disappear") {
                ball.behaviors.Tween.startTween("opacity", 0, 0.05, "out-sine");
                tm.startTimer(1, "endoftravel", "once");
            }
        }
    }

    // If the ball falls into a gutter, it cannot escape.
    for (const gz of gutterZones) {
        if (ball.testOverlap(gz) && !ball.instVars.gutted) {

            // Mark ball as gutted.
            ball.instVars.gutted = true;

            // Set angle to follow the gutter accordingly.
            if (gz.instVars.gutterSide == "left") {
                ball.x -= ball.width / 2;
                ball.instVars.angleOfMotion = 290 * Math.PI / 180;
            } else {
                ball.x += ball.width / 2;
                ball.instVars.angleOfMotion = 252 * Math.PI / 180;
            }
        }
    }

    // Animate pins getting knocked if ball collides with them.
    for (const p of pins) {
        if (ball.testOverlap(p) && p.instVars.standing) {
            p.instVars.standing = false;
            pinUI[p.instVars.pinNum].isVisible = true;
            pinsKnocked++;

            // Animation changes depending on the angle of collision.
            if (p.x - ball.x > 4) p.setAnimation("Right");
            else if (p.x - ball.x > 2) p.setAnimation("DiagRight");
            else if (p.x - ball.x < -4) p.setAnimation("Left");
            else if (p.x - ball.x < -2) p.setAnimation("DiagLeft");
            else p.setAnimation("Up");
        }
    }
}

function onPinFrameChange(e, runtime) {
    // Process Pin sprite frame changes.

    // Get pin instance.
    const thispin = e.instance;

    // Check if the ball was too weak to hit the pins hard enough.
    const tooWeak = Math.random() + ball.instVars.speedRatio < 1.0;

    // Randomize falling angle of pins for variety.
    const angle = Math.random() > 0.5 ? "Diag" : ""

    // Constraints for collision.
    if (thispin.animationFrame != 3 || tooWeak) return;

    // Check collision with other pins.
    for (const p of pins) {
        // There was a collision.
        if (thispin != p && thispin.testOverlap(p) && p.instVars.standing) {

            // Pin was knocked.
            p.instVars.standing = false;

            // Remove it from the UI.
            pinUI[p.instVars.pinNum].isVisible = true;

            // Add to the knocked pins counter.
            pinsKnocked++;

            // Animation changes depending on the angle of collision.
            if (p.x > thispin.x) p.setAnimation(`${angle}Right`);
            else if (p.x < thispin.x) p.setAnimation(`${angle}Left`);
            else p.setAnimation("Up");
        }
    }
}

function endFrame() {
    // Play end of frame animation.

    // Launch timeline clip.
    tc.play("EndFrame");

    // Hide pins.
    tm.startTimer(1, "hidepins", "once");

    // Replace pins and update UI, if needed.
    if (replacePins) {
        for (const p of pins) {
            p.instVars.standing = true;
            pinUI[p.instVars.pinNum].isVisible = false;
        }
        replacePins = false;
    }

    // Bring standing pins back.
    tm.startTimer(2, "bringbackpins", "once");

    // Start another frame.
    tm.startTimer(4.1, "startnewframe", "once");
    
}

function endGame() {
    // End game and restart layout.

    // Set game over state.
    gameState = state.OVER;

    // Change textGameOver's text to reflect player's final score.
    textGameOver.text = textGameOver.text.replace(
        "###", frames[9].getChildAt(2).text
    );

    // Play game over timeline.
    tc.play("GameOver");
}

function processEndOfTravel() {
    // Things that happen after the ball reached end of travel.
    
    // Record the number of pins knocked.
    game.roll(pinsKnocked);

    // Compute the score.
    game.computeScore();

    // Update the UI.
    const bonusType = updateUI();

    // Strike or Spare.
    const processBonus = (btype) => {
        bonusScreen.isVisible = true;
        bonusScreen.setAnimation(btype);
        tm.startTimer(3, "hidebonusscreen", "once");
        replacePins = true;
        pinsKnocked = 0;
        frameRolls = 0;
    };

    // Open frame.
    const processNoBonus = () => {
        if (frameRolls == 0) {
            frameRolls = 1;
        } else {
            replacePins = true;
            pinsKnocked = 0;
            frameRolls = 0;
        }
    };

    switch (bonusType) {
        case bonus.STRIKE:
            processBonus("Strike");
            break;
        case bonus.SPARE:
            processBonus("Spare");
            break;
        case bonus.NOTHING:
            processNoBonus();
            break;
    }

    // Update pinsKnocked.
    pinsKnocked = 0;

    // Get last frame's information.
    const r0 = frames[9].getChildAt(0).text;
    const r1 = frames[9].getChildAt(1).text;
    const r2 = frames[9].getChildAt(3).text;

    // Check if there are still frames to be played or if it's game over.
    if (r0 != "") {
        if ((r0 != "X" && r1 != "" && r1 != "X" && r1 != "/") || r2 != "") {
            endGame();
        } else {
            endFrame();
        }
    } else {
        endFrame();
    }
}

function onTimer(e, runtime) {
    // End current frame/game.

    // Move pins with the pin-setter to hide them.
    const hidePins = () => {
        for (const p of pins) {
            if (!p.instVars.hidden) {
                p.behaviors.Tween.startTween("y", p.y - 25, 1, "linear");
                p.instVars.hidden = true;
            }
        }
    };
    
    // Move pins with the pin-setter to bring them back.
    const bringBackPins = () => {
        for (const p of pins) {
            if (p.instVars.standing) {
                p.setAnimation("Idle");
                p.behaviors.Tween.startTween("y", p.y + 25, 1, "linear");
                p.instVars.hidden = false;
            }
        }
    };

    // Start new frame.
    const startNewFrame = () => {
        ball.instVars.gutted = false;
        ball.isVisible = true;
        ball.opacity = 100;
        gameState = state.MOVE;
    };
    
    // Check tag and proceed accordingly.
    switch (e.tag) {
        case "endoftravel": processEndOfTravel(); break;
        case "restartlayout": runtime.goToLayout("Game"); break;
        case "hidepins": hidePins(); break;
        case "bringbackpins": bringBackPins(); break;
        case "startnewframe": startNewFrame(); break;
        case "hidebonusscreen": bonusScreen.isVisible = false; break;
    }
}

function onTick(runtime) {
    // Code to run every tick.

    movePlayer(runtime);
    moveBall(runtime);
}