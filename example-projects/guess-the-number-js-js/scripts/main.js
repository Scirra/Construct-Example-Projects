
// The number for the player to guess - a random number from 0-100.
const theNumber = Math.floor(Math.random() * 100);

// Instances of TextInput and ResultText
let textInputInst = null;
let resultTextInst = null;

// Add handlers to get "beforeprojectstart" event
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Now the runtime is ready, get the TextInput and ResultText instances
	textInputInst = runtime.objects.TextInput.getFirstInstance();
	resultTextInst = runtime.objects.ResultText.getFirstInstance();
}

// Export functions to get the number, the guessed number, and show a message.
export function getTheNumber()
{
	return theNumber;
}

export function getEnteredNumber()
{
	return Number(textInputInst.text);	// convert text to number
}

export function showResultMessage(message)
{
	resultTextInst.text = message;
}