let lastCellWidth;
let lastCellHeight;
let lastUniqueSetString;
let lastSpacingArray;
let canvas;

export async function loadFont(runtime) {
    // Get objects.
    const bd = runtime.objects.BinaryData1.getFirstInstance();

    // Create font from binary data.
    const font = new FontFace("UploadedFont", bd.getArrayBufferCopy());

    // Try to load the font.
    try {
        const loaded = await font.load();
        document.fonts.add(loaded);
        runtime.globalVars.validFont = true;
    } catch (err) {
        runtime.globalVars.validFont = false;
    }
}

export function renderFont(runtime) {
    // Helper to quickly get unique game objects.
    const ro = s => runtime.objects[s].getFirstInstance();

    // Get anti-aliasing preference.
    const antiAliasing = runtime.globalVars.antiAliasing;

    // Get unique characters (order preserved, newlines removed).
    const uniqueChars = [...new Set(ro("TextCharSet").text.replace(/[\n\r]/g, ""))];

    // Get font size.
    const fontSize = parseInt(ro("TextFontSize").text, 10);

    // Get maximum spritesheet width, in pixels.
    const maxPixelWidth = parseInt(ro("TextMaxWidth").text, 10);

    // Get canvas context to perform measurements.
    canvas = document.getElementById("renderCanvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px "UploadedFont"`;
    ctx.textBaseline = "alphabetic";

    // Compute reference metrics for height.
    const refMetrics = ctx.measureText("Mg");
    const ascent  = Math.ceil(refMetrics.actualBoundingBoxAscent || fontSize);
    const descent = Math.ceil(refMetrics.actualBoundingBoxDescent || fontSize * 0.25);
    const innerHeight = ascent + descent;
    const cellHeight = innerHeight + 6;

    // Get characters width and spacing.
    const charInfos = uniqueChars.map(ch => {
        const charWidth = ctx.measureText(ch).width;
        const spacingWidth = Math.ceil(charWidth) + 2;
        return { ch, charWidth, spacingWidth };
    });

    // The monospaced cell width is the maximum spacing width.
    const cellWidth = Math.max(...charInfos.map(info => info.spacingWidth)) + antiAliasing * 2;

    // Compute the maximum number of characters per row.
    const maxCharsPerRow = Math.floor(maxPixelWidth / cellWidth) || 1;

    // Build spacing data groups.
    const spacingMap = new Map();
    for (const { ch, spacingWidth } of charInfos) {
        spacingMap.set(spacingWidth, (spacingMap.get(spacingWidth) ?? "") + ch);
    }
    const spacingArray = [...spacingMap.entries()].sort((a, b) => a[0] - b[0]);

    // Compute the number of rows and columns for the spritesheet.
    const numChars = uniqueChars.length;
    const cols = Math.min(numChars, maxCharsPerRow);
    const rows = Math.ceil(numChars / maxCharsPerRow);

    // Total canvas size = grid of cells.
    const totalWidth  = cellWidth * cols;
    const totalHeight = cellHeight * rows;
    canvas.width  = totalWidth;
    canvas.height = totalHeight;

    // Get canvas context to render the spritesheet.
    const ctx2 = canvas.getContext("2d");
    ctx2.font = `${fontSize}px "UploadedFont"`;
    ctx2.textBaseline = "alphabetic";
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.fillStyle = "white";

    // Place characters in a grid: (col, row) based on index.
    charInfos.forEach(({ ch, charWidth }, index) => {
        // Compute cell row/column from linear index.
        const col = index % maxCharsPerRow;
        const row = Math.floor(index / maxCharsPerRow);

        // Top-left corner of this cell.
        const cellX = col * cellWidth;
        const cellY = row * cellHeight;

        // Baseline Y inside this row: 2px top padding + ascent.
        const baselineY = Math.round(cellY + 3 + ascent);

        // Center glyph horizontally inside the cell.
        const offsetX = Math.floor((cellWidth - charWidth) / 2);
        const drawX = cellX + offsetX;

        ctx2.fillText(ch, drawX, baselineY);
    });

    /* Browsers always render text with anti-aliasing, but pixel-art fonts often
     * require crisp, non-blurred edges. The code below provides a simple work around
     * to "disable" anti-aliasing by converting each pixel to either fully opaque or
     * fully transparent (process known as binarization).
     */
    if (!antiAliasing) {
        const img = ctx2.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data;

        // Find the strongest non-zero alpha.
        let maxAlpha = 0;
        for (let i = 3; i < d.length; i += 4) {
            if (d[i] > maxAlpha) maxAlpha = d[i];
        }

        // If nothing was drawn, bail out.
        if (maxAlpha === 0) {
            ctx2.putImageData(img, 0, 0);
        } else {
            // Use 70% of the strongest alpha as threshold, and clamp it for safety.
            let threshold = Math.floor(maxAlpha * 0.7);
            threshold = Math.max(96, Math.min(210, threshold));

            // Binarize using the calculated threshold.
            for (let i = 0; i < d.length; i += 4) {
                const a = d[i + 3];
                if (a > threshold) {
                    d[i] = d[i + 1] = d[i + 2] = 255;
                    d[i + 3] = 255;
                } else {
                    d[i + 3] = 0;
                }
            }
            ctx2.putImageData(img, 0, 0);
        }
    }

    // Store metrics for the properties file.
    lastCellWidth = cellWidth;
    lastCellHeight = cellHeight;
    lastUniqueSetString = uniqueChars.join("");
    lastSpacingArray = spacingArray;

    // Get previewCanvas.
    const previewCanvas = document.getElementById("previewCanvas");
    const previewCtx = previewCanvas.getContext("2d");

    // Get canvas dimensions.
    const srcW = canvas.width;
    const srcH = canvas.height;

    // Get canvas sizes.
    const rect = previewCanvas.getBoundingClientRect();
    let dstW = rect.width;
    let dstH = rect.height;

    // Set preview canvas sizes.
    previewCanvas.width = dstW;
    previewCanvas.height = dstH;

    // Compute scale to fit source into destination.
    const scale = Math.min(dstW / srcW, dstH / srcH, 1);
    const drawW = srcW * scale;
    const drawH = srcH * scale;

    // Center contents inside previewCanvas.
    const offsetX = (dstW - drawW) / 2;
    const offsetY = (dstH - drawH) / 2;

    // Draw everything to previewCanvas.
    previewCtx.clearRect(0, 0, dstW, dstH);
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.drawImage(canvas, 0, 0, srcW, srcH, offsetX, offsetY, drawW, drawH);

    // Convert text from white to black on preview only.
    let img = previewCtx.getImageData(0, 0, dstW, dstH);
    let d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a > 0) {
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
            d[i + 3] = a;
        }
    }
    previewCtx.putImageData(img, 0, 0);
}

export function clearPreview() {
    const previewCanvas = document.getElementById("previewCanvas");
    const ctx = previewCanvas.getContext("2d");
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

export async function downloadFont(runtime) {
    
    // Set BinaryData1 contents to the sprite sheet image.
    const bd1 = runtime.objects.BinaryData1.getFirstInstance();

    canvas.toBlob(function (blob) {
        blob.arrayBuffer().then(buffer => {
            bd1.setArrayBufferTransfer(buffer);
        });
    }, "image/png");

    // Set BinaryData2 contents to the properties file text.
    const bd2 = runtime.objects.BinaryData2.getFirstInstance();

    const lines = [
        `Character width: ${lastCellWidth}`,
        `Character height: ${lastCellHeight}`,
        `Character set: ${lastUniqueSetString}`,
        `Spacing data: ${JSON.stringify(lastSpacingArray)}`
    ];
    const textBlob = new Blob([lines.join("\n")], {
        type: "text/plain"
    });
    const textBuffer = await textBlob.arrayBuffer();

    bd2.setArrayBufferTransfer(textBuffer);
}