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
import { createSimpleMatch } from "../utilities/matchActions";
import GameCanvas from "./gameCanvas";
import "./match.css";

export const profileSchema = z.object({
	tournament_name: z
		.string()
		.min(3, "Alias name must be at least 3 characters long")
		.max(32, "Alias name is too long"),
});

export default function Lobby() {
	const [alias, setAlias] = useState<string | undefined>(undefined);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const [isReadyToPlay, setIsReadyToPlay] = useState<boolean>(false);
	const [matchID, setmatchID] = useState<string>("");
	const [gameData, gameAction, gamePending] = useActionState(
		handleSimpleMatchCreation,
		undefined
	);

	const fetchProfile = async () => {
		try {
			const userProfile = await fetchUserProfile();
			setAlias(
				userProfile.tournament_name ? userProfile.tournament_name : undefined
			);
		} catch (error) {
			setAlert({
				message: `Error fetching your profile info: ${error}`,
				type: "danger",
			});
			return;
		}
	};

	useEffect(() => {
		fetchProfile();
	}, []);

	async function handleSimpleMatchCreation(
		_previousState: unknown,
		formData: FormData
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
					(err) => err.path[0] === "tournament_name"
				)?.message,
			};

		try {
			await updateUserProfile(validationResult.data);
			setAlias(validationResult.data.tournament_name);
		} catch (error) {
			setAlert({
				message: `Error updating your alias name: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournament_name } };
		}

		try {
			const response = await createSimpleMatch();
			setAlert({
				message: "Game on!",
				type: "success",
			});
			setmatchID(response.matchID);
			setTimeout(() => {
				setIsReadyToPlay(true);
			}, 1000);
			return;
		} catch (error) {
			setAlert({
				message: `Error creating a 1v1 game: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournament_name } };
		}
	}

	return (
		<>
			{isReadyToPlay ? (
				<GameCanvas ID={matchID} />
			) : (
				<div className="lobby-container">
					{isUserLoggedIn() ? (
						<>
							{alert && (
								<div
									className={`alert alert-${alert.type} alert-box`}
									role="alert"
								>
									{alert.message}
									<button
										type="button"
										className="close"
										onClick={() => setAlert(null)}
										aria-label="Close"
									>
										<span aria-hidden="true">&times;</span>
									</button>
								</div>
							)}
							<div className="lobby-sub-container">
								<div className="basis-3/5">
									<MatchList
										setAlert={setAlert}
										setMatchID={setmatchID}
										setIsReadyToPlay={setIsReadyToPlay}
									/>
								</div>
								<div className="basis-2/5">
									<form action={gameAction}>
										<h3>Tournament alias name</h3>
										<input
											type="text"
											name="tournamentName"
											defaultValue={
												gameData?.previousValues?.tournament_name || alias
											}
											className="border rounded-md p-2 mb-4 w-full"
										/>
										{gameData?.tournamentNameError && (
											<p className="input-error">
												{gameData?.tournamentNameError}
											</p>
										)}
										<div className="lobby-button-container">
											<button
												className="button-tournament"
												type="submit"
												disabled={gamePending}
											>
												Create tournament match
											</button>
											<button
												className="button-simple"
												onClick={() => handleSimpleMatchCreation}
												disabled={gamePending}
											>
												Create 1v1 match
											</button>
										</div>
									</form>
								</div>
							</div>
						</>
					) : (
						<div className="flex flex-col gap-4 justify-center items-center h-full w-full">
							<p className="text-lg">
								Please log in before starting a game. It won't even take a
								minute!
							</p>
							<Link className="secondary-button" href="/login">
								Connect
							</Link>
						</div>
					)}
				</div>
			)}
		</>
	);
}
