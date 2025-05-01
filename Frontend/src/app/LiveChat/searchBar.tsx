"use client";

import React, { useState, useEffect } from "react";
import { SearchFriend, SendFriendRequest } from "../utilities/chatActions"; 

type UserResult = {
	username: string;
};

const SearchBar = () => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<UserResult[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [invitationSent, setInvitationSent] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const searchValue = event.target.value;
		setQuery(searchValue);

		if (searchValue.trim().length > 0) {
			const response = await SearchFriend(searchValue);
			if (response.status === true && response.data) {
				setResults(response.data.slice(0, 3));
				setShowDropdown(true);
			} else {
				setResults([]);
				setShowDropdown(false);
			}
		} else {
			setResults([]);
			setShowDropdown(false);
		}
	};

	const handleInviteClick = async (username: string) => {
		setLoading(true);
		setShowDropdown(false);
	
		try {
			const response = await SendFriendRequest(username);
	
			if (response.status === true) {
				setInvitationSent(true);
				setMessage("Friend request sent!");
				setTimeout(() => setInvitationSent(false), 3000);
			} else if (response.status === "warning") {
				setMessage(response.message);
			} else if (response.status === false) {
				setMessage(response.error || "Failed to send friend request.");
			} else {
				setMessage("An unexpected response format was received.");
			}
		} catch (error) {
			console.warn("Error sending friend request:", error);
			setMessage("An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage("");
            }, 3000);
    
            return () => clearTimeout(timer);
        }
    }, [message]);

	return (
		<div className="position-relative">
			<nav className="navbar">
				<div className="container-fluid">
					<form
						className="flex-auto"
						role="search"
						onSubmit={(e) => e.preventDefault()}
					>
						<input
							className="form-control me-2"
							type="search"
							placeholder="Search someone to invite"
							aria-label="Search"
							value={query}
							onChange={handleSearch}
							onFocus={() => setShowDropdown(true)}
							onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
						/>
					</form>
				</div>
			</nav>

			{showDropdown && results.length > 0 && (
				<ul
					className="dropdown-menu show w-100"
					style={{ position: "absolute", zIndex: 1000 }}
				>
					{results.map((user) => (
						<li key={user.username}>
							<button
								className="dropdown-item"
								onClick={() => handleInviteClick(user.username)}
								disabled={loading}
							>
								{user.username} {loading ? "(Sending...)" : ""}
							</button>
						</li>
					))}
				</ul>
			)}
			{message && (
				<div
				className={`alert ${invitationSent ? "alert-success" : "alert-danger"}`}
				role="alert"
				style={{
					position: "absolute",
					top: "-40px",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 1050, // S'assurer qu'il passe au-dessus des autres éléments
					whiteSpace: "nowrap", // Empêche le texte de forcer un retour à la ligne
				}}
			>
					{message}
				</div>
			)}
		</div>
	);
};

export default SearchBar;
