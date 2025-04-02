
// This is a small helper class to make it easier to add and remove
// a list of event listeners.
// Without it there would need to be long lists of event listeners with each
// handler being a property to make sure it can be released again, e.g.:
//
// function OnPointerDown(e) { ... };
// function OnPointerMove(e) { ... };
// function OnPointerUp(e) { ... }
// runtime.addEventListener("pointerdown", OnPointerDown);
// runtime.addEventListener("pointermove", OnPointerMove);
// runtime.addEventListener("pointerup",   OnPointerUp);
//
// And then later:
//
// runtime.removeEventListener("pointerdown", OnPointerDown);
// runtime.removeEventListener("pointermove", OnPointerMove);
// runtime.removeEventListener("pointerup",   OnPointerUp);
//
// This class simplifies this by allowing a table of event listeners, e.g.:
//
// let eventHandlers = new MultiEventHandler([
//	 [runtime, "pointerdown", e => ... ],
//	 [runtime, "pointermove", e => ... ],
//	 [runtime, "pointerup",   e => ... ],
//]);
//
// All those event handlers can then be removed by a single call:
//
// eventHandlers.Release();
//
// This reduces the repetition of event handlers, is less error prone
// as all events are automatically removed, and avoids the need for
// having to keep references to the original event handler functions.

export class MultiEventHandler {

	constructor(arr)
	{
		this.eventHandlers = arr;
		
		for (const [obj, eventName, handler] of this.eventHandlers)
		{
			obj.addEventListener(eventName, handler);
		}
	}
	
	Release()
	{
		for (const [obj, eventName, handler] of this.eventHandlers)
		{
			obj.removeEventListener(eventName, handler);
		}
	}
}
