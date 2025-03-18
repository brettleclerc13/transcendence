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
	alias,
}: {
	setAlert: (alertMessage: { message: string; type: string } | null) => void;
	setGameID: (matchID: string) => void;
	setGameType: (isReadyToPlay: string) => void;
	alias: string | undefined;
}) {
	const [games, setGames] = useState<Games[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchMatchesAsync = async () => {
			try {
				const matchFilters = {
					is_ongoing: false,
					is_finished: false,
					player2: undefined,
				};
				const tournamentFilters = {
					is_ongoing: false,
					is_finished: false,
				};

				const [matchData, tournamentData] = await Promise.all([
					fetchMatches(matchFilters),
					fetchTournaments(tournamentFilters),
				]);

				const uniqueGamesMap = new Map();
				[...matchData, ...tournamentData].forEach((game) => {
					uniqueGamesMap.set(game.id, game);
				});

				setGames(Array.from(uniqueGamesMap.values()));

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
				if (!alias) {
					setAlert({
						message: "Cannot join tournament without an alias!",
						type: "danger",
					});
					return;
				}
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
