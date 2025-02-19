"use client";

import React, { useEffect, useRef, useState, useActionState } from "react";
import "./profile.css";
import { updateUserProfile } from "../utilities/profileActions";
import Link from "next/link";
import { z } from "zod";
import ProfileImage from "./profileImage";

import { Doughnut } from "react-chartjs-2";

import type { UserProfileData } from "../utilities/profileActions";

type ProfileProps = {
	userProfile: UserProfileData | null;
	setUserProfile: (newProfile: UserProfileData) => void;
};

export const profileSchema = z.object({
	username: z.string().min(3, "Username must be at least 3 characters long"),
	email: z.string().email("Invalid email format"),
	age: z.number().positive("Age must be a positive number").optional(),
	nationality: z.string().optional(),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

type Match = {
	duelNumber?: number;
	adversary?: string;
	date?: string;
	result?: string; // W/L
};

export default function Profile({ userProfile, setUserProfile }: ProfileProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null,
	);
	const [chartData, setChartData] = useState({});
	const [matches, setMatches] = useState<Match[]>([]);

	const [profileUpdateData, profileUpdateAction, profileUpdatePending] =
		useActionState(handleUserProfileUpdate, undefined);

	// useEffect(() => {
	// 	const fetchMatchData = async () => {
	// 		const matchResults = await fetchUserMatches();

	// 		if (matchResults.success) {
	// 			// Calcul des statistiques Win/Lose
	// 			const totalMatches = matches.length;
	// 			const wins = matches.filter(match => match.result === "W").length;
	// 			const losses = totalMatches - wins;

	// 			// Données pour la roue
	// 			setChartData({
	// 				labels: ["Wins", "Losses"],
	// 				datasets: [
	// 					{
	// 						data: [wins, losses],
	// 						backgroundColor: ["#4caf50", "#f44336"], // Couleurs pour Win et Lose
	// 						borderWidth: 1,
	// 					},
	// 				],
	// 			});

	// 			const chartOptions = {
	// 				cutout: "70%", // Taille du "trou" au centre de l'anneau
	// 				plugins: {
	// 					legend: {
	// 						display: true,
	// 						position: "bottom",
	// 					},
	// 				},
	// 			};
	// 			setMatches(matches);
	// 		}
	// 	}
	// }, []);

	async function handleUserProfileUpdate(
		_previousState: unknown,
		formData: FormData,
	) {
		const profileInput = {
			username: formData.get("username"),
			email: formData.get("email"),
			age: formData.get("age") ? Number(formData.get("age")) : undefined,
			nationality: formData.get("nationality"),
			tournamentName: formData.get("tournamentName"),
			bio: formData.get("bio"),
		};

		const validationResult = profileSchema.safeParse(profileInput);

		if (!validationResult.success) {
			const errorMessage = validationResult.error.errors
				.map((err) => `${err.path.join(".")}: ${err.message}`)
				.join("\n");
			setAlert({ message: errorMessage, type: "danger" });
			return;
		}

		try {
			await updateUserProfile(validationResult.data);
			setUserProfile({ ...userProfile, ...validationResult.data });
			setAlert({
				message: "Your profile has been successfully updated!",
				type: "success",
			});
		} catch (error) {
			setAlert({
				message: `Error updating your profile: ${error}`,
				type: "danger",
			});
		}
	}

	if (!userProfile) {
		return <div>Failed to load profile.</div>; // Affiche un message si le profil n'est pas disponible
	}

	return (
		<div className="profile-container">
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
			<ProfileImage userProfile={userProfile} setUserProfile={setUserProfile} />
			<form action={profileUpdateAction}>
				<div className="contour-informations">
					<div className="left-informations">
						<div>
							<label>Username:</label>
							<input name="username" defaultValue={userProfile.username} />
						</div>
						<div>
							<label>Email:</label>
							<input
								type="email"
								name="email"
								defaultValue={userProfile.email}
							/>
						</div>
						<div>
							<label>Age:</label>
							<input type="number" name="age" defaultValue={userProfile?.age} />
						</div>
						<div>
							<label>Nationality:</label>
							<input
								type="text"
								name="nationality"
								defaultValue={userProfile?.nationality}
							/>
						</div>
					</div>

					<div className="separator"></div>

					<div className="right-informations">
						<div>
							<label>Bio:</label>
							<textarea
								name="bio"
								placeholder="Whatever!"
								defaultValue={userProfile?.bio}
							/>
						</div>
						{/* <div className="match-history">
								<h3>Match History</h3>
								<div className="table-container">
									<table className="table">
										<thead>
											<tr>
												<th scope="col">Duel #</th>
												<th scope="col">Adversary</th>
												<th scope="col">Date</th>
												<th scope="col">W/L</th>
											</tr>
										</thead>
										<tbody>
											{matches.map((match) => (
												<tr key={match.duelNumber}>
													<th scope="row">{match.duelNumber}</th>
													<td>{match.adversary}</td>
													<td>{match.date}</td>
													<td>{match.result}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
							<div className="win-lose-chart">
								<h3>Win/Loss Ratio</h3>
								<Doughnut data={chartData} options={chartOptions} />
								<Doughnut data={chartData} />
							</div> */}
						<div className="button-container">
							<button
								className="button-save"
								type="submit"
								disabled={profileUpdatePending}
							>
								Save
							</button>
							<Link href="/" className="button-cancel">
								Cancel
							</Link>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
