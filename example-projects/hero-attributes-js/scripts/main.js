/* Made by Forsteri Studios
 *
 * Website: forsteristudios.com
 * E-Mail: forsteristudios@gmail.com
 * X: @forsteristudios
 */

// =============================================================================

// Settings.
const MESH = {rows: 2, cols: 3};   // Chart mesh information.
const MORPHTIME = 0.25;            // Time taken to completely morph the chart.
const TYPESPEED = 2;               // Time taken to typewrite the lore.

// Menu variables.
let currHero = 0;        // Currently selected hero ID.
let defaultHero = [];    // Default (neutral) hero data.
let meshTweens = [];     // Tweens morphing the mesh.
let heroes;              // All heroes information.

// Hero sprites.
let heroClass;
let heroDesc;
let heroName;
let heroPortrait;
let heroSymbol;

// Hexagon sprites.
let hexBG1;
let hexBG2;

// Other items.
let chart;
let background1;
let background2;
let lore;
let useTheArrows;
let tc;


runOnStartup(async runtime => {
    // Code to run on the loading screen.
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime) {
    // Code to run just before the project starts.
    
    // Keyboard events.
    runtime.addEventListener("keydown", e => onKeyDown(e, runtime));
    
    // Procedures that happen before the layout starts.
    runtime.layout.addEventListener(
        "beforelayoutstart", () => onBeforeLayoutStart(runtime)
    );
    
    // Start ticking.
    runtime.addEventListener("tick", () => onTick(runtime));
}

async function onBeforeLayoutStart(runtime) {
    // Code to run just before the layout starts.
    
    // Shorthand to reduce noise in the code.
    const ro = runtime.objects;

    // Load heroes.
    await fetch('./heroes.json')
          .then((r) => r.json())
          .then((json) => heroes = json["heroes"]);
    
    // Get instances.
    chart = ro.Chart.getFirstInstance();
    heroClass = ro.HeroClass.getFirstInstance();
    heroDesc = ro.HeroDesc.getFirstInstance();
    heroName = ro.HeroName.getFirstInstance();
    heroPortrait = ro.HeroPortrait.getFirstInstance();
    heroSymbol = ro.HeroSymbol.getFirstInstance();
    hexBG1 = ro.HexagonBG1.getFirstInstance();
    hexBG2 = ro.HexagonBG2.getFirstInstance();
    background1 = ro.Background1.getFirstInstance();
    background2 = ro.Background2.getFirstInstance();
    lore = ro.Lore.getFirstInstance();
    useTheArrows = ro.UseTheArrows.getFirstInstance();

    // Get timeline controller.
    tc = runtime.timelineController;
    
    // Get the mesh points of a "neutral" hero (no stats).
    for (let i = 0; i < MESH.rows; i++) {
    
        // Push empty array to hero.
        defaultHero.push([]);
        
        // Push (x, y) mesh position.
        for (let j = 0; j < MESH.cols; j++) {
            const m = chart.getMeshPoint(i, j);
            defaultHero[i].push({x: m.x, y: m.y});
        }
    }
    
    // Update chart with new information.
    updateChart(runtime);
}

function onKeyDown(e, runtime) {
    // Process key down event.
    
    // Get conditions to halt the keypress event.
    const timelineRunning = [...tc.allTimelines()].some(i => i.isPlaying);
    const invalidKey = !["ArrowLeft", "ArrowRight"].includes(e.key);

    // Return if any of the above conditions are met.
    if (timelineRunning || invalidKey) {
        return;
    }
    
    // Get number of heroes.
    const s = heroes.length;

    // Go to previous hero.
    if (e.key == "ArrowLeft") {
        currHero = currHero == 0 ? s - 1 : currHero - 1;
    }
    
    // Go to next hero.
    else if (e.key == "ArrowRight") {
        currHero = (currHero + 1) % s
    }
    
    // Update screen.
    updateChart(runtime);
    updateSprites();
}

function adaptMeshPosition(mp, x, y, val) {
    // Adapt mesh point position to reflect new stats.
    
    // 30° in radians.
    const thirtyDeg = Math.PI / 6;
    
    // Pre-process val.
    val = (val - 1) / 9;
    
    // top mesh points.
    if (y == 0) {
        mp.y -= Math.cos(thirtyDeg) * val;
        if (x == 0) {
            mp.x -= Math.sin(thirtyDeg) * val;
        } else {
            mp.x += Math.sin(thirtyDeg) * val;
        }
        
    // middle mesh points (move only in x).
    } else if (y == 1) {
        if (x == 0) {
            mp.x -= val;
        } else {
            mp.x += val;
        }
    
    // bottom mesh points.
    } else if (y == 2) {
        mp.y += Math.cos(thirtyDeg) * val;
        if (x == 0) {
            mp.x -= Math.sin(thirtyDeg) * val;
        } else {
            mp.x += Math.sin(thirtyDeg) * val;
        }
    }
}

function updateChart(runtime) {
    // Update chart according to currently selected hero.
    
    // Clear meshTweens array.
    meshTweens = [];
    
    for (let i = 0; i < MESH.rows; i++) {
    
        // Push empty array to meshTweens.
        meshTweens.push([]);
    
        for (let j = 0; j < MESH.cols; j++) {
            // Get mesh point (i, j).
            const mStatic = chart.getMeshPoint(i, j);
            const m = chart.getMeshPoint(i, j);
            
            // Reset it to the default hero's position.
            m.x = defaultHero[i][j].x;
            m.y = defaultHero[i][j].y;
            
            // Adapt its position to match current hero's stat.
            adaptMeshPosition(m, i, j, heroes[currHero].stats[i * MESH.cols + j]);
        
            // Start X morph for mesh point (i, j).
            const tx = chart.behaviors.Tween.startTween(
                "value", m.x, MORPHTIME, "in-out-sine", {startValue: mStatic.x}
            );
            
            // Start Y morph for mesh point (i, j).
            const ty = chart.behaviors.Tween.startTween(
                "value", m.y, MORPHTIME, "in-out-sine", {startValue: mStatic.y}
            );
            
            // Start color morph for the whole mesh.
            chart.behaviors.Tween.startTween(
                "color", heroes[currHero].chart, MORPHTIME, "in-out-sine"
            );
            
            // Add (tx, ty) tweens to current meshTweens sub-array.
            meshTweens[i].push({tx: tx, ty: ty});
        }
    }
}

function morphChartMesh(runtime) {
    // Morph chart by moving mesh points according to tweens.
    
    // Only proceed with the function if tweens are running.
    if (chart.behaviors.Tween.allTweens().next().done) {
        return;
    }

    // Use the values from the tweens to set mesh points positions.
    for (let i = 0; i < MESH.rows; i++) {
        for (let j = 0; j < MESH.cols; j++) {
            const x = meshTweens[i][j].tx.value;
            const y = meshTweens[i][j].ty.value;
            chart.setMeshPoint(i, j, {x: x, y: y});
        }
    }
}

async function updateSprites() {
    // Update the screen to reflect currently selected hero

    /* The update happens in 3 parts:
     * - Before the swap animation plays, set background2 and hexBG2 animations
     *   to match the currently selected hero;
     * - During the swap, when all relevant objects are outside the screen, swap
     *   their animations too;
     * - Lastly, after the swap, set background1 and hexBG1 animations and reset
     *   their opacity back to 100%.
     *
     * NOTE: Typewriting for lore occurs independently from everything else, and
     *       chart mesh points are updated by updateChart function.
     */
    
    // Typewrite the lore.
    lore.typewriterText(heroes[currHero].lore, TYPESPEED);
    
    // Pre-Swap changes.
    background2.animationFrame = currHero;
    hexBG2.animationFrame = currHero;
    
    // Play Swap timeline.
    const swap = tc.play("Swap");
    
    // Swap sprites when the Swap is halfway finished.
    setTimeout(() => {
        heroClass.animationFrame = currHero;
        heroDesc.animationFrame = currHero;
        heroName.animationFrame = currHero;
        heroPortrait.animationFrame = currHero;
        heroSymbol.animationFrame = currHero;
        useTheArrows.animationFrame = currHero;
    }, swap.totalTime * 500);
    
    // Wait for swap to finish.
    await swap.finished;
    
    // Post-Swap changes.
    background1.animationFrame = currHero;
    background1.opacity = 100;
    hexBG1.animationFrame = currHero;
    hexBG1.opacity = 100;
}

function onTick(runtime) {
    // Code to run every tick.
    
    morphChartMesh(runtime);
}