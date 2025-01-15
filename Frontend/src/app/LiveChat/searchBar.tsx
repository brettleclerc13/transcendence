'use client'

import React, { useState } from "react";
import { useRouter } from "next/router";
import 'bootstrap/dist/css/bootstrap.min.css';

interface UserProfile {
	id: number;
	username: string;
}

const SearchBar = () => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<UserProfile[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const router = useRouter();
  
	const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const searchValue = event.target.value;
		setQuery(searchValue);

		if (searchValue.trim().length > 0) {
			try {
				const response = await fetch(`/api/search?query=${searchValue}`);
				const data: UserProfile[] = await response.json();
				setResults(data.slice(0, 3)); // Limite à 3 résultats
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
  
	const handleProfileClick = (userId: number) => {
		setShowDropdown(false);
		router.push(`/profile/${userId}`);
	};

	return (
		<div className="position-relative">
			<nav className="navbar bg-body-tertiary">
				<div className="container-fluid">
					<form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
						<input
							className="form-control me-2"
							type="search"
							placeholder="Search someone"
							aria-label="Search"
							value={query}
							onChange={handleSearch}
							onFocus={() => setShowDropdown(true)}
							onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
						/>
						<button className="btn btn-outline-success" type="submit">
							Search
						</button>
					</form>
		  		</div>
			</nav>

			{showDropdown && (
				<ul className="dropdown-menu show w-100" style={{ position: "absolute", zIndex: 1000 }}>
					{results.length > 0 ? (
						results.map((user) => (
							<li key={user.id}>
								<button
									className="dropdown-item"
									onClick={() => handleProfileClick(user.id)}
								>
									{user.username}
				  				</button>
							</li>
			  			))
					) : (
						<li>
							<span className="dropdown-item fst-italic">No user found</span>
						</li>
					)}
				</ul>
			)}
		</div>
	);
};

export default SearchBar;
