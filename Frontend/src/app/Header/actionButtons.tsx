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
						className="profile-picture-header"
					/>
				</button>

				{isDropdownOpen ? (
					<div className="dropdown-menu" ref={dropdownRef}>
						<Link className="dropdown-item" href="?section=profile">
							<svg className="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
								<path fillRule="evenodd" d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z" clipRule="evenodd"/>
							</svg> Profile
						</Link>
						<button className="dropdown-item logout" onClick={() => console.log("Logging Out...")}>
							<svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
							</svg> Log Out
						</button>
					</div>
				) : null}
			</div>
		)}
		</>
	);
}