"use client"

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ActionButtons() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isSwitchChecked, setIsSwitchChecked] = useState(true);
	const [userProfile, setUserProfile] = useState<{ name: string; profilePicture: string; status: "Disponible" | "Invisible" } | null>(null);
	const [userStatus, setUserStatus] = useState(userProfile?.status || "Online");
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

	const handleLoginSuccess = (userData: any) => {
		setIsLoggedIn(true);
		setUserProfile({
		  name: userData.name,
		  profilePicture: userData.profilePicture || "./img/default.png",
		  status: "Disponible",
		});
	};

	const handleSwitchToggle = () => {
		const newStatus = isSwitchChecked ? "Invisible" : "Online";
		setUserStatus(newStatus);
		setIsSwitchChecked((prev) => !prev);
		// Appel API pour mise à jour du statut utilisateur
	};

	return (
		<>
		{!isLoggedIn ? (
			<>
				<Link href={"?section=login"} className="login-button">					
					Login
				</Link>
				<Link href={"?section=register"} className="signup-button">
					Sign Up
				</Link>
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
						<Link className="dropdown-item" href="?section=profile">Profile</Link>
						<button className="dropdown-item logout" onClick={() => console.log("Logging Out...")}>Log Out</button>
					</div>
				) : null}
			</div>
		)}
		</>
	);
}