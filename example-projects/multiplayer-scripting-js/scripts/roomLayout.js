
import Globals from "./globals.js";
import { MultiEventHandler } from "./multiEventHandler.js";

// The RoomLayoutManager class is created for the Room layout.
export class RoomLayoutManager
{
	constructor(runtime)
	{
		this.runtime = runtime;
		
		// Get the various objects and instances used by this layout.
		this.multiplayer =       runtime.objects.Multiplayer;
		this.signallingStatus =  runtime.objects.SignallingStatus.getFirstInstance();
		this.peerList =          runtime.objects.PeerList.getFirstInstance();
		this.receivedMessage =   runtime.objects.ReceivedMessage.getFirstInstance();
		
		this.messageTextInput =  runtime.objects.MessageText.getFirstInstance();
		const sendTextButton =   runtime.objects.SendText.getFirstInstance();
		const sendBinaryButton = runtime.objects.SendBinary.getFirstInstance();
		const leaveButton =      runtime.objects.LeaveButton.getFirstInstance();
		
		// Start connecting to the signalling server.
		// This method is async, but it isn't awaited - it will just kick off
		// the process of connecting and joining a room.
		this.ConnectToSignalling();
		
		// Events to listen for on this layout. These include various multiplayer
		// events like peers connecting and disconnecting, and various form control
		// inputs for sending data.
		this.eventHandlers = new MultiEventHandler([
			[this.multiplayer,		"peerconnect",		e => this.OnPeerConnect(e)],
			[this.multiplayer,		"peerdisconnect",	e => this.OnPeerDisconnect(e)],
			[this.multiplayer,		"message",			e => this.OnMessage(e)],
			[sendTextButton,		"click",			() => this.OnClickSendText()],
			[runtime,				"keydown",			e => this.OnKeyDown(e)],
			[sendBinaryButton,		"click",			() => this.OnClickSendBinary()],
			[leaveButton,			"click",			() => this.OnClickLeave()]
		]);
	}
	
	Release()
	{
		this.eventHandlers.Release();
	}
	
	// Called when the layout starts to begin the process of joining a room.
	async ConnectToSignalling()
	{
		try {
			// Use a shorthand reference to the multiplayer signalling interface.
			const signalling = this.multiplayer.signalling;

			// Connect to the signalling server, if not already connected.
			// (If the user leaves then rejoins a room, signalling remains connected.)
			if (!signalling.isConnected)
			{
				this.SetSignallingStatus("Connecting...");

				await signalling.connect();
			}

			// Log in to the signalling server, if not already logged in.
			// (If the user leaves then rejoins a room, they remain logged in.)
			if (!signalling.isLoggedIn)
			{
				this.SetSignallingStatus("Logging in...");

				await signalling.login(Globals.alias);
			}

			// Join the room name the user entered.
			this.SetSignallingStatus("Joining room...");

			await signalling.joinRoom("MultiplayerScripting", "v1", Globals.room);

			// Once joined, display whether the user is host or peer.
			if (this.multiplayer.isHost)
				this.SetSignallingStatus("Joined room as [b]host[/b]");
			else
				this.SetSignallingStatus("Joined room as [b]peer[/b]");
			
			// Update the list of peers in the room.
			this.UpdatePeerList();
		}
		catch (err)
		{
			// If any error happens in the above, just show an error status,
			// but log the actual error to the browser console.
			this.SetSignallingStatus("Error");
			console.error("Signalling error: ", err);
		}
	}
	
	// Display the signalling status in a Text object.
	SetSignallingStatus(str)
	{
		this.signallingStatus.text = "Signalling status: " + str;
	}
	
	// When peers connect or disconnect, update the list of peers.
	OnPeerConnect(e)
	{
		this.UpdatePeerList();
	}
	
	OnPeerDisconnect(e)
	{
		this.UpdatePeerList();
	}
	
	// Display a list of peers in the room. This is done only with a Text object,
	// with each peer separated by newlines.
	UpdatePeerList()
	{
		// Build up a string to display.
		let str = "Peer list:";
		
		for (const peer of this.multiplayer.getAllPeers())
		{
			str += "\n";
			
			// Display the host in bold, and the local peer in italics
			// (and both if the local peer is also the host).
			if (peer.isHost)
				str += "[b]";
			if (peer.isMe)
				str += "[i]";
			
			str += peer.alias;
			
			if (peer.isHost)
				str += " (host)[/b]";
			if (peer.isMe)
				str += "[/i]";
		}
		
		// Set the text object text to the string with the peer list.
		this.peerList.text = str;
	}
	
	// Called when a message is received over the network from any peer.
	OnMessage(e)
	{
		let str = "";		// string message to display
		
		if (typeof e.message === "string")
		{
			// If a string message was received, display the content of the string.
			str = `String message received from ${e.fromAlias}: ${e.message}`;
		}
		else
		{
			// If a binary message was received, list it as a sequence of byte values
			// (just for demonstration that the message was received).
			str = `Binary message received from ${e.fromAlias}: `;
			
			// Use a DataView to read each byte (uint8) in the binary message.
			const dataView = new DataView(e.message);
			for (let i = 0, len = dataView.byteLength; i < len; ++i)
			{
				str += dataView.getUint8(i) + " ";
			}
		}
		
		// Display the resulting string in a Text object.
		this.receivedMessage.text = str;
	}
	
	// Send some entered text over the network.
	OnClickSendText()
	{
		this.Send(this.messageTextInput.text);
		
		this.messageTextInput.text = "";
		this.messageTextInput.focus();
	}
	
	// Handle pressing enter the same as clicking the "Send text" button.
	OnKeyDown(e)
	{
		if (e.key === "Enter")
			this.OnClickSendText();
	}
	
	// Send some binary data over the network.
	// The user does not choose this data - for demonstration purposes it just
	// sends 4 bytes with the values 4, 3, 2, 1.
	OnClickSendBinary()
	{
		// Create a 4-byte ArrayBuffer, and write to it with a DataView.
		const arrayBuffer = new ArrayBuffer(4);
		const dataView = new DataView(arrayBuffer);
		
		for (let i = 0, len = dataView.byteLength; i < len; ++i)
		{
			// Set the binary content to a sequence of bytes with values 4, 3, 2, 1.
			dataView.setUint8(i, 4 - i);
		}
		
		this.Send(arrayBuffer);
	}
	
	// Send a message over the network, which can be either a string or
	// binary data (an ArrayBuffer).
	Send(content)
	{
		// The host broadcasts the message to all peers, but other peers only send
		// the message to the host. This matches the way connections work for
		// demonstration purposes.
		if (this.multiplayer.isHost)
		{
			this.multiplayer.hostBroadcastMessage(null, content);
		}
		else
		{
			this.multiplayer.sendPeerMessage(this.multiplayer.hostId, content);
		}
	}
	
	// When clicking the "Leave" button, disconnect from all peers and leave the
	// room on the signalling server, and go back to the Title layout.
	// Note this leaves the user connected and logged in to the signalling server.
	OnClickLeave()
	{
		this.multiplayer.disconnectRoom();
		
		this.runtime.goToLayout("Title");
	}
}