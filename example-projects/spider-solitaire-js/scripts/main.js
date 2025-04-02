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

// Object interfaces
let cards;

// Instances
let stockSlot;
let textTuto;
let textSuccess;
let resetButton;

// Behaviors
let faderT; // Fader Tween

// List of instances
let tablSlots;
let foundSlots;
let diffButtons;

// Gameplay variables
let tableau; // Logical representation of the tableau
let difficulty; // 1: easy (1 suit), 2: medium (2 suits), 4: hard (4 suits)
let doneSeqs; // Amount of sequences fully done (From K to A)
let stock; // List of cards in the stock
let inputFocus; // Group of items the player can currently control

// Constants
const NUM_OF_SUITS = 4; // Number of suits
const NUM_OF_CARDS_PER_SUIT = 13; // Number of cards per suit
const NUM_OF_STARTING_CARDS = 54; // Number of starting cards on the table
const NUM_OF_REVEALED_CARDS = 10; // Number of starting revealed cards
const NUM_OF_DRAWS = 10; // Number of cards the player draws from the stock
const DRAW_TIME = 0.05; // Time to draw a card
const KING_NUM = 13; // Number of the king figure
const CARD_YPOS_OFFSET = 32; // Y offset of cards on the table

runOnStartup(async (runtime) => {
    // Code to run on the loading screen

    runtime.addEventListener("beforeprojectstart", () =>
        onBeforeProjectStart(runtime),
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before the project starts

    // Events that happen before the layout starts
    runtime.layout.addEventListener("beforelayoutstart", () =>
        onBeforeLayoutStart(runtime),
    );

    // Events that happen when there is a mouse click
    runtime.addEventListener("mousedown", (e) => onMouseDown(runtime, e));
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts

    // Setup object interfaces
    cards = runtime.objects.Card;

    // Setup intances
    stockSlot = runtime.objects.StockSlot.getFirstInstance();
    faderT = runtime.objects.Fader.getFirstInstance().behaviors.Tween;
    textTuto = runtime.objects.TextTutorial.getFirstInstance();
    resetButton = runtime.objects.ResetButton.getFirstInstance();
    textSuccess = runtime.objects.TextSuccess.getFirstInstance();

    // Setup list of instances
    tablSlots = runtime.objects.TableauSlot.getAllInstances();
    foundSlots = runtime.objects.FoundSlot.getAllInstances();
    diffButtons = runtime.objects.DifficultyButton.getAllInstances();

    // Game starts displaying the menu
    inputFocus = "menu";
}

function startGame(runtime, diff) {
    // Start a new game

    // Set gameplay variables
    tableau = Array.from({ length: 10 }, () => []); // Setup an empty tableau
    difficulty = diff; // Set difficulty
    doneSeqs = 0; // Player starts with 0 sequences done
    stock = []; // Create empty stock

    // Setup stockSlot timer event and initial timer
    stockSlot.behaviors.Timer.addEventListener(
        "timer",
        (_) => (stockSlot.instVars.isEnabled = true),
    );
    stockSlot.behaviors.Timer.startTimer(
        (DRAW_TIME + 0.025) * NUM_OF_STARTING_CARDS,
        "enableStock",
        "once",
    );

    // Place every available card in the stock twice (spider solitary rules)
    for (let i = 0; i < 2; i++) {
        for (let suit = 0; suit < NUM_OF_SUITS; suit++) {
            for (let num = 1; num < NUM_OF_CARDS_PER_SUIT + 1; num++) {
                const newCard = cards.createInstance(
                    "Game",
                    stockSlot.x,
                    stockSlot.y,
                );
                newCard.instVars.cardSuit = suit % difficulty;
                newCard.instVars.cardNum = num;
                stock.push(newCard);
            }
        }
    }

    // Suffle the stock
    shuffleArray(stock);

    // Draw NUM_OF_STARTING_CARDS cards
    drawCards(runtime, true);
}

function onMouseDown(runtime, e) {
    // Process mouse events

    // Get layer position from client's mouse position
    const lay = runtime.layout.getLayer("Game");
    const [mx, my] = lay.cssPxToLayer(e.clientX, e.clientY);

    // Process left click
    if (e.button == 0) {
        if (inputFocus == "menu") {
            // Player is viewing the main menu. Process button clicks
            for (const btn of diffButtons) {
                // Check if player pressed a difficulty button
                if (btn.containsPoint(mx, my)) {
                    // If so, start the game using the correct number of suits
                    inputFocus = "game";
                    faderT.startTween("opacity", 0, 0.25, "in-out-sine");
                    startGame(runtime, btn.instVars.suits);
                }
            }
        } else if (inputFocus == "game") {
            // Player is in-game. Process stock clicks

            // When the player clicks the stock, draw NUM_OF_DRAWS cards.
            // This only happens if there are no empty piles on the tableau
            if (
                stockSlot.containsPoint(mx, my) &&
                stockSlot.instVars.isEnabled &&
                stock.length >= NUM_OF_DRAWS &&
                tableau.every((arr) => arr.length > 0)
            ) {
                stockSlot.instVars.isEnabled = false;
                stockSlot.behaviors.Timer.startTimer(
                    (DRAW_TIME + 0.025) * NUM_OF_DRAWS,
                    "enableStock",
                    "once",
                );
                drawCards(runtime, false);
            }

            if (resetButton.containsPoint(mx, my)) {
                restartGame(runtime, true);
            }
        }
    }
}

function drawCards(runtime, firstDraw) {
    // Draw cards from the stock and place them on the tableau

    // Disable cards
    setCardsState(false);

    // Check amount of cards to be drawn, depending on the type of the draw
    const nDraws = firstDraw ? NUM_OF_STARTING_CARDS : NUM_OF_DRAWS;

    // Distribute starting cards and set various properties
    for (let i = 0; i < nDraws; i++) {
        // Get card, its behaviors and its instVars
        const card = stock.pop();
        const cardB = card.behaviors;
        const cardV = card.instVars;

        // Get correct logical X position
        cardV.tableauX = i % tablSlots.length;

        // Get correct logical Y position and animation
        if (firstDraw) {
            cardV.tableauY = Math.floor(i / tablSlots.length);

            // Last NUM_OF_REVEALED_CARDS are drawn revealed
            if (i >= NUM_OF_STARTING_CARDS - NUM_OF_REVEALED_CARDS) {
                card.setAnimation(cardV.cardSuit + "_" + cardV.cardNum);
            }
        } else {
            cardV.tableauY = tableau[cardV.tableauX].length;
            card.setAnimation(cardV.cardSuit + "_" + cardV.cardNum);
        }

        // Get correct tablSlot position
        const [x, y] = tablSlots[cardV.tableauX].getPosition();

        // Store the position in instance variables
        cardV.gotoX = x;
        cardV.gotoY = y + cardV.tableauY * CARD_YPOS_OFFSET;

        // Update logical tableau representation
        tableau[i % tablSlots.length].push(card);

        // Add drag events
        cardB.DragDrop.addEventListener("dragstart", (e) => cardDragged(e));
        cardB.DragDrop.addEventListener("drop", (e) => cardDropped(runtime, e));

        // Move the card to its initial position after a delay
        cardB.Timer.startTimer(DRAW_TIME * i, "moveTimer", "once");
        cardB.Timer.addEventListener("timer", (e) => moveAndEnableCard(e));
    }

    rebuildHierarchies();
}

function cardDragged(e) {
    // Player started dragging a card

    // Shorthand for e.instance
    let card = e.instance;

    // Set dragStart position
    [card.instVars.dragStartX, card.instVars.dragStartY] = card.getPosition();

    // Move card and its children to the top of the layer
    while (card) {
        // Move currCard to the top
        card.moveToTop();

        // Get first (and only) child and set it as the current card
        card = card.getChildAt(0);
    }
}

async function cardDropped(runtime, e) {
    // Player dropped a card

    // Shorthand for e.instance, behaviors and instanceVariables
    const card = e.instance;
    const cardV = card.instVars;

    // Check if player dropped the card onto an empty slot
    for (const gs of tablSlots) {
        if (tableau[gs.instVars.slotID].length == 0 && card.testOverlap(gs)) {
            // Place the card on top of empty slot
            const t = qmc(card, gs.x, gs.y, 0.1);

            // Disable all cards and wait for animation to finish
            setCardsState(false);
            await t.finished;

            // Update logical tableau
            moveArrayElements(
                tableau,
                cardV.tableauX,
                cardV.tableauY,
                gs.instVars.slotID,
            );

            // Update cards tableau position according to logical tableau
            updateCardsPosition(tableau);

            // Update the state of all the cards
            rebuildHierarchies();
            setCardsState(true);
            return;
        }
    }

    // Get available cards to drop the dragged card on top of
    const available = tableau.map((arr) => arr[arr.length - 1]);

    // Check validity of drop
    let validDrop;
    for (const av of available) {
        // If available is undefined, go to next iteration
        if (!av) {
            continue;
        }

        // Establish necessary condition for a card to be a valid drop position
        const cond1 = av != card;
        const cond2 = card.testOverlap(av);
        const cond3 = cardV.cardNum == av.instVars.cardNum - 1;

        // Card has been dropped on top of a valid available card
        if (cond1 && cond2 && cond3) {
            validDrop = av;
        }
    }

    // Set card position depending on if it was dropped on top of a valid av
    if (validDrop) {
        // Place the card on top of valid available card
        const t = qmc(card, validDrop.x, validDrop.y + CARD_YPOS_OFFSET, 0.1);

        // Disable all cards and wait for animation to finish
        setCardsState(false);
        await t.finished;

        // Update logical tableau
        moveArrayElements(
            tableau,
            cardV.tableauX,
            cardV.tableauY,
            validDrop.instVars.tableauX,
        );

        // Update cards tableau position according to logical tableau
        updateCardsPosition(tableau);
    } else {
        // Move card back to its dragStart position
        const t = qmc(card, cardV.dragStartX, cardV.dragStartY, 0.1);
        // Disable all cards and wait for animation to finish
        setCardsState(false);
        await t.finished;
    }

    // Update the state of all the cards
    rebuildHierarchies();
    setCardsState(true);
    checkCompleteHierarchy(runtime);
}

async function setCardsState(state) {
    // Enabled or disable cards DragDrop behaviors

    // Only operate if the player can control gameplay items
    if (inputFocus != "game") {
        return;
    }

    // Apply state to cards
    if (!state) {
        // If state is false, disable all the cards
        for (const card of cards.getAllInstances()) {
            card.behaviors.DragDrop.isEnabled = false;
        }
    } else {
        // Otherwise, set their state according to position and hierarchy
        for (let x = 0; x < tableau.length; x++) {
            for (let y = 0; y < tableau[x].length; y++) {
                // Set shorhands
                const card = tableau[x][y];
                const cardB = card.behaviors;

                // Set animation and DragDrop state according to some criteria
                if (y + 1 == tableau[x].length) {
                    // Card is the last one on its column -> enable DragDrop
                    await revealCard(card);

                    // And enable DragDrop
                    cardB.DragDrop.isEnabled = true;
                } else if (card.getChildAt(0)) {
                    // If the last child of a sequence is also the last card
                    // of the column, enable DragDrop
                    const lastChild = [...card.allChildren()].at(-1);
                    cardB.DragDrop.isEnabled =
                        lastChild == tableau[card.instVars.tableauX].at(-1);
                } else {
                    // Otherwise, disable DragDrop
                    cardB.DragDrop.isEnabled = false;
                }
            }
        }
    }
}

async function moveAndEnableCard(e) {
    // Move card to its initial position

    // Shorthand for e.instance, behaviors and instVars
    const card = e.instance;
    const cardB = card.behaviors;
    const cardV = card.instVars;
    const [x, y] = [cardV.gotoX, cardV.gotoY];

    // Always move most recent card to the top of the layer
    card.moveToTop();

    // Apply movement tween
    [card.x, card.y] = stockSlot.getPosition();
    const t = cardB.Tween.startTween("position", [x, y], 0.5, "in-out-sine");
    await t.finished;

    // Check if there are still other cards moving
    let tweenPlaying = false;
    for (const c of cards.getAllInstances()) {
        for (const t of c.behaviors.Tween.allTweens()) {
            if (t.isPlaying) {
                tweenPlaying = true;
            }
        }
    }

    // If no other card is moving, update the cards state
    if (!tweenPlaying) {
        setCardsState(true);
    }
}

function rebuildHierarchies() {
    // Rebuild hierarchy tree to reflect new tableau state

    // Deconstruct all hierarchies
    for (const card of cards.getAllInstances()) {
        card.removeFromParent();
    }

    // Reconstruct them
    for (const card of cards.getAllInstances()) {
        // Get card instance variables
        const cardV = card.instVars;

        // Card can only have a parent if they are not the first on the column
        if (cardV.tableauY > 0) {
            // Get possible parent (right above current card on the column)
            const possibleParent = tableau[cardV.tableauX][cardV.tableauY - 1];

            // Parent must be revealed, have the correct number and suit
            if (
                possibleParent.animationName != "back" &&
                possibleParent.instVars.cardNum == cardV.cardNum + 1 &&
                possibleParent.instVars.cardSuit == cardV.cardSuit
            ) {
                // Make card a child of possibleParent
                possibleParent.addChild(card, {
                    transformX: true,
                    transformY: true,
                });
            }
        }
    }
}

function checkCompleteHierarchy(runtime) {
    // Check if the player has completed a sequence (from K to A)

    // Loop through each card in the game
    for (const card of cards.getAllInstances()) {
        // Top of squence should always be a King (KING_NUM)
        if (card.instVars.cardNum != KING_NUM) {
            continue;
        }

        // Initialize some variables
        let childrenCount = 0; // Number of children
        let lastNum = card.instVars.cardNum; // Last card number
        let invalid = false; // Is the sequence invalid?

        // Loop through all children
        for (const ch of card.allChildren()) {
            // Add a child to the children count
            childrenCount++;

            // The child's number is always 1 less than the parent
            if (ch.instVars.cardNum != lastNum - 1) {
                invalid = true;
                break;
            }

            // Set lastNum to the children card number
            lastNum = ch.instVars.cardNum;
        }

        // Full sequence contains KING_NUM - 1 children
        if (childrenCount != KING_NUM - 1) {
            invalid = true;
        }

        // If any of the criteria above is invalid, go to next card
        if (invalid) {
            continue;
        }

        // If the sequence is valid, move it to the foundation pile
        moveHierarchyToDonePile(runtime, card);
    }
}

function moveHierarchyToDonePile(runtime, card) {
    // Move completed sequence to next available foundation pile

    // Disable card and remove it from logical tableau
    card.behaviors.DragDrop.isEnabled = false;
    tableau[card.instVars.tableauX][card.instVars.tableauY] = null;
    card.instVars.tableauX = -1;
    card.instVars.tableauY = -1;

    // Move card to the foundation pile
    qmc(card, foundSlots[doneSeqs].x, foundSlots[doneSeqs].y, 0.3);

    // Do the same for all the children
    for (const ch of card.allChildren()) {
        // Disable and remove card from parent
        ch.behaviors.DragDrop.isEnabled = false;
        ch.removeFromParent();

        // Disable card and remove it from logical tableau
        tableau[ch.instVars.tableauX][ch.instVars.tableauY] = null;
        ch.instVars.tableauX = -1;
        ch.instVars.tableauY = -1;

        // Move card to the foundation pile
        qmc(ch, foundSlots[doneSeqs].x, foundSlots[doneSeqs].y, 0.3);
    }

    // Remove nulls from tableau array
    tableau.forEach((subArray, index) => {
        tableau[index] = subArray.filter((element) => element != null);
    });

    // Player has completed a sequence
    doneSeqs++;

    if (doneSeqs == 8) {
        textSuccess.isVisible = true;
        restartGame(runtime, false);
    }
}

function restartGame(runtime, quickRestart) {
    // Restart game

    // Set input focus to restart
    inputFocus = "restart";

    // Play fade animation
    textTuto.isVisible = false;
    cards
        .getAllInstances()
        .forEach((c) => (c.behaviors.DragDrop.isEnabled = false));
    diffButtons.forEach((btn) => (btn.isVisible = false));
    faderT.startTween("opacity", 0.75, 1.5, "in-out-sine");

    // Restart the game
    setTimeout(() => runtime.goToLayout("Game"), quickRestart ? 1500 : 3000);
}

function shuffleArray(array) {
    // Fisher-Yates shuffle algorithm (in-place)

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function moveArrayElements(a, i, j, k) {
    // Move from a[i][j] to the end of a[i], and append to the end of a[k].

    a[k] = a[k].concat(a[i].splice(j));
}

function qmc(card, x, y, time) {
    // Shorthand for recurrent long tween call

    const cardBT = card.behaviors.Tween;
    return cardBT.startTween("position", [x, y], time, "in-out-sine");
}

async function revealCard(card) {
    // If a card is unrevealed, flip it around to reveal its suit and number

    const cardV = card.instVars;
    const cardB = card.behaviors;

    // If the card is the last one in the sequence, reveal it
    const newAnim = cardV.cardSuit + "_" + cardV.cardNum;

    // Play a flip animation if card has been revealed
    if (card.animationName != newAnim) {
        const t = cardB.Tween.startTween("width", 0.01, 0.1, "in-out-sine");
        await t.finished;
        card.setAnimation(newAnim);
        const u = cardB.Tween.startTween(
            "width",
            card.imageWidth,
            0.1,
            "in-out-sine",
        );
        return u;
    }
    return null;
}

function updateCardsPosition(tableau) {
    // Update cards tableau position according to logical tableau

    for (let x = 0; x < tableau.length; x++) {
        for (let y = 0; y < tableau[x].length; y++) {
            tableau[x][y].instVars.tableauX = x;
            tableau[x][y].instVars.tableauY = y;
        }
    }
}
