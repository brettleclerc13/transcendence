import React, { useState, useEffect } from "react";
import { fetchMatches, joinSimpleMatch } from "../utilities/matchActions";
import "./match.css";

type Match = {
	id: string;
	created_at: string;
	is_tournament: boolean;
	player1_username: string;
	// Add other properties here
};

export default function MatchList({
	setAlert,
	setMatchID,
	setIsReadyToPlay,
}: {
	setAlert: (alertMessage: { message: string; type: string } | null) => void;
	setMatchID: (matchID: string) => void;
	setIsReadyToPlay: (isReadyToPlay: boolean) => void;
}) {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

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
				setAlert({
					message: `Failed to fetch matches in match list: ${error}`,
					type: "danger",
				});
				return;
			}
		};
		fetchMatchesAsync();
	}, []);

	const handleGameEntry = async (matchID: string) => {
		try {
			await joinSimpleMatch(matchID);
			setAlert({
				message: "Game on!",
				type: "success",
			});
			setMatchID(matchID);
			setTimeout(() => {
				setIsReadyToPlay(true);
			}, 1000);
		} catch (error) {
			setAlert({
				message: `Failed to join match: ${error}`,
				type: "danger",
			});
			return;
		}
	};

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
							<th>Type</th>
							<th>Creator</th>
							<th>Match ID</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{matches.map((match) => (
							<tr key={match.id}>
								<td>
									{new Intl.DateTimeFormat("en-GB", {
										dateStyle: "long",
										timeStyle: "short",
									}).format(new Date(match.created_at))}
								</td>
								<td>{match.is_tournament ? "Tournament" : "1v1"}</td>
								<td>{match.player1_username}</td>
								<td>{match.id}</td>
								<td>
									<button
										className="join-btn"
										onClick={() => handleGameEntry(match.id)}
									>
										Join
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
