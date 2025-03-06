import React, { useState, useEffect } from "react";
import { fetchMatches } from "../utilities/matchActions";
import "./match.css";

type Match = {
	id: number;
	created_at: string;
	// Add other properties here
};

export default function MatchList() {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMatchesAsync = async () => {
			try {
				const filters = {
					is_ongoing: false,
					is_finished: false,
					player2: undefined,
				};
				const data = await fetchMatches(filters);
				setMatches(data);
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch matches in match list", error);
			}
		};
		fetchMatchesAsync();
	}, []);

	return (
		<div className="matches-container">
			<h2>Available Matches</h2>
			{loading ? (
				<p>Loading...</p>
			) : (
				<table className="matches-table">
					<thead>
						<tr>
							<th>Created At</th>
							<th>Match Type</th>
							<th>Players</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{matches.map((match) => (
							<tr key={match.id}>
								<td>{match.created_at}</td>
								<td>1v1</td>
								<td>1/2</td>
								<td>
									<button className="join-btn">Join</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
