
// This script is in the "Files" folder rather than the "Scripts"
// folder, so it is treated as an external file. It's not imported by
// any other script and so won't be loaded automatically.
// It defines a global function rather than using exports.
globalThis.MyExternalFunction = function()
{
	// Just return a string to show the text came
	// from this script.
	return "My external function was called";
}