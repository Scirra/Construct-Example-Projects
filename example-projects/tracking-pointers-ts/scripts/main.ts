
// Import the PointerInfo class, used to represent an individual pointer.
import { PointerInfo } from "./pointerInfo.js";

// All the current simultaneous pointers are stored in this map.
// The keys are the pointer IDs, and the values are PointerInfo objects.
const pointerMap = new Map();

// Get to the beforeprojectstart event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Listen for all the different kinds of pointer events.
	// Learn more about pointer events here:
	// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
	runtime.addEventListener("pointerdown",   (e: PointerEvent) => OnPointerDown(runtime, e));
	runtime.addEventListener("pointermove",   (e: PointerEvent) => OnPointerMove(e));
	runtime.addEventListener("pointerup",     (e: PointerEvent) => OnPointerUp(e));
	runtime.addEventListener("pointercancel", (e: PointerEvent) => OnPointerCancel(e));
}

// When a pointer down event happens (including a mouse button down or touch start),
// create a new PointerInfo object to represent this pointer, and add it to the
// pointerMap by its pointerId (a unique ID for just this pointer).
function OnPointerDown(runtime: IRuntime, e: PointerEvent)
{
	pointerMap.set(e.pointerId, new PointerInfo(runtime, e));
}

// When a pointer moves, look it up in pointerMap by its ID.
// If it is found, call OnMove() on the PointerInfo object.
function OnPointerMove(e: PointerEvent)
{
	const pointerInfo = pointerMap.get(e.pointerId);
	if (!pointerInfo)
		return;		// ignore if ID not found
	
	pointerInfo.OnMove(e);
}

// When a pointer is released, look it up in the pointerMap by its ID.
// If it is found, call OnUp(), and then delete it from the pointerMap,
// as it is no longer active.
function OnPointerUp(e: PointerEvent)
{
	const pointerInfo = pointerMap.get(e.pointerId);
	if (!pointerInfo)
		return;
	
	pointerInfo.OnUp(e);
	
	pointerMap.delete(e.pointerId);
}

// The "pointercancel" event works similarly to "pointerup", but the difference
// is it should not apply any user action. For example if there are more simultaneous
// touches on a touchscreen than the device supports, it may start cancelling
// pointers; if another app suddenly appears in focus, existing pointers may be
// cancelled; and so on. If the user has done something like drag a selection box,
// in "pointerup" the selection box should be removed and items inside the box selected;
// however in "pointercancel" the selection box should be removed but nothing selected,
// as the user action should not be applied.
function OnPointerCancel(e: PointerEvent)
{
	const pointerInfo = pointerMap.get(e.pointerId);
	if (!pointerInfo)
		return;
	
	pointerInfo.OnCancel(e);
	
	pointerMap.delete(e.pointerId);
}