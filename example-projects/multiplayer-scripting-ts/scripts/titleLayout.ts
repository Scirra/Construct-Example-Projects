
import Globals from "./globals.js";
import { MultiEventHandler } from "./multiEventHandler.js";

// The TitleLayoutManager class is created for the Title layout.
export class TitleLayoutManager
{
	runtime: IRuntime;
	eventHandlers: MultiEventHandler;

	goButton: InstanceType.GoButton;
	aliasInput: InstanceType.AliasInput;
	roomInput: InstanceType.RoomInput;

	constructor(runtime: IRuntime)
	{
		this.runtime = runtime;
		
		// Get the various buttons and text inputs as instances.
		this.goButton = runtime.objects.GoButton.getFirstInstance()!;
		this.aliasInput = runtime.objects.AliasInput.getFirstInstance()!;
		this.roomInput = runtime.objects.RoomInput.getFirstInstance()!;
		
		// Events to listen for on this layout.
		this.eventHandlers = new MultiEventHandler([
			[runtime,			"keydown",		(e: KeyboardEvent) => this.OnKeyDown(e)],
			[this.goButton,		"click",		() => this.OnClickGoButton()]
		]);
		
		this.aliasInput.focus();
	}
	
	Release()
	{
		this.eventHandlers.Release();
	}
	
	OnClickGoButton()
	{
		// Get the entered alias and room name.
		const alias = this.aliasInput.text;
		const room = this.roomInput.text;
		
		// If both are not empty, save them to globals and go to the "Room" layout.
		if (alias && room)
		{
			Globals.alias = alias;
			Globals.room = room;
			this.runtime.goToLayout("Room");
		}
	}
	
	OnKeyDown(e: KeyboardEvent)
	{
		// Handle pressing the Enter key the same as clicking the "Go" button.
		if (e.key === "Enter")
			this.OnClickGoButton();
	}
}