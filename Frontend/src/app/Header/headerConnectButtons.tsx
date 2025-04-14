"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { isUserLoggedIn } from "@/app/utilities/userClientActions";
import {
	fetchUserProfile,
	updateUserProfile,
	UserProfileData,
} from "@/app/utilities/profileActions";
import { backendLogout } from "@/app/utilities/userActions";
import Popup from "@/components/popup/popup";
import Profile from "../Profile/profile";
import "./headerComponent.css";
import { useRouter } from "next/navigation";
import { refreshAccessToken } from "../utilities/JWTActions";

export default function HeaderConnectButtons() {
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const run = async () => {
		try {
			const tokenStatus = await refreshAccessToken();
			if (!tokenStatus?.ok) {
				window.location.reload();
			}
			const profileResults = await fetchUserProfile();

			setUserProfile(profileResults);
		} catch (err) {
			console.warn("Error fetching user profile:", err);
		}
	};

	useEffect(() => {
		if (isUserLoggedIn()) {
			run();
		}
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setTimeout(() => setIsDropdownOpen(false), 100);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const toggleDropdown = () => {
		setIsDropdownOpen((prev) => !prev);
	};

	const handleSwitchToggle = async () => {
		if (!userProfile) {
			console.warn("User profile does not exist");
			return;
		}

		const newStatus = !userProfile.is_online;

		try {
			await updateUserProfile({ is_online: newStatus });

			setUserProfile({ ...userProfile, is_online: newStatus });
		} catch (error) {
			console.warn("Error updating status:", error);
		}
	};

	const handleLogout = async () => {
		try {
			await updateUserProfile({ is_online: false });
		} catch (error) {
			console.warn("Error updating status:", error);
		}
		const logoutStatus = await backendLogout();
		if (logoutStatus) router.push("/");
		else console.warn("Error logging out backend side");
	};

	const handleProfileClick = () => {
		setIsProfileOpen(true);
		setTimeout(() => setIsDropdownOpen(false), 100);
	};

	return (
		<div className="action-buttons">
			{!isUserLoggedIn() ? (
				<>
					<Link href={"/login"} className="login-button">
						Login
					</Link>
					<Link href={"/register"} className="signup-button">
						Sign Up
					</Link>
				</>
			) : (
				<div className="profile-section">
					<div className="form-check form-switch">
						<input
							className="form-check-input"
							type="checkbox"
							role="switch"
							id="flexSwitchCheckChecked"
							data-bs-toggle="switch"
							checked={userProfile?.is_online ?? false}
							onChange={handleSwitchToggle}
						/>
						<label
							className="form-check-label"
							htmlFor="flexSwitchCheckChecked"
						>
							{userProfile?.is_online ? "Online" : "Invisible"}
						</label>
					</div>
					<label className="logged-name">{userProfile?.username}</label>
					<button className="profile-button" onClick={toggleDropdown}>
						<img
							src={
								userProfile?.profile_picture
									? `/api/${userProfile.profile_picture}`
									: "/img/default.png"
							}
							alt="Profile Image in navbar"
							className="profile-picture-header"
						/>
					</button>

					{isDropdownOpen ? (
						<div className="dropdown-menu" ref={dropdownRef}>
							<button className="dropdown-item" onClick={handleProfileClick}>
								<svg
									className="icon"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										fillRule="evenodd"
										d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
										clipRule="evenodd"
									/>
								</svg>{" "}
								Profile
							</button>
							<button className="dropdown-item logout" onClick={handleLogout}>
								<svg
									className="icon"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
									/>
								</svg>{" "}
								Log Out
							</button>
						</div>
					) : null}
					<Popup isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
						<Profile
							userProfile={userProfile}
							setUserProfile={setUserProfile}
							setIsProfileOpen={setIsProfileOpen}
						/>
					</Popup>
				</div>
			)}
		</div>
	);
}
