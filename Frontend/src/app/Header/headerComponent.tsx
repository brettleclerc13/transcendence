import { useEffect, useRef, useState } from "react";
import "./headerComponent.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export interface MenuProps {
	goToSection: (section: string) => void;
	isLoggedIn: boolean;
	userProfile?: {
		name: string;
		profilePicture: string;
		status: "Online" | "Invisible";
	};
}

export default function HeaderComponent({goToSection, isLoggedIn, userProfile}:MenuProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [userStatus, setUserStatus] = useState(userProfile?.status || "Online");
	const [isSwitchChecked, setIsSwitchChecked] = useState(true);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
		  if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
			setTimeout(() =>setIsDropdownOpen(false), 100);
		  }
		};
	
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
		  document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const toggleDropdown = () => {
		console.log("Dropdown toggled");
		setIsDropdownOpen((prev) => !prev);
	}

	const handleSwitchToggle = () => {
		const newStatus = isSwitchChecked ? "Invisible" : "Online";
		setUserStatus(newStatus);
		setIsSwitchChecked((prev) => !prev);
		// Appel API pour mise à jour du statut utilisateur
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
						<div className="form-check form-switch">
  							<input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckChecked" checked={isSwitchChecked} onChange={handleSwitchToggle}/>
  							<label className="form-check-label" htmlFor="flexSwitchCheckChecked">{userStatus}</label>
						</div>
						<label className="logged-name">{userProfile?.name || "User"}</label>
						<button className="profile-button" onClick={toggleDropdown}>
							<img
								src={userProfile?.profilePicture || "./img/default.png"}
								alt="Profile"
								className="profile-picture"
							/>
						</button>

						{isDropdownOpen ? (
							<div className="dropdown-menu" ref={dropdownRef}>
								<button className="dropdown-item" onClick={() => goToSection("profile")}>Profile</button>
								<button className="dropdown-item logout" onClick={() => console.log("Logging Out...")}>Log Out</button>
							</div>
						) : null}
					</div>
				)}
			</div>
		</header>
	);
}
