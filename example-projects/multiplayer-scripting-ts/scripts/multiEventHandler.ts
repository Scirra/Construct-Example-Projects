
// A helper class for managing multiple event handlers.
// See the "Handling multiple events" example for more details.
interface AnyEventTarget {
	addEventListener(obj: any, name: any, opts?: any): void;
	removeEventListener(obj: any, name: any, opts?: any): void;
}

type EventHandlerEntry = [AnyEventTarget, string, Function];

export class MultiEventHandler {

	eventHandlers: EventHandlerEntry[];

	constructor(arr: EventHandlerEntry[])
	{
		this.eventHandlers = arr;
		
		for (const [obj, eventName, handler] of this.eventHandlers)
		{
			// TypeScript note: TypeScript has a complicated error about the
			// type of 'handler' here, as it could either be the event listener
			// for a DOM event or Construct event but our EventHandlerEntry
			// type allows any kind of Function. Just use the 'any' type to
			// stop the error coming up.
			obj.addEventListener(eventName, <any> handler);
		}
	}
	
	Release()
	{
		for (const [obj, eventName, handler] of this.eventHandlers)
		{
			obj.removeEventListener(eventName, <any> handler);
		}
	}
}
