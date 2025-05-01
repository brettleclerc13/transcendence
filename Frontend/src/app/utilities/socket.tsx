interface Friend {
  username: string;
  id: number;
  profile_picture?: string;
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
}

let friendListSocket: WebSocket | null = null;

export const createFriendListSocket = (onUpdate: (data: Friend[]) => void, onClose?: () => void): WebSocket => {
	const wsUrl = `wss://127.0.0.1:8000/ws/friends/`;
	const socket = new WebSocket(wsUrl);

	socket.onmessage = (event) => {
		const updatedList = JSON.parse(event.data);
		onUpdate(updatedList);
	};

	socket.onclose = () => {
		console.log("WebSocket amis fermé");
		if (onClose) onClose();
	};

	return socket;
};


export const connectFriendListSocket = (onMessage: (data: Friend[]) => void) => {
    const wsUrl = `wss://127.0.0.1:8000/ws/friends/`;

    if (friendListSocket) {
        friendListSocket.close();
    }

    friendListSocket = new WebSocket(wsUrl);

    friendListSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    friendListSocket.onclose = () => {
        console.log("WebSocket amis fermé, tentative de reconnexion...");
        setTimeout(() => connectFriendListSocket(onMessage), 5000);
    };
};

export const closeFriendListSocket = () => {
    if (friendListSocket) {
        friendListSocket.close();
        friendListSocket = null;
    }
};

export const createChatSocket = (conversationId: number | null, onMessage: (message: ChatMessage) => void, onClose?: () => void): WebSocket => {
	const wsUrl = `wss://127.0.0.1:8000/ws/chat/${conversationId}/`;
	const socket = new WebSocket(wsUrl);

	socket.onmessage = (event) => {
		const newMessage = JSON.parse(event.data);
		onMessage(newMessage);
	};

	socket.onclose = () => {
		console.log("WebSocket chat fermé");
		if (onClose) onClose();
	};

	return socket;
};
