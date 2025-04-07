import React, { useState } from "react";
import ProfileButton from "./profileButton";
import InviteToGameButton from "./inviteToGameButton";
import Popup from "@/components/popup/popup";
import PublicProfile from "./publicProfile";

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
}

interface MessageBarProps {
	onSendMessage: (text: string) => void;
	onInviteClick: () => void;
	selectedFriend: Friend | null;
}

const MessageBar: React.FC<MessageBarProps> = ({
	onSendMessage,
	onInviteClick,
	selectedFriend,
}) => {
	const [message, setMessage] = useState("");
	const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
	const [inviteButtonDisabled, setInviteButtonDisabled] = useState(false);

	const handleSend = () => {
		if (message.trim() !== "") {
			onSendMessage(message);
			setMessage("");
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSend();
		}
	};

	const handleInviteClick = () => {
		setInviteButtonDisabled(true);
		onInviteClick();
	};

	return (
		<>
			<div
				className="message-bar"
				style={{
					display: "flex",
					alignItems: "center",
					padding: "10px",
					borderTop: "1px solid #ccc",
				}}
			>
				<input
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type a message..."
					style={{
						flex: 1,
						padding: 10,
						borderRadius: 20,
						border: "1px solid #ccc",
						marginRight: 10,
					}}
				/>
				<button
					onClick={handleSend}
					style={{
						padding: "0 20px",
						borderRadius: 20,
						background: "#0078ff",
						color: "#fff",
					}}
				>
					Send
				</button>
				<div style={{ display: "flex", alignItems: "center" }}>
					<ProfileButton
						onClick={() => {
							setIsProfileOpen(true);
						}}
					/>
					<InviteToGameButton
						onClick={handleInviteClick}
						disabled={inviteButtonDisabled}
					/>
				</div>
			</div>
			<Popup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
				<PublicProfile username={selectedFriend?.username} />
			</Popup>
		</>
	);
};

export default MessageBar;
