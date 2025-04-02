
// Import the class MyClass exported from the script file myClass.js.
// Learn more about imports here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
import { MyClass } from "./myClass.js";

// Get to the beforeprojectstart event.
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Create a new instance of MyClass
	const myClass = new MyClass();
	
	// Add its message to the Text object.
	const textInst = runtime.objects.Text.getFirstInstance()!;
	textInst.text += myClass.GetMessage();
}
