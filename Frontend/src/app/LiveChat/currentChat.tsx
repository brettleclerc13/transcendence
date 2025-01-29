import React, { useEffect, useRef } from 'react';

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
}

interface Message {
	id: number;
	senderId: number;
	text: string;
	timestamp: string;
	senderPicture: string | null;
}

interface CurrentChatProps {
	friend: Friend;
	messages: Message[];
}

const CurrentChat: React.FC<CurrentChatProps> = ({ friend, messages }) => {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

	return (
		<div className="current-chat-container" style={{ overflowY: 'scroll', height: 'calc(100vh - 100px)' }}>
			<ul className="message-list">
				{messages.map((message) => (
					<li
						key={message.id}
						className={`message ${message.senderId === friend.id ? 'received' : 'sent'}`}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: message.senderId === friend.id ? 'flex-start' : 'flex-end',
							marginBottom: 10,
						}}
					>
						{message.senderId === friend.id && (
							<img
								src={friend.profile_picture || "./img/default.png"}
								alt={`${friend.username}'s avatar`}
								style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }}
							/>
						)}
						<div
							className="message-bubble"
							style={{
								maxWidth: '60%',
								padding: 10,
								borderRadius: 10,
								backgroundColor: message.senderId === friend.id ? '#f1f0f0' : '#0078ff',
								color: message.senderId === friend.id ? '#000' : '#fff',
							}}
						>
							{message.text}
						</div>
						{message.senderId !== friend.id && (
							<img
								src={message.senderPicture || "./img/default.png"}
								alt="Your avatar"
								style={{ width: 40, height: 40, borderRadius: '50%', marginLeft: 10 }}
							/>
						)}
					</li>
				))}
			</ul>
			<div ref={messagesEndRef}/>
		</div>
	);
};

export default CurrentChat;
