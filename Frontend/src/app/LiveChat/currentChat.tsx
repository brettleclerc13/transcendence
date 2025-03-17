import React, { useRef } from "react";

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
}

interface Message {
	sender: number;
	conversation_id: number;
	text: string;
	timestamp: string;
	senderPicture: string | null;
}

interface CurrentChatProps {
	friend: Friend;
	messages: Message[];
	currentUser: {
		id: number;
		username: string;
		email: string;
		profile_picture: string | null;
		is_online: boolean;
	};
}

const CurrentChat: React.FC<CurrentChatProps> = ({
	friend,
	messages,
	currentUser,
}) => {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const sortedMessages = [...messages].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	);

	console.log("PP current User : " ,currentUser.profile_picture);
	console.log("PP friend : ", friend.profile_picture);

	return (
		<div
			className="current-chat-container"
			style={{ overflowY: "scroll", height: "calc(100vh - 100px)" }}
		>
			<ul className="message-list">
				{sortedMessages.map((message) => {
					const isSent =
						message.sender !== undefined && message.sender === currentUser.id;
					return (
						<li
							key={`${message.conversation_id}-${
								message.timestamp
							}-${Math.random()}`}
							className={`message ${isSent ? "sent" : "received"}`}
						>
							{!isSent && (
								<img
									src={friend.profile_picture ? `${friend.profile_picture}` : "./img/default.png"}
									alt={`${friend.username}'s avatar`}
								/>
							)}
							<div className="message-bubble">{message.text}</div>
							{isSent && (
								<img
									src={currentUser.profile_picture ? `${currentUser.profile_picture}` : "./img/default.png"}
									alt={`Your avatar`}
								/>
							)}
						</li>
					);
				})}
			</ul>
			<div ref={messagesEndRef} />
		</div>
	);
};

export default CurrentChat;
