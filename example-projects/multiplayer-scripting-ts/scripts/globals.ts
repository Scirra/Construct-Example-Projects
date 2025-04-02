
import { TitleLayoutManager } from "./titleLayout.js";
import { RoomLayoutManager } from "./roomLayout.js";

// Some global variables shared across layouts.
export default {
	// TitleLayoutManager, if created
	titleLayoutManager: <TitleLayoutManager | null> null,

	// RoomLayoutManager, if created

	roomLayoutManager: <RoomLayoutManager | null> null,

	alias: "",					// Alias user chose on title screen
	room: ""					// Room name user chose on title screen
};
