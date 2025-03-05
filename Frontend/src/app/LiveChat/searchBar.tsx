"use client";

import React, { useState } from "react";
import { SearchFriend } from "../utilities/chatActions"; 

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
			if (response.status === true) {
				setResults(response.data.slice(0, 3));
				setShowDropdown(true);
			} else {
				setResults([]);
				setShowDropdown(false);
			}
			// try {
			// 	console.log("TRY 3");
			// 	const response = await fetch(`/api/search?query=${searchValue}`, {
			// 		method: "GET",
			// 		headers: {
			// 			"Content-Type": "application/json",
			// 		},
			// 	});
			// 	console.log("TRY 4");
			// 	let data;
			// 	const text = await response.text();
			// 	console.log("TEXT:", text);
			// 		try {
			// 			data = JSON.parse(text);
						
			// 		} catch {
			// 			console.log("ON TEST 2");
			// 			throw new Error(`Unexpected response: ${response.status}`);
			// 		}
			// 	if (!response.ok) {
			// 		const errorMessage =
			// 			data.non_field_errors?.[0] || // First item in non_field_errors array
			// 			data.message || // Fallback to a generic message
			// 			data.detail || // Another common key for error messages
			// 			"Failed to search for users.";
			// 		throw new Error(errorMessage);
			// 	} else {
			// 		setResults(data.slice(0, 3));
			// 		setShowDropdown(true);
			// 		return;
			// 	}
			// 	// const data: UserResult[] = JSON.parse(text);
			// 	// const data: UserResult[] = await response.json();
			// } catch (error) {
			// 	console.log("TRY 5");
			// 	console.error("Erreur lors de la recherche :", error);
			// 	setResults([]);
			// }
		} else {
			setResults([]);
			setShowDropdown(false);
		}
	};

	const handleInviteClick = async (username: string) => {
		setLoading(true);
		setShowDropdown(false);

		const token = localStorage.getItem("accessToken");
		if (!token) {
			setMessage("You need to be logged in to send a friend request.");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/friends/request/send/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ receiver_username: username }),
			});

			const data = await response.json();

			if (response.ok) {
				setInvitationSent(true);
				setMessage("Friend request sent!");
				setTimeout(() => setInvitationSent(false), 3000);
			} else {
				setMessage(data.error || "Failed to send friend request.");
			}
		} catch (error) {
			console.error("Erreur lors de l'envoi de la demande d'ami :", error);
			setMessage("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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
							// onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
				>
					{message}
				</div>
			)}
		</div>
	);
};

export default SearchBar;
