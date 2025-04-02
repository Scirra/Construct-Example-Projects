
// Import the helper class MultiEventHandler.
import { MultiEventHandler } from "./multiEventHandler.js";

// A reference to the created MultiEventHandler if any.
let eventHandlers = null;

// Get to the "beforeprojectstart" event
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Handle clicks on the "Attach events" and "Detach events" buttons.
	const attachButtonInst = runtime.objects.AttachEvents.getFirstInstance();
	attachButtonInst.addEventListener("click", () => OnAttachEventsClick(runtime));
	
	const detachButtonInst = runtime.objects.DetachEvents.getFirstInstance();
	detachButtonInst.addEventListener("click", () => OnDetachEventsClick());
}

// Called when clicking "Attach events".
function OnAttachEventsClick(runtime)
{
	if (eventHandlers)
		return;		// already attached events
	
	// Here we add two event listeners using MultiEventHandler.
	// Each row will call addEventListener().
	eventHandlers = new MultiEventHandler([
		// e.g. this row will call runtime.addEventListener("tick", () => Tick(runtime))
		[runtime,		"tick",				() => Tick(runtime)],
		[runtime,		"pointerdown",		() => OnPointerDown(runtime)]
	]);
}

// Called when clicking "Detach events".
function OnDetachEventsClick()
{
	if (!eventHandlers)
		return;		// already detached events
	
	// The main purpose of MultiEventHandler is the single Release() call automatically
	// removes all its event listeners. Otherwise there would need to be a list of calls
	// like runtime.removeEventListener("tick", ...) with references to the same functions
	// originally passed to addEventListener().
	eventHandlers.Release();
	eventHandlers = null;
}

// In the tick event, update a text object with the current time, rounded to 2 decimal places.
function Tick(runtime)
{
	const textInst = runtime.objects.TickText.getFirstInstance();
	textInst.text = "Tick event at time " + (Math.round(runtime.gameTime * 100) / 100);
}

// In a pointerdown event, just add the word "pointerdown" to another text object.
function OnPointerDown(runtime)
{
	const textInst = runtime.objects.EventsText.getFirstInstance();
	textInst.text += "pointerdown ";
}