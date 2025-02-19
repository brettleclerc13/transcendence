import React from "react";

interface ProfileButtonProps {
	onClick: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
	return (
		<button
			className="profile-public-button"
			onClick={onClick}
			style={{
				backgroundColor: "#0078ff",
				color: "#fff",
				border: "none",
				borderRadius: 5,
				padding: "10px 15px",
				cursor: "pointer",
				marginRight: 10,
			}}
		>
			Profile
		</button>
	);
};

export default ProfileButton;
