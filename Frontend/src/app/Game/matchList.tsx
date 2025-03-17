import React, { useState, useEffect } from "react";
import { fetchMatches, joinSimpleMatch } from "../utilities/matchActions";
import {
	fetchTournaments,
	joinTournament,
} from "../utilities/tournamentActions";
import "./match.css";

type Games = {
	id: string;
	created_at: string;
	is_tournament: boolean;
	player1_username: string;
	// Add other properties here
};

export default function MatchList({
	setAlert,
	setGameID,
	setGameType,
}: {
	setAlert: (alertMessage: { message: string; type: string } | null) => void;
	setGameID: (matchID: string) => void;
	setGameType: (isReadyToPlay: string) => void;
}) {
	const [games, setGames] = useState<Games[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchMatchesAsync = async () => {
			let filters, data: Games[];
			try {
				filters = {
					is_ongoing: false,
					is_finished: false,
					player2: undefined,
				};
				data = await fetchMatches(filters);
				setGames(data);

				filters = {
					is_ongoing: false,
					is_finished: false,
				};
				data = await fetchTournaments(filters);
				setGames((prevGames) => [...prevGames, ...data]);

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

	const handleGameEntry = async (ID: string, is_tournament: boolean) => {
		try {
			if (is_tournament) {
				await joinTournament(ID);
				setAlert({
					message: "Best of luck!",
					type: "success",
				});
				setGameID(ID);
				setTimeout(() => {
					setGameType("tournament");
				}, 1000);
			} else {
				await joinSimpleMatch(ID);
				setAlert({
					message: "Game on!",
					type: "success",
				});
				setGameID(ID);
				setTimeout(() => {
					setGameType("simple");
				}, 1000);
			}
		} catch (error) {
			setAlert({
				message: `Failed to join match/tournament: ${error}`,
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
						{games.map((game) => (
							<tr key={game.id}>
								<td>
									{new Intl.DateTimeFormat("en-GB", {
										dateStyle: "long",
										timeStyle: "short",
									}).format(new Date(game.created_at))}
								</td>
								<td>{game.is_tournament ? "Tournament" : "1v1"}</td>
								<td>{game.player1_username}</td>
								<td>{game.id}</td>
								<td>
									<button
										className="join-btn"
										onClick={() => handleGameEntry(game.id, game.is_tournament)}
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
