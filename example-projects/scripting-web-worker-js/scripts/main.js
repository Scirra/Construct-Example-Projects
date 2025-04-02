
let textInst = null;		// instance of the LogText object
let worker = null;			// Web Worker that this example creates

// For creating a promise that resolves when the worker is ready
let workerReadyResolve = null;
let workerReadyPromise = new Promise(resolve => workerReadyResolve = resolve);

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
	// Get the text instance for displaying messages.
	textInst = runtime.objects.LogText.getFirstInstance();
	
	AddLogMessage("Creating Web Worker...");
	
	// Create the Web Worker.
	// See: https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker
	worker = new Worker("myworker.js");
	
	// Add a function to be called when receiving messages back from the worker.
	worker.addEventListener("message", OnMessageFromWorker);
	
	// Send a message to the worker telling it to start up.
	worker.postMessage({
		"type": "start"
	});
	
	// When the worker sends back a ready message, it resolves the ready promise.
	// This means we can await the promise here to wait for the worker to be ready.
	// This also ensures the worker is ready before the project starts running.
	await workerReadyPromise;
	
	AddLogMessage("Web worker ready, sending work...");
	
	// Now send off some work to do.
	// In this example the worker just adds two numbers, but in practice it would
	// do something considerably more computationally intensive.
	// When it's done, the result will come back to OnMessageFromWorker().
	worker.postMessage({
		"type": "add",
		"firstNumber": 37,
		"secondNumber": 5
	});
}

function OnMessageFromWorker(e)
{
	const data = e.data;
	const type = data["type"];
	
	switch (type) {
	case "ready":
		// Resolve the promise workerReadyPromise
		workerReadyResolve();
		workerReadyResolve = null;
		break;
	case "addResult":
		// Got a result from sending work to add two numbers.
		AddLogMessage("Got result back from worker: " + data["result"]);
		break;
	default:
		console.warn(`Unknown message type '${type}'`);
		break;
	}
}