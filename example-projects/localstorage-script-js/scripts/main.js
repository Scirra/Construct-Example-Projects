
// Hi-score global variable
let hiScore = 0;

// Text instance for displaying messages, and a helper function
// to add a line of text to it.
let textInst = null;

function AddMessage(str)
{
	textInst.text += "\n" + str;
}

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime)
{
	// Get the Text object instance, and load the last hiscore.
	textInst = runtime.objects.StatusText.getFirstInstance();
	
	LoadHiScore(runtime);
}

async function LoadHiScore(runtime)
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
		hiScore = savedHiScore;
		AddMessage("Existing high score: " + savedHiScore);
	}
}

export async function SaveHiScore(runtime, score)
{
	if (score > hiScore)
	{
		// New score is higher: save it to storage
		AddMessage("New high score: " + score);
		hiScore = score;

		// Note that setItem() can reject, e.g. if the user ran out of storage space.
		// Use a try-catch block to handle any error, log it to the console, and show an error message.
		try {
			await runtime.storage.setItem("hiscore", score);
		}
		catch (err)
		{
			console.error("Error writing to storage: ", err);
			AddMessage(`Error writing to storage`);
		}
	}
	else
	{
		// New score is not higher: display message
		// and don't update anything.
		AddMessage(`The entered score ${score} does not beat the current high score ${hiScore}`);
	}
}

export async function ResetHiScore(runtime)
{
	// Remove the storage key and re-set the hiscore global variable.
	hiScore = 0;
	await runtime.storage.removeItem("hiscore");
	AddMessage("Key removed, no score saved");
}
