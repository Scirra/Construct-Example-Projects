
////////////////////////////////////////////////////////////////////////
// MARK: Declarations

// Construct object instances
let statusTextInst: InstanceType.StatusText;
let joinButtonInst: InstanceType.JoinButton;
let peerListInst: InstanceType.PeerList;
let sendButtonInst: InstanceType.SendFileButton;
let progressBarInst: InstanceType.ProgressBar;
let dataRateTextInst: InstanceType.DataRateText;
let downloadButtonInst: InstanceType.Download;
let cancelButtonInst: InstanceType.CancelButton;

// Other variables
let myName = "";
let roomName = "";

// AbortController for cancelling an in-progress transfer
let abortController: AbortController | null = null;

// A File of a completed received binary transfer
let receivedFile: File | null = null;

// MARK: Startup
runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime : IRuntime)
{
	// Get Construct object instances and attach event listeners
	statusTextInst = runtime.objects.StatusText.getFirstInstance()!;
	progressBarInst = runtime.objects.ProgressBar.getFirstInstance()!;
	dataRateTextInst = runtime.objects.DataRateText.getFirstInstance()!;
	peerListInst = runtime.objects.PeerList.getFirstInstance()!;

	joinButtonInst = runtime.objects.JoinButton.getFirstInstance()!;
	joinButtonInst.addEventListener("click", () => OnJoinButtonClicked(runtime));

	sendButtonInst = runtime.objects.SendFileButton.getFirstInstance()!;
	sendButtonInst.addEventListener("click", () => OnSendFile(runtime));

	cancelButtonInst = runtime.objects.CancelButton.getFirstInstance()!;
	cancelButtonInst.addEventListener("click", () => OnCancelTransfer(runtime));

	downloadButtonInst = runtime.objects.Download.getFirstInstance()!;
	downloadButtonInst.addEventListener("click", () => OnDownload(runtime));

	runtime.addEventListener("tick", () => OnTick(runtime));
}

function OnTick(runtime: IRuntime)
{
	// Every tick, update the data rate text object with the current inbound
	// and outbound bandwidth, so users can see the data rate for larger transfers.
	const mpStats = runtime.objects.Multiplayer.stats;
	dataRateTextInst.text = `${Math.round(mpStats.inboundBandwidth / 102.4) / 10} KB/s in, ${Math.round(mpStats.outboundBandwidth / 102.4) / 10} KB/s out`;
}

// Helper function to set the status text content.
// Also logs the status to the console so the history of status changes can be seen there.
function SetStatus(text: string)
{
	statusTextInst.text = text;
	console.log(text);
}

////////////////////////////////////////////////////////////////////////
// MARK: Connect
function OnJoinButtonClicked(runtime: IRuntime)
{
	// Save the entered user name and room name
	const userNameInputInst = runtime.objects.UserNameInput.getFirstInstance()!;
	myName = userNameInputInst.text;

	const roomNameInputInst = runtime.objects.RoomNameInput.getFirstInstance()!;
	roomName = roomNameInputInst.text;

	// Don't allow joining with either name empty
	if (!myName || !roomName)
	{
		SetStatus("Enter a valid name and room");
		return;
	}

	// Connect to the signalling server to join the specified room
	ConnectToSignalling(runtime);
}

async function ConnectToSignalling(runtime: IRuntime)
{
	// Add event listeners for the Multiplayer object
	const mp = runtime.objects.Multiplayer;
	mp.addEventListener("peerconnect", e => OnPeerConnect(runtime, e));
	mp.addEventListener("peerdisconnect", e => OnPeerDisconnect(runtime, e));
	mp.addEventListener("binarytransferstart", e => OnBinaryTransferStart(runtime, e));
	mp.addEventListener("binarytransferprogress", e => OnBinaryTransferProgress(runtime, e));
	mp.addEventListener("binarytransfercancelled", e => OnBinaryTransferCancelled(runtime, e));
	mp.addEventListener("binarytransfercomplete", e => OnBinaryTransferComplete(runtime, e));

	// Connect to signalling, log in and join the room
	try {
		SetStatus("Connecting...");
		await mp.signalling.connect();

		SetStatus("Logging in...");
		await mp.signalling.login(myName);
		
		SetStatus("Joining room...");
		const joinResult = await mp.signalling.joinRoom("construct-binary-transfer-example", "coding-example", roomName);

		SetStatus("Joined room as " + (joinResult.isHost ? "host" : "peer"));
		sendButtonInst.isEnabled = true;

		UpdatePeerList(runtime);
	}
	catch (err)
	{
		console.error("Error: ", err);
		SetStatus("Error connecting to signalling/joining room");
	}
}

////////////////////////////////////////////////////////////////////////
// MARK: Peer events

