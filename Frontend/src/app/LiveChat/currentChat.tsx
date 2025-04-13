import React, { useRef } from "react";
import "./liveChat.css";
import type { UserProfileData } from "../utilities/profileActions";

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
	currentUser: UserProfileData;
}

const CurrentChat: React.FC<CurrentChatProps> = ({
	friend,
	messages,
	currentUser,
}) => {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const sortedMessages = [...messages].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

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
									src={
										friend.profile_picture
											? `/api/${friend.profile_picture}`
											: "/img/default.png"
									}
									alt={`${friend.username}'s avatar`}
								/>
							)}
							<div className="message-bubble">{message.text}</div>
							{isSent && (
								<img
									src={
										currentUser.profile_picture
											? `/api/${currentUser.profile_picture}`
											: "/img/default.png"
									}
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
