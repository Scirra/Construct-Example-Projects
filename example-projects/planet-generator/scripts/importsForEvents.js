export function hexToRgbString(hex) {
	// Convert Hex to RGB255 String.
	const r = parseInt(hex.substring(1, 3), 16);
	const g = parseInt(hex.substring(3, 5), 16);
	const b = parseInt(hex.substring(5, 7), 16);
	return `${r} ${g} ${b}`;
}

export function hexToRgb(hex) {
    // Convert Hex to [R, G, B] array.
	return [
		parseInt(hex.substring(1, 3), 16)/255,
		parseInt(hex.substring(3, 5), 16)/255,
		parseInt(hex.substring(5, 7), 16)/255
	];
}