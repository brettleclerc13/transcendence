'use client'

import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

type UserProfile = {
	id: number;
	user: { id: number; username: string };
	nationality?: string;
	bio?: string;
	age?: number;
	profile_picture?: string;
	tournament_name?: string;
	is_online: boolean;
  };

const SearchBar = () => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<UserProfile[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [invitationSent, setInvitationSent] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const searchValue = event.target.value;
		setQuery(searchValue);

		if (searchValue.trim().length > 0) {
			try {
				const response = await fetch(`/api/search?query=${searchValue}`);
				const data: UserProfile[] = await response.json();
				setResults(data.slice(0, 3));
				setShowDropdown(true);
			} catch (error) {
			console.error("Erreur lors de la recherche :", error);
			setResults([]);
			}
		} else {
			setResults([]);
			setShowDropdown(false);
		}
	};

	const handleInviteClick = async (userId: number) => {
		setLoading(true);
		setShowDropdown(false);
		
		const token = localStorage.getItem('accessToken');
		if (!token) {
		  setMessage("You need to be logged in to send a friend request.");
		  setLoading(false);
		  return;
		}
	
		try {
		  const response = await fetch('/api/friends/request/send/', {
			method: 'POST',
			headers: {
			  'Authorization': `Bearer ${token}`,
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({ receiver_id: userId }),
		  });
	
		  const data = await response.json();

		  if (response.ok) {
			setInvitationSent(true);
			setMessage("Friend request sent!");
			setTimeout(() => setInvitationSent(false), 3000); // Hide after 3 seconds
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
					<form className="flex" role="search" onSubmit={(e) => e.preventDefault()}>
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
				<ul className="dropdown-menu show w-100" style={{ position: "absolute", zIndex: 1000 }}>
					{results.map((user) => (
						<li key={user.id}>
							<button
								className="dropdown-item"
								onClick={() => handleInviteClick(user.id)}
								disabled={loading}
							>
								{user.username} {loading ? "(Sending...)" : ""}
				  			</button>
						</li>
			  		))}
				</ul>
			)}
			{message && (
				<div className={`alert ${invitationSent ? 'alert-success' : 'alert-danger'}`} role="alert">
					{message}
				</div>
			)}
		</div>
	);
};

export default SearchBar;
