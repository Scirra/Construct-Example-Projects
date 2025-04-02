
// Import from just "mymodule". The import map determines which script to load for that.
import * as MyModule from "mymodule";

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Display the result of calling GetMessage() in the loaded module.
	const resultTextInst = runtime.objects.ResultText.getFirstInstance();
	resultTextInst.text = "[b]Message from module:[/b] " + MyModule.GetMessage();
}