// When a peer connects or disconnects, show it in the status, and
// update the list object showing all the peers.
function OnPeerConnect(runtime: IRuntime, e: MultiplayerPeerEvent)
{
	SetStatus(`Peer '${e.peerId}' connected`);

	UpdatePeerList(runtime);
}

function OnPeerDisconnect(runtime: IRuntime, e: MultiplayerPeerEvent)
{
	SetStatus(`Peer '${e.peerId}' disconnected`);

	UpdatePeerList(runtime);
}

function UpdatePeerList(runtime: IRuntime)
{
	// Save the last selected index to preserve it after clearing and
	// re-adding all items.
	let lastSelectedIndex = peerListInst.selectedIndex;

	// Clear the list and add an item for every active peer.
	peerListInst.clear();

	for (const peer of runtime.objects.Multiplayer.getAllPeers())
	{
		// Append "(Me)" for the local peer and "(Host)" for the host peer.
		let entryName = peer.alias;
		if (peer.isMe)
			entryName += " (Me)";
		if (peer.isHost)
			entryName += " (Host)";
		
		peerListInst.addItem(entryName)
	}

	// If nothing was selected before, select the first item.
	if (lastSelectedIndex < 0)
		lastSelectedIndex = 0;
	
	// Restore previously selected item index
	peerListInst.selectedIndex = lastSelectedIndex;
}

////////////////////////////////////////////////////////////////////////
// MARK: Send
async function OnSendFile(runtime: IRuntime)
{
	const mp = runtime.objects.Multiplayer;

	// Find peer to send to, using the selected index in the peer list.
	const peer = mp.getAllPeers()[peerListInst.selectedIndex];
	if (!peer)
	{
		SetStatus("Select a peer to send the file to");
		return;
	}

	// Don't let the user attempt to send a file to themselves.
	if (peer.isMe)
	{
		SetStatus("Cannot send file to self");
		return;
	}
	
	// Get the picked file from the File Chooser object. If there is none,
	// show a message and don't attempt to send anything.
	const fileChooserInst = runtime.objects.FileChooser.getFirstInstance()!;
	const sendData = fileChooserInst.getFiles()[0];
	if (!sendData)
	{
		SetStatus("Choose a file to send");
		return;
	}
	
	// Create an AbortController which is used to cancel the transfer.
	// Enable the cancel button as the transfer is starting.
	abortController = new AbortController();
	cancelButtonInst.isEnabled = true;
	
	SetStatus(`Started sending file '${sendData.name}' (${Math.round(sendData.size / 1024)} KB)`);

	try {
		// Transfer the file to the selected peer.
		await mp.transferPeerBinary(peer.id, sendData, {
			signal: abortController.signal
		});
	}
	catch (err)
	{
		console.error("Error sending file: ", err);
		SetStatus("Error sending file");
	}
}

function OnCancelTransfer(runtime: IRuntime)
{
	// When the 'Cancel' button is clicked, call abort() on the AbortController
	// whose signal was passed to transferPeerBinary() to cancel the transfer.
	if (!abortController)
		return;
	
	abortController.abort();
	abortController = null;
	cancelButtonInst.isEnabled = false;
}

// Fired on the receiver side when a binary transfer begins. Display the
// incoming transfer in the status.
function OnBinaryTransferStart(runtime: IRuntime, e: MultiplayerBinaryTransferStartEvent)
{
	SetStatus(`Started receiving file '${e.fileName}' (${Math.round(e.size / 1024)} KB) from '${e.peerAlias}'`);
}

//////////////////////////////////////////////////////////////////////
// MARK: Progress/completion
function OnBinaryTransferProgress(runtime: IRuntime, e: MultiplayerBinaryTransferProgressEvent)
{
	// Display the transfer progress in the Progress Bar object. This applies to both
	// the sender and the receiver.
	progressBarInst.progress = e.progress * 100;
}

function OnBinaryTransferCancelled(runtime: IRuntime, e: MultiplayerBinaryTransferEvent)
{
	// Show that the transfer was cancelled
	SetStatus("Transfer cancelled");

	progressBarInst.progress = 0;
}

function OnBinaryTransferComplete(runtime: IRuntime, e: MultiplayerBinaryTransferCompleteEvent)
{
	// Show that the transfer completed
	SetStatus("File transfer completed");
	progressBarInst.progress = 0;

	// The data is only set for the receiver (the sender fires this event with null
	// for the data). On the receiver side, save the received File.
	if (e.data)
	{
		receivedFile = e.data as File;
		downloadButtonInst.isEnabled = true;
	}
}

// Download the received File using the runtime invokeDownload helper method.
// This needs a URL, so use URL.createObjectURL() to create a URL to the received File.
function OnDownload(runtime: IRuntime)
{
	runtime.invokeDownload(URL.createObjectURL(receivedFile!), receivedFile!.name);
}