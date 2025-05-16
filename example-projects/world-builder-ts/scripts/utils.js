export function cubic(p0, p1, p2, p3, t) {
    // Cubic interpolation of 4 values.

	const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
	const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
	const c = -0.5 * p0 + 0.5 * p2;
	const d = p1;
	return a * (t * t * t) + b * (t * t) + c * t + d;
}

export function clamp(val, min, max) {
    // Clamp helper function.

	return Math.max(min, Math.min(max, val));
}

export function lerp(value, inMin, inMax, outMin, outMax) {
    // Linear interpolation helper function.

	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function rnd(seed) {
    // mulberry32 - seeded pseudo-random number generator.

	seed |= 0;
	seed = (seed + 0x6D2B79F5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}