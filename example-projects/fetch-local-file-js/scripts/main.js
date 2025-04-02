
let textInst = null;		// LogText instance

function AddLogMessage(message)
{
	textInst.text += "\n" + message;
}

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Get the instance of LogText
	textInst = runtime.objects.LogText.getFirstInstance();
	
	AddLogMessage("Fetching myfile.txt...");
	
	// Fetch the project file 'myfile.txt' and get its contents.
	const response = await fetch("myfile.txt");
	const fetchedText = await response.text();
	
	// Display the received text!
	AddLogMessage("Text file contents: " + fetchedText);
}
