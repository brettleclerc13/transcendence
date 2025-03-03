"use client";

import { useState, useEffect, useActionState } from "react";
import MatchList from "./matchList";
import {
	fetchUserProfile,
	updateUserProfile,
} from "../utilities/profileActions";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { isUserLoggedIn } from "../utilities/userClientActions";
import Link from "next/link";
import { createSimpleMatch } from "../utilities/matchActions";
import "./game.css";

export const profileSchema = z.object({
	tournamentName: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(32, "Username is too long"),
});

export default function Lobby() {
	const [alias, setAlias] = useState<string | undefined>(undefined);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const [gameData, gameAction, gamePending] = useActionState(
		handleSimpleMatchCreation,
		undefined
	);
	const router = useRouter();

	const fetchProfile = async () => {
		try {
			const userProfile = await fetchUserProfile();
			setAlias(
				userProfile.tournamentName ? userProfile.tournamentName : undefined
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
		const tournamentName = formData.get("tournamentName") as string;
		if (!tournamentName) {
			return {
				tournamentNameError: "Please insert an alias for your tournament ",
			};
		}

		const validationResult = profileSchema.safeParse({ tournamentName });

		if (!validationResult.success)
			return {
				previousValues: { tournamentName },
				tournamentNameError: validationResult.error.errors.find(
					(err) => err.path[0] === "tournamentName"
				)?.message,
			};

		try {
			await updateUserProfile(validationResult.data);
			setAlias(validationResult.data.tournamentName);
		} catch (error) {
			setAlert({
				message: `Error updating your alias name: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournamentName } };
		}

		try {
			await createSimpleMatch();
			setAlert({
				message: "Game on!",
				type: "success",
			});
			setTimeout(() => {
				router.push("/play");
			}, 2000);
		} catch (error) {
			setAlert({
				message: `Error creating a 1v1 game: ${error}`,
				type: "danger",
			});
			return { previousValues: { tournamentName } };
		}
	}

	return (
		<div className="lobby-container">
			{isUserLoggedIn() ? (
				<>
					{alert && (
						<div className={`alert alert-${alert.type} alert-box`} role="alert">
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
						<div className="basis-2">
							<MatchList />
						</div>
						<div className="basis-1">
							<form action={gameAction}>
								<input
									type="text"
									name="tournamentName"
									defaultValue={
										gameData?.previousValues?.tournamentName || alias
									}
									className="border rounded-md p-2 mb-4 w-full"
								/>
								{gameData?.tournamentNameError && (
									<p className="input-error">{gameData?.tournamentNameError}</p>
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
						Please log in before starting a game. It won't even take a minute!
					</p>
					<Link className="secondary-button" href="/login">
						Connect
					</Link>
				</div>
			)}
		</div>
	);
}
