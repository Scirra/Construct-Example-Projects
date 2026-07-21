export function hex2rgb (hex) {
    // Convert from hex to rgb (0-1 range).

    const n = parseInt(hex.slice(1), 16);
    return [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255
    ];
};

export function* cycleColors() {
    // Color iterator.

    // Table of predefined colors.
    const colorArr = [
        "#87d88a", "#1f93b4", "#e66c76",
        "#f6b923", "#997a70", "#f45c57",
        "#a4a9da", "#d8b187", "#70d2ff",
        "#ffb6fe", "#17ba5c", "#ff9256",
        "#fff77b", "#be7cc3", "#ff53a4"
    ];

    // This shuffle is not uniform, but suffices.
    colorArr.sort(() => Math.random() - 0.5);

    // Return colors one by one.
    while (true) yield* colorArr;
}

export function pointerPos(layer, e) {
    // Return pointer layer position.

    return layer.cssPxToLayer(e.clientX, e.clientY);
}

export function pointerOverObj(layer, obj, e) {
	// Check if pointer pointer is over a given object.

	return obj.containsPoint(...pointerPos(layer, e));
}

export function dist2D(x1, y1, x2, y2) {
    // Euclidean distance between 2 points.

    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export function angleBetween(x1, y1, x2, y2) {
    // Calculate the angle between two points.

    return Math.atan2(y2 - y1, x2 - x1);
}

export function lock2step(value, step) {
    // Lock value to step.

    return Math.round(value / step) * step;
}

export function pointFromAngle(x, y, angle, length) {
    // Return the projected point from a given distance in a direction.

    return [
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
    ];
}

export function angle2direction(angle) {
    // Convert an angle to a directions tuple.

    // Direction matrix.
    const DIRECTIONS = [
        [ 1,  0], [ 1,  1], [ 0,  1],
        [-1,  1],           [-1,  0],
        [-1, -1], [ 0, -1], [ 1, -1],
    ];

    // Compute direction index, given the angle.
	const index = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;

    // Return direction tuple.
	return DIRECTIONS[index];
}

export function getRandomItems(arr, n) {
    // Extract N unique random items from an array.

    const shuffled = [...arr]; 

    for (let i = shuffled.length - 1; i > shuffled.length - 1 - n && i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(-n);
}