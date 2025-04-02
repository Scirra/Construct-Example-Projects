
// A helper class for managing multiple event handlers.
// See the "Handling multiple events" example for more details.
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