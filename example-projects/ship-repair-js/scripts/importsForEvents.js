// Global variables.
let viewport = null;
let menu = null;
let angle = 0;
let N = 0;
let step = 0;

function showMenu() {
	// Toggle menu's visibility.
	viewport.classList.remove("hidden");
}

function hideMenu() {
	// Toggle menu's visibility.
	viewport.classList.add("hidden");
}

function rotateLeft() {
	// Rotate the menu clockwise by "a" degrees.
	angle -= step;
	menu.style.setProperty("--rot", `${angle}deg`);
}

function rotateRight() {
	// Rotate the menu counter-clockwise by "a" degrees.
	angle += step;
	menu.style.setProperty("--rot", `${angle}deg`);
}

function rebuildMenu(imageStr) {
	// Parse images string.
	const images = imageStr.trim().split(/\s+/);

	// Delete previous viewport.
	viewport?.remove();

	// Create the viewport.
	createMenuViewport(images);
	
	// Setup the menu layout.
	buildMenuLayout();
}

function createMenuViewport(images) {
    // Create viewport (which contains the menu).
	viewport = document.createElement("div");
	viewport.id = "menu-viewport";
	viewport.className = "menu-viewport";

    // Create the menu.
	menu = document.createElement("div");
	menu.id = "menu";
	menu.className = "menu";

    // Add images to the menu.
	images.forEach(item => {
		const img = document.createElement("img");
		img.src = `./Assets/Tex${item}.png`;
        img.alt = item;
		menu.appendChild(img);
	});

    // Add menu as a child of the viewport.
	viewport.appendChild(menu);

    // Append the viewport to the document's body.
    document.body.appendChild(viewport);

    // Viewport starts hidden.
	viewport.classList.toggle("hidden");
}

function buildMenuLayout() {
	// Get images.
	const images = [...menu.querySelectorAll("img")];

	// Compute how far apart each image will be, given the number of them.
	N = images.length;
	step = 360 / N;

	// Apply the computed angles.
	images.forEach((img, i) => {
		img.style.setProperty("--_a", `${i * step}deg`);
	});

    // Setup starting menu position, given the amount of elements.
    angle = step;
	if (N % 2 == 1) angle /= 2;
	angle -= step;
	menu.style.setProperty("--rot", `${angle}deg`);
}

function getSelected() {
    // Get selected item.

    // "Front" item is the one with angle closest to 180deg.
    const imgs = [...menu.querySelectorAll("img")];
    const idx = Math.round((180 - angle) / step);
    const i = ((idx % N) + N) % N;

    return imgs[i].alt;
}