
// The Text object instance, used to display messages.
let textInstance = null;

// Helper function to add a line to the Text object.
// The message is also logged to the console.
function showMessage(message)
{
	textInstance.text += "\n" + message;
	
	console.log(message);
}

// Startup code
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime)
{
	// Save the Text object instance
	textInstance = runtime.objects.Text.getFirstInstance();
	
	// Start loading external script and WebAssembly
	LoadExternalScriptAndWasm(runtime);
}

async function LoadExternalScriptAndWasm(runtime)
{
	await LoadExternalScript(runtime);
	await LoadExternalWasm(runtime);
}

async function LoadExternalScript(runtime)
{
	showMessage("Loading external script...");
	
	// Use runtime.asset.loadScripts(...urls) to dynamically load
	// scripts from the 'Files' folder, which are treated as external files.
	await runtime.assets.loadScripts("external.js");
	
	// Now external.js is loaded, its global function can be called.
	showMessage(`Script loaded, globalThis.MyExternalFunction() = "${globalThis.MyExternalFunction()}"`);
}

async function LoadExternalWasm(runtime)
{
	showMessage("Compiling WebAssembly module...");
	
	// Use runtime.assets.compileWebAssembly() to compile a
	// WebAssembly.Module from a .wasm file. This uses
	// streaming compilation where supported.
	const module = await runtime.assets.compileWebAssembly("simple.wasm");
	
	showMessage("Compiled WebAssembly module, instantiating...");
	
	// compileWebAssembly() only returns a module. To make
	// calls it must first be instantiated. The example simple.wasm
	// file uses one import (imported_func) and one export
	// (exported_func), which simply calls imported_func(42).
	// To instantiate the module the import must be specified,
	// in this case calling showMessage().
	const importObject = {
		imports: {
			imported_func: arg => showMessage(arg)
		}
	};
	const wasmInst = await WebAssembly.instantiate(module, importObject);
	
	showMessage("WebAssembly module instantiated, calling exported_func...");
	
	// Now the WebAssembly module is instantiated, its exported_func
	// can be called. This will in turn call showMessage(42), which
	// will show '42' in the Text object, indicating that the WebAssembly
	// function was called.
	wasmInst.exports.exported_func();
}