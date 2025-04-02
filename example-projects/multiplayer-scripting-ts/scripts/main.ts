
import Globals from "./globals.js";
import { TitleLayoutManager } from "./titleLayout.js";
import { RoomLayoutManager } from "./roomLayout.js";

// Get to the beforeprojectstart event
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Get both the Title and Room layouts.
	const titleLayout = runtime.getLayout("Title");
	const roomLayout = runtime.getLayout("Room");
	
	// As a way to conveniently manage different layouts from code,
	// create a dedicated class for each layout when it starts, and release
	// it when the layout ends. TitleLayoutManager is used for the "Title"
	// layout and RoomLayoutManager is used for the "Room" layout.
	// Each is stored in the Globals object.
	titleLayout.addEventListener("beforelayoutstart", () =>
	{
		Globals.titleLayoutManager = new TitleLayoutManager(runtime);
	});
	
	titleLayout.addEventListener("beforelayoutend", () =>
	{
		Globals.titleLayoutManager!.Release();
		Globals.titleLayoutManager = null;
	});
	
	roomLayout.addEventListener("beforelayoutstart", () =>
	{
		Globals.roomLayoutManager = new RoomLayoutManager(runtime);
	});
	
	roomLayout.addEventListener("beforelayoutend", () =>
	{
		Globals.roomLayoutManager!.Release();
		Globals.roomLayoutManager = null;
	});
}
