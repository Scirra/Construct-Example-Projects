/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Felipe Vaiano Calderan - Programmer
 * Twitter: @fvcalderan
 * E-mail: fvcalderan@gmail.com
 *
 * Wesley Andrade - Artist
 * Twitter: @andrart7
 * E-mail: wesleymatos1989@gmail.com
 *
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

// Instances
let btnPrev;
let btnNext;
let mPointer;
let resultSlot;

// List of instances
let iSlots; // Inventory slots
let tItems; // Tutorial items

// Object interfaces
let item;

// Global objects
let mouse;

// Gameplay variables
let dragged; // Item currently being dragged
let resultItem; // Result item from the current recipe 

// Settings
let recipes; // items recipes
let tutoRecipe; // current tutorial recipe

runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});


async function onBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout'
    
    // Mouse events
    runtime.addEventListener("mousedown", e => onMouseClick(e, runtime));
    
    // Things that happen before the layout starts
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}

function onBeforeLayoutStart(runtime) {
    // Code to run before the layout starts
    
    // Load recipes
    fetch('./recipes.json')
    .then((response) => response.json())
    .then((json) => {
        recipes = json;
        tutoRecipe = Object.keys(json).length - 1;
    });
    
    // Get list of instances
    iSlots = runtime.objects.InventorySlot.getAllInstances();
    tItems = runtime.objects.TutorialItem.getAllInstances();
    
    // Get instances
    btnPrev = runtime.objects.ButtonPrevious.getFirstInstance();
    btnNext = runtime.objects.ButtonNext.getFirstInstance();
    mPointer = runtime.objects.MousePointer.getFirstInstance();
    for (const s of iSlots) {
        if (s.instVars.resultSlot)
            resultSlot = s;
    }
    
    // Get object interfaces
    item = runtime.objects.Item;
    
    // Get global objects
    mouse = runtime.mouse;
    
    // Configure initial parameters for the game
    setupGame();
}

function placeItem(slot, item) {
    // Place an item stack in an inventory slot
    
    item.setPosition(slot.x, slot.y);
    slot.itemStack = item;
}

function removeItem(slot) {
    // Remove an item stack from an inventory slot

    slot.itemStack = null;
}

function ovlp() {
    // Get item below the mouse (except the one being dragged)
    for (const i of item.getAllInstances()) {
        if (mPointer.testOverlap(i) && dragged != i)
            return i;
    }
}

function decrementStack(stack, amt) {
    // Decrement dragged items stack by 1
    
    // Perform the decrement
    stack.getChildAt(0).text = (
        Number(stack.getChildAt(0).text) - amt
    ).toString();

    // If it is the last item on the stack, delete it
    if (Number(stack.getChildAt(0).text) == 0) {
        stack.destroy();
        stack = null;
    }
}

function incrementStack(stack, amt) {
    // Increment dragged items stack by 1

    stack.getChildAt(0).text = (
        Number(stack.getChildAt(0).text) + amt
    ).toString();
}
    
function craftResultItem() {
    /* The result item is temporary and has special properties, such as being
     * able to occupy the result crafting slot. This function remove these
     * properties and grab the materials the player used to craft the item.
     */
     
     resultItem = null;
     
     for (const s of iSlots) {
         if (s.instVars.craftingSlot > -1) {
            if (s.itemStack) {
                decrementStack(s.itemStack, 1);
                if (s.itemStack.getChildAt(0).text == "0") {
                    s.itemStack.destroy();
                    s.itemStack = null;
                }
            }
        }
     }
}

function setupGame() {
    // Configure initial parameters for the game
    
    // Nullify the item stack for all slots
    for (const s of iSlots)
        s.itemStack = null;
    
    // Place items in the player's inventory
    for (const s of iSlots.slice(0, 2)) {
        const i = item.createInstance("Elements", 0, 0, true, "0");
        placeItem(s, i);
        i.getChildAt(0).text = "16";
    }
    for (const s of iSlots.slice(10, 12)) {
        const i = item.createInstance("Elements", 0, 0, true, "3");
        placeItem(s, i);
        i.getChildAt(0).text = "16";
    }
    for (const s of iSlots.slice(16, 18)) {
        const i = item.createInstance("Elements", 0, 0, true, "6");
        placeItem(s, i);
        i.getChildAt(0).text = "16";
    }
}

function processItemClicks(e, runtime) {
    // Process mouse click over items or slots

    /* In this function, it is important to understand the naming convention
     * of "dragged" and "ovItem". The former refers to the current item stack
     * being dragged by the player and the latter is the item stack right below
     * the player's cursor
     */
     
    // Get current hovered slot
    let cSlot;
    for (const s of iSlots) {
         if (mPointer.testOverlap(s)) {
            cSlot = s;
        }
    }
     
    // If no slot is currently being hovered, ignore
    if (!cSlot) 
        return;
    
    // Left click
    if (e.button == 0) {
    
        // Mouse over item
        const ovItem = ovlp();
        
        // Something is being dragged
        if (dragged) {
        
            // Dragged item is released on top of another one
            if (ovItem) {        
                // If the items are of different type, swap them
                if (ovItem.templateName != dragged.templateName) {
                    if (dragged && !cSlot.instVars.resultSlot) {
                        placeItem(cSlot, dragged);
                        dragged = ovItem;
                    }
                    
                // Otherwise, stack them in the slot
                } else {
                    if (!cSlot.instVars.resultSlot) {
                        ovItem.getChildAt(0).text = (
                            Number(ovItem.getChildAt(0).text) + 
                            Number(dragged.getChildAt(0).text)
                        ).toString()
                        dragged.destroy();
                        dragged = null;
                    
                    /* Special case for stacking result items. Basically it
                     * stacks in the hand instead of in the slot
                     */
                    } else {
                        removeItem(cSlot);
                        ovItem.destroy();
                        
                        dragged.getChildAt(0).text = (
                            Number(dragged.getChildAt(0).text) + 1
                        ).toString()
                        
                        // Craft to make it permanent
                        craftResultItem();
                    }
                }
            // If dragged item is released on an open slot, put it there
            } else {
                if (!cSlot.instVars.resultSlot) {
                    placeItem(cSlot, dragged);
                    dragged = null;
                }
            }
            
        // Nothing is being dragged & the cursor is over an item => drag it
        } else if (ovItem) {
            removeItem(cSlot);
            dragged = ovItem;
            
            // If resultItem (temp) is dragged, craft to make it permanent
            if (resultItem && ovItem == resultItem)
                craftResultItem();
        }
        
    // Right click
    } else if (e.button == 2 && !cSlot.instVars.resultSlot) {
        // Mouse over item
        const ovItem = ovlp();
        
        // Something is being dragged
        if (dragged) {
            // Items of the same type are overlapping => stack 1 unit
            if (
                ovItem && ovItem != dragged
                && ovItem.templateName == dragged.templateName
            ) {
                incrementStack(ovItem, 1) // Inc overlapped stack by 1 unit
                decrementStack(dragged, 1); // Dec overlapped stack by 1 unit
                
            // No item is being overlapped => place 1 unit in the free slot
            } else if (!ovItem) {
                const newItem = item.createInstance(
                    "Elements", cSlot.x, cSlot.y,
                    true, dragged.templateName
                );
                placeItem(cSlot, newItem);

                // Decrement overlapped stack by 1 unit
                decrementStack(dragged, 1);
            }
        
        // Nothing is being dragged => Pick half of the stack below
        } else if (ovItem) {
            // Calculate the amount of remaining items in the stack
            const halfStackDown = Math.floor(
                Number(ovItem.getChildAt(0).text)/2
            );
            
            // Create new stack (size halfStackDown) for the player to drag
            const newItem = item.createInstance(
                "Elements", mPointer.x, mPointer.y,
                true, ovItem.templateName
            );
            newItem.getChildAt(0).text = Math.max(
                halfStackDown, 1
            ).toString();
            dragged = newItem;

            // If overlapped stack has 1 item, just pick it up instead
            if (ovItem.getChildAt(0).text == "1") {
                ovItem.destroy();
                cSlot.itemStack = null;
                // If resultItem is dragged, craft to make it permanent
                if (resultItem && ovItem == resultItem)
                    craftResultItem();
            } else {
                decrementStack(ovItem, halfStackDown);
            }
        }
    }
    
    fixZOrder(runtime);
    processRecipe();

}

function processTutoClicks(e) {
    // Process mouse clicks on the tutorial buttons
    
    if (e.button != 0)
        return;    

    let buttonClicked = false; // Has a button been clicked by the player?
    
    // Check if previous has been clicked, if so, subtract 1 from tutorial index
    if (mPointer.testOverlap(btnPrev)) {
        if (tutoRecipe > 0)
            tutoRecipe = tutoRecipe - 1;
        else
            tutoRecipe = tutoRecipe = Object.keys(recipes).length - 1;

        buttonClicked = true;
        
    } else if (mPointer.testOverlap(btnNext)) {
        if (tutoRecipe < Object.keys(recipes).length - 1)
            tutoRecipe = tutoRecipe + 1;
        else
            tutoRecipe = 0;

        buttonClicked = true;
    }
    
    // If no button was clicked, ignore the rest of the function
    if (!buttonClicked)
        return;

    // Set all tutorial items animations
    for (const ts of tItems) {
        
        // Shorthand for the current recipe data
        const rcp = recipes[Object.keys(recipes)[tutoRecipe]];

        // Recipe
        if (ts.instVars.slot < 9) {
            ts.setAnimation(
                rcp["alternatives"][0][ts.instVars.slot].toString()
            );
            
        // Result
        } else {
            ts.setAnimation(rcp["resultID"].toString());
        }
    }
}

function onMouseClick(e, runtime) {
    // Process mouse down

    processTutoClicks(e);
    processItemClicks(e, runtime);
}

function processRecipe() {
    // Process current recipe
    
    // Start current recipe as blank
    let currRecipe = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Fill current recipe with the items the player placed on the table
    for (const s of iSlots) {
        if (
            s.instVars.craftingSlot > -1 &&
            s.itemStack && 
            "templateName" in s.itemStack
        ) {
            currRecipe[s.instVars.craftingSlot] = Number(
                s.itemStack.templateName
            );
        }
    }
    
    // Generate new result item (if there is one to be generated)
    let itemGenerated = false;
    
    // Loop through each craftable item
    for (const r in recipes) {
        // And each possible crafting recipe for this item
        
        for (const alt of recipes[r]["alternatives"]) {
            // Check if current recipe matches the current recipe
            
            if (JSON.stringify(alt) === JSON.stringify(currRecipe)) {
                // Create new item on the result slot
                
                if (!resultItem) {
                    const newItem = item.createInstance(
                        "Elements",
                        resultSlot.x,
                        resultSlot.y,
                        true,
                        recipes[r]["resultID"].toString()
                    );
                    resultItem = newItem;
                }
                itemGenerated = true;
            }
        }
    }
    
    if (!itemGenerated && resultItem) {
        resultItem.destroy();
        resultItem = null;
    }
}

function fixZOrder(runtime) {
    // Fix Z ordering of the game elements

    for (const i of item.getAllInstances()) {
        i.moveToLayer(runtime.getLayout(1).getLayer(0));
        i.getChildAt(0).moveToLayer(
            runtime.getLayout(1).getLayer(0)
        )
    }
    if (dragged) {
        dragged.moveToLayer(runtime.getLayout(1).getLayer(1));
        dragged.getChildAt(0).moveToLayer(
            runtime.getLayout(1).getLayer(0)
        )
    }
}

function onTick(runtime) {
    // Code to run every tick
    
    // Get current mouse position
    const mousePos = mouse.getMousePosition("Elements");
    
    // Update invisible mouse pointer
    mPointer.setPosition(...mousePos);
    
    // Update slots idle/hover animation
    for (const s of iSlots) {
        if (mPointer.testOverlap(s))
            s.setAnimation("Hover");
        else
            s.setAnimation("Idle")
    }

    // Update tutorial buttons idle/hover animation
    btnPrev.setAnimation(mPointer.testOverlap(btnPrev) ? "Hover" : "Idle");
    btnNext.setAnimation(mPointer.testOverlap(btnNext) ? "Hover" : "Idle");
    
    // Make item being dragged follow the mouse
    try {
        dragged.setPosition(...mousePos);
    } catch {
        dragged = null;
    }
}