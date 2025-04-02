
// Hi-score global variable
let hiScore = 0;

// Text instance for displaying messages, and a helper function
// to add a line of text to it.
let textInst: InstanceType.StatusText

function AddMessage(str: string)
{
	textInst.text += "\n" + str;
}

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime: IRuntime)
{
	// Get the Text object instance, and load the last hiscore.
	textInst = runtime.objects.StatusText.getFirstInstance()!;
	
	LoadHiScore(runtime);
}

async function LoadHiScore(runtime: IRuntime)
{
	// Read the last saved hi-score from storage.
	// If no hi-score was saved (which happens on the first run),
	// getItem() will resolve with null.
	const savedHiScore = await runtime.storage.getItem("hiscore");
	if (savedHiScore === null)
	{
		AddMessage("First run, no high score");
	}
	else
	{
		// TypeScript note: the return type of getItem() could potentially
		// be anything; in this case assume it is a number and use the 'as'
		// keyword to tell TypeScript that and avoid an error.
		hiScore = savedHiScore as number;
		AddMessage("Existing high score: " + savedHiScore);
	}
}

export async function SaveHiScore(runtime: IRuntime, score: number)
{
	if (score > hiScore)
	{
		// New score is higher: save it to storage
		AddMessage("New high score: " + score);
		hiScore = score;
		await runtime.storage.setItem("hiscore", score);
	}
	else
	{
		// New score is not higher: display message
		// and don't update anything.
		AddMessage(`The entered score ${score} does not beat the current high score ${hiScore}`);
	}
}

export async function ResetHiScore(runtime: IRuntime)
{
	// Remove the storage key and re-set the hiscore global variable.
	hiScore = 0;
	await runtime.storage.removeItem("hiscore");
	AddMessage("Key removed, no score saved");
}
