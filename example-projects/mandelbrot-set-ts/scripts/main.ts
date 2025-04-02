/*
 * Made by Viridino Studios (@ViridinoStudios)
 *
 * Mateus Ferreira Moreira - Programmer
 * E-mail: ferreiramoreiramateus@gmail.com | Twitter: @BonzerKitten
 *
 * Felipe Vaiano Calderan - Programmer
 * E-mail: fvcalderan@gmail.com | Twitter: @fvcalderan
 *
 * Wesley Andrade - Artist
 * E-mail: wesleymatos1989@gmail.com | Twitter: @andrart7
 *
 * Made with the support of patrons on https://www.patreon.com/viridinostudios
 */
 
//=============================================================================

/* The Mandelbrot set is defined by complex numbers C, where the recursive
 * function z(n+1) = z(n)**2 + C remains bounded. It is well known for being
 * a fractal with very beautiful patterns.
 *
 * Fractals are found everywhere in nature. Basically, they are objects where
 * their various separate parts replicate the features of the whole. This can
 * be observed in the Mandelbrot set by zooming in into the borders of the
 * structure.
 *
 * In this implementation, especially considering it is a web-based and mostly
 * single-threaded CPU environment, many limitations are needed. These include
 * finite resolution, a limited number of iterations, and a real number acting
 * as a divergence threshold. It is possible to achieve much better performance
 * using GPU shaders, but this is outside the scope of this example.
 *
 * To enhance the generated figure's quality, adjust the viewport, layout, and
 * DrawingCanvas sizes, along with the MAXITER and MAXZOOM constants.
 * Increasing these values improves image quality but will impact performance.
 * As hardware configurations vary, finding the optimal balance between quality
 * and performance is left to your discretion.
 *
 * Some references to obtain more information about the topic:
 * https://en.wikipedia.org/wiki/Fractal
 * https://en.wikipedia.org/wiki/Mandelbrot_set
 */

class CPLX {
    /* Complex number class. A complex number is defined by a real and an
     * imaginary part. Such numbers are typically mathematically expressed in
     * the form z = a + bi, where i**2 = -1.
     * See https://en.wikipedia.org/wiki/Complex_number for more details
     */

    r: number;
    i: number;
    
    constructor(r: number, i: number) {
        // Construct a new complex number
    
        this.r = r; // Real part
        this.i = i; // Imaginary part
    }
    
    squared() {
        // Compute Z**2
        
        return new CPLX(
            this.r**2 - this.i**2, // Real part
            2 * this.r * this.i    // Imaginary part
        );
    }
    
    norm() {
        // Compute the norm
    
        return (this.r**2 + this.i**2)**(1/2);
    }
    
    add(other: CPLX) {
        // Add two CPLX
    
        return new CPLX(
            this.r + other.r, // Real part
            this.i + other.i  // Imaginary part
        );
    }
}

// Instances
let canvas: InstanceType.DrawingCanvas;
let textTutorial: InstanceType.TextTutorial;

// Settings
const MAXDIST = 2; // Maximum permitted distance from origin
const MAXZOOM = 4096; // Maximum permitted zoom
const BOUNDS = {minR: -2, maxR: 1, minI: -1, maxI: 1}; // Set bounds

// Global variables
let maxIter = 32;
let xOffset = 0;
let yOffset = 0;
let zoom = 1;
let colorOffset = 270;

runOnStartup(async runtime => {
    // Code to run on the loading screen
    
    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});

async function onBeforeProjectStart(runtime: IRuntime) {
    // Code to run just before 'On start of layout'
    
    // Get instances
    canvas = runtime.objects.DrawingCanvas.getFirstInstance()!;
    textTutorial = runtime.objects.TextTutorial.getFirstInstance()!;

    // Draw Mandelbrot Set
    drawMandelbrot(runtime);
    
    // Keyboard events
    runtime.addEventListener("keydown", e => onKeyDown(e, runtime));
}

function onKeyDown(e: KeyboardEvent, runtime: IRuntime) {
    // Process keyboard inputs
    
    switch (e.key) {
        // Pan around. The bigger the zoom, the more subtle the pan
        case "ArrowLeft":
            xOffset = Math.max(xOffset - 0.25/zoom, -2);
            break;
        case "ArrowRight":
            xOffset = Math.min(xOffset + 0.25/zoom, 2);
            break;
        case "ArrowUp":
            yOffset = Math.max(yOffset - 0.25/zoom, -2);
            break;
        case "ArrowDown":
            yOffset = Math.min(yOffset + 0.25/zoom, 2);
            break;
        
        // Zoom
        case "PageDown":
            zoom = Math.max(zoom/2, 1);
            break;
        case "PageUp":
            zoom = Math.min(zoom*2, MAXZOOM);
            break;
        
        // Color
        case " ":
            colorOffset = (colorOffset + 30) % 360;
            break;
        
        // Tutorial
        case "h":
            textTutorial.isVisible = !textTutorial.isVisible;
            break;
        case "H":
            textTutorial.isVisible = !textTutorial.isVisible;
            break;
        
        // Save snapshot
        case "s":
            runtime.callFunction("saveImage");
            break;
        case "S":
            runtime.callFunction("saveImage");
            break;
    }
    
    // The bigger the zoom, the more detailed Mandelbrot set is drawn
    maxIter = Math.min(Math.max(zoom, 32), MAXZOOM);
    drawMandelbrot(runtime);
}

function HSL2RGB1(h: number, s: number, l: number) {
    /* Convert from HSL(360, 100, 100) to RGB(1.0, 1.0, 1.0)
     * Adapted from https://www.30secondsofcode.org/js/s/hsl-to-rgb/
     */
    
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)];
}

function computeMandelbrot(C: CPLX) {
    // Compute for how long C is bounded by Mandelbrot set

    let z = new CPLX(0, 0);
    let n = 0;
    let znorm = 0;
    
    // This is the recurrent formula z(n+1) = z(n)**2 + C
    while (znorm <= MAXDIST && (n++) < maxIter) {
        z = z.squared().add(C);
        znorm = z.norm();
    }
    
    return {outsideSet: znorm > MAXDIST, iterations: n};
}

function drawMandelbrot(runtime: IRuntime) {
    // Draw Mandelbrot set
    
    // Shorthand expressions to make the code easier to read
    const height = canvas.height;
    const width = canvas.width;

    // Draw in every available pixel
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
        
            // Set starting position C
            const C = new CPLX(
                BOUNDS.minR/zoom + (i / width) * (
                    BOUNDS.maxR - BOUNDS.minR
                )/zoom + xOffset,
                BOUNDS.minI/zoom + (j / height) * (
                    BOUNDS.maxI - BOUNDS.minI
                )/zoom + yOffset
            );
            
            // Compute for how long C is bounded by Mandelbrot set
            const m = computeMandelbrot(C);

            /* Cs within the set are black, while the outside ones are colored
             * according to the # iterations necessary during computation
             */
            let [r, g, b] = [0, 0, 0];
            if (m.outsideSet) {
                [r, g, b] = HSL2RGB1(
                    (m.iterations/maxIter * 360 + colorOffset) % 360, 90, 50
                );
            }
            
            // Draw a "pixel-sized" rectangle using previously defined color
            canvas.fillRect(i, j, i+1, j+1, [r, g, b, 1]);
        }
    }
}