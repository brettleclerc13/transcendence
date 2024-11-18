import { useState } from "react";
import "./header.css";

export interface MenuProps {
	goToSection: (section: string) => void;
	isLoggedIn: boolean;
	userProfile?: {
		name: string;
		profilePicture: string;
		status: "Disponible" | "Invisible";
	};
}

export default function Header({goToSection, isLoggedIn, userProfile}:MenuProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [userStatus, setUserStatus] = useState(userProfile?.status || "Disponible");

	const toggleStatus = () => {
		const newStatus = userStatus === "Disponible" ? "Invisible" : "Disponible";
		setUserStatus(newStatus);
		// Appeler l'API ici pour mettre a jour le status
	};

	return (
		<header>
			<button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-button">
				&#9776; {/* Icône de menu burger */}
			</button>

			{isMenuOpen && (
				<div className="menu-container">
				<button onClick={() => goToSection('home')} className="menu-button">Home</button>
				<button onClick={() => goToSection('game')} className="menu-button">Game</button>
				<button onClick={() => goToSection('aboutUs')} className="menu-button">About Us</button>
				</div>
			)}
			<h1 className="header-title">DISCO PONG !</h1>
			<div className="action-buttons">
				{!isLoggedIn ? (
					<>
						<button onClick={() => goToSection('login')} className="login-button">					
							Login
						</button>
						<button onClick={() => goToSection('register')} className="signup-button">
							Sign Up
						</button>
					</>
				) : (
					<div className="profile-section">
						<img
							src={userProfile?.profilePicture || "./img/default.png"}
							alt="Profile"
							className="profile-picture"
						/>
						<button onClick={() => goToSection("profile")} className="login-button">
							Profile
						</button>
						<button onClick={toggleStatus} className="status-button">
							{userStatus}
						</button>
					</div>
				)}
			</div>
		</header>
	);
}
