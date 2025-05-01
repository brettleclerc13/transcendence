"use client";

import { useState, useEffect, useActionState } from "react";
import MatchList from "./matchList";
import {
	fetchUserProfile,
	updateUserProfile,
} from "../utilities/profileActions";
import { z } from "zod";
import { isUserLoggedIn } from "../utilities/userClientActions";
import Link from "next/link";
import { createSimpleMatch, checkMatches } from "../utilities/matchActions";
import {
	createTournament,
	checkTournaments,
} from "../utilities/tournamentActions";
import GameCanvas from "./gameCanvas";
import "./match.css";
import TournamentCanvas from "./tournamentCanvas";
import { Alert } from "react-bootstrap";

export const profileSchema = z.object({
	tournament_name: z
		.string()
		.min(3, "Alias name must be at least 3 characters long")
		.max(32, "Alias name is too long"),
});

export default function Lobby() {
	const [alias, setAlias] = useState<string | undefined>(undefined);
	const [alert, setAlert] = useState<{
		message: string;
		type: "danger" | "success";
	} | null>(null);
	const [gameType, setGameType] = useState<string>("");
	const [gameID, setGameID] = useState<string>("");
	const [tournamentData, tournamentAction, tournamentPending] = useActionState(
		handleTournamentMatchCreation,
		undefined,
	);
	const [simpleGamePending, setSimpleGamePending] = useState<boolean>(false);

	const setAlertWithTimeout = (
		alertData: { message: string; type: "danger" | "success" } | null,
	) => {
		setAlert(alertData);
		if (alertData) {
			setTimeout(() => {
				setAlert(null);
			}, 3000); // 3 seconds
		}
	};

	const fetchProfile = async () => {
		try {
			const userProfile = await fetchUserProfile();
			setAlias(
				userProfile.tournament_name ? userProfile.tournament_name : undefined,
			);
		} catch (error) {
			setAlertWithTimeout({
				message: `Error fetching your profile info: ${error}`,
				type: "danger",
			});
			setGameType("lobby");
			return;
		}
	};

	const checkGames = async () => {
		try {
			const matchResults = await checkMatches();
			if (matchResults.ok) {
				setGameID(matchResults.matchID);
				setGameType("simple");
				return;
			} else {
				const tournamentResults = await checkTournaments();
				if (tournamentResults.ok) {
					setGameID(tournamentResults.tournamentID);
					setGameType("tournament");
					return;
				} else {
					setGameType("lobby");
					return;
				}
			}
		} catch (error) {
			setAlertWithTimeout({
				message: `Error checking for ongoing matches: ${error}`,
				type: "danger",
			});
			setGameType("lobby");
			return;
		}
	};

	useEffect(() => {
		if (isUserLoggedIn()) {
			if (gameType === "" || gameType === "lobby") {
				checkGames();
			}
			fetchProfile();
		} else {
			setGameType("notLoggedIn");
		}
	}, [gameType]);

	const handleSimpleMatchCreation = async () => {
		try {
			setSimpleGamePending(true);
			const response = await createSimpleMatch();
			setAlertWithTimeout({
				message: "Game on!",
				type: "success",
			});
			setGameID(response.matchID);
			setTimeout(() => {
				setGameType("simple");
			}, 1000);
			setSimpleGamePending(false);
			return;
		} catch (error) {
			setAlertWithTimeout({
				message: `Error creating a 1v1 game: ${error}`,
				type: "danger",
			});
			setSimpleGamePending(false);
			return;
		}
	};

	async function handleTournamentMatchCreation(
		_previousState: unknown,
		formData: FormData,
	) {
		const tournament_name = formData.get("tournamentName") as string;
		if (!tournament_name) {
			return {
				tournamentNameError: "Please insert an alias for your tournament ",
			};
		}

		const validationResult = profileSchema.safeParse({ tournament_name });

		if (!validationResult.success)
			return {
				previousValues: { tournament_name },
				tournamentNameError: validationResult.error.errors.find(
					(err) => err.path[0] === "tournament_name",
				)?.message,
			};

		try {
			await updateUserProfile(validationResult.data);
			setAlias(validationResult.data.tournament_name);
		} catch (error) {
			setAlertWithTimeout({
				message: `Error updating your alias name: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournament_name } };
		}

		try {
			const response = await createTournament();
			setAlertWithTimeout({
				message: "Game on!",
				type: "success",
			});
			setGameID(response.tournamentID);
			setTimeout(() => {
				setGameType("tournament");
			}, 1000);
			return;
		} catch (error) {
			setAlertWithTimeout({
				message: `Error creating a tournament: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournament_name } };
		}
	}

	return (
		<div className="app-container">
			{gameType == "simple" && (
				<GameCanvas matchID={gameID} setGameType={setGameType} />
			)}
			{gameType == "tournament" && (
				<TournamentCanvas tournamentID={gameID} setGameType={setGameType} />
			)}
			{gameType == "lobby" && (
				<div className="lobby-container">
					{alert && (
						<div className="alert-box">
							<Alert
								variant={alert.type}
								onClose={() => setAlertWithTimeout(null)}
								dismissible
								show={!!alert}
							>
								<span className="alert-message">{alert.message}</span>
							</Alert>
						</div>
					)}
					<div className="lobby-sub-container">
						<div style={{ flex: 3 }}>
							<MatchList
								setAlert={setAlertWithTimeout}
								setGameID={setGameID}
								setGameType={setGameType}
								alias={alias}
								setAlias={setAlias}
							/>
						</div>
						<div style={{ flex: 2 }}>
							<form action={tournamentAction}>
								<h3>Tournament alias name</h3>
								<input
									type="text"
									name="tournamentName"
									value={alias ?? ""}
									onChange={(e) => setAlias(e.target.value)}
									className="input-field"
								/>
								{tournamentData?.tournamentNameError && (
									<p className="input-error">
										{tournamentData?.tournamentNameError}
									</p>
								)}
								<div className="lobby-button-container">
									<button
										className="button-tournament"
										type="submit"
										disabled={tournamentPending}
									>
										Create tournament match
									</button>
								</div>
							</form>
							<div className="lobby-button-container">
								<button
									disabled={simpleGamePending}
									className="button-simple"
									onClick={handleSimpleMatchCreation}
								>
									Create 1v1 match
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			{gameType == "notLoggedIn" && (
				<div className="not-logged-in-container">
					<p className="text-lg">
						Please log in before starting a game. It won&apos;t even take a
						minute!
					</p>
					<Link className="secondary-button" href="/login">
						Connect
					</Link>
				</div>
			)}
		</div>
	);
}
