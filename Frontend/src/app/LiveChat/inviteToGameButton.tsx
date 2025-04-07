import React from "react";

interface InviteToGameButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

const InviteToGameButton: React.FC<InviteToGameButtonProps> = ({
	onClick,
	disabled,
}) => {
	return (
		<button
			className="invite-to-game-button"
			onClick={onClick}
			disabled={disabled}
			style={{
				backgroundColor: "#28a745",
				color: "#fff",
				border: "none",
				borderRadius: 5,
				padding: "10px 15px",
				cursor: "pointer",
			}}
		>
			Challenge to Pong !
		</button>
	);
};

export default InviteToGameButton;
