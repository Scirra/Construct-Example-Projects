
// Log to the console to show the web worker is running
console.log("Web worker running!");

self.addEventListener("message", e =>
{
	// Use the type property of the message to work out what to do with it.
	const data = e.data;
	const messageType = data["type"];
	
	switch (messageType) {
	case "start":
		Start();
		break;
	case "add":
		AddNumbers(data);
		break;
	default:
		console.warn(`Unknown message type '${messageType}'`);
		break;
	}
});

async function Start()
{
	console.log("Web worker Start() method");
	
	// Do any initialisation for the worker here.
	// In this case we don't need to do anything, so just
	// post back a message saying the worker is now ready.
	self.postMessage({
		"type": "ready"
	});
}

// Example work for a worker to do. This just adds two numbers
// and sends the result back. In practice it would do something
// considerably more computationally intensive.
async function AddNumbers(data: any)
{
	console.log("Web worker AddNumbers() method");
	
	// TypeScript note: as the message has 'any' type, in general
	// it's good practice to use 'as' to get specific types from
	// the message so remaining code is still typed.
	const firstNumber = data["firstNumber"] as number;
	const secondNumber = data["secondNumber"] as number;
	const result = firstNumber + secondNumber;
	
	self.postMessage({
		"type": "addResult",
		"result": result
	});
}