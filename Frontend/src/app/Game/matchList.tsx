import React, { useState, useEffect } from "react";
import { fetchMatches } from "../utilities/matchActions";

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
					player2: null,
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
		<div>
			<h2>Available Matches</h2>
			{loading ? (
				<p>Loading...</p>
			) : (
				<table>
					<thead>
						<tr>
							<th>Created At</th>
							<th>Match Type</th>
							<th>Players</th>
							<th>Join</th>
						</tr>
					</thead>
					<tbody>
						{matches.slice(0, 5).map((match) => (
							<tr key={match.id}>
								<td>{match.created_at}</td>
								<td>1v1</td>
								<td>1/2</td>
								<td>
									<button>Join</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			{matches.length > 5 && (
				<div>
					<p>More matches available...</p>
					<button>Load More</button>
				</div>
			)}
		</div>
	);
}
