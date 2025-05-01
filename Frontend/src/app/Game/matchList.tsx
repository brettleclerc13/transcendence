import React, { useState, useEffect } from "react";
import { fetchMatches, joinSimpleMatch } from "../utilities/matchActions";
import {
	fetchTournaments,
	joinTournament,
} from "../utilities/tournamentActions";
import "./match.css";
import { z } from "zod";
import { updateUserProfile } from "../utilities/profileActions";

type Games = {
	id: string;
	created_at: string;
	is_tournament: boolean;
	player1_username: string;
	players_usernames: string[];
	// Add other properties here
};

export const profileSchema = z.object({
	tournament_name: z
		.string()
		.min(3, "Alias name must be at least 3 characters long")
		.max(32, "Alias name is too long"),
});

export default function MatchList({
	setAlert,
	setGameID,
	setGameType,
	alias,
	setAlias,
}: {
	setAlert: (
		alertMessage: { message: string; type: "danger" | "success" } | null,
	) => void;
	setGameID: (matchID: string) => void;
	setGameType: (isReadyToPlay: string) => void;
	setAlias: (alias: string | undefined) => void;
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
					is_ongoing: true,
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
		if (is_tournament) {
			if (!alias) {
				setAlert({
					message: "Cannot join tournament without an alias!",
					type: "danger",
				});
				return;
			}

			const tournament_name = alias;
			const validationResult = profileSchema.safeParse({ tournament_name });
			if (!validationResult.success) {
				setAlert({
					message: String(
						validationResult.error.errors.find(
							(err) => err.path[0] === "tournament_name",
						)?.message,
					),
					type: "danger",
				});
				return;
			}

			try {
				await updateUserProfile(validationResult.data);
				setAlias(alias);
			} catch (error) {
				setAlert({
					message: `Error updating your alias name: ${error}`,
					type: "danger",
				});
				return;
			}

			const result = await joinTournament(ID);
			if (result && result.ok) {
				setAlert({
					message: "Best of luck!",
					type: "success",
				});
				setGameID(ID);
				setTimeout(() => {
					setGameType("tournament");
				}, 1000);
			} else {
				setAlert({
					message: result.error || "Failed to join tournament",
					type: "danger",
				});
			}
		} else {
			const result = await joinSimpleMatch(ID);
			if (result && result.ok) {
				setAlert({
					message: "Game on!",
					type: "success",
				});
				setGameID(ID);
				setTimeout(() => {
					setGameType("simple");
				}, 1000);
			} else {
				setAlert({
					message: result.error || "Failed to join match",
					type: "danger",
				});
			}
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
								<td>{game.is_tournament ? game.players_usernames[0] : game.player1_username}</td>
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
