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
	setIsProfileOpen: (isProfileOpen: boolean) => void;
};

export const profileSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(32, "Username is too long"),
	email: z
		.string()
		.email("Invalid email format")
		.max(254, "Email address is too long"),
	age: z
		.number()
		.positive("Age must be a positive number")
		.max(
			123,
			"The oldest human, Jeanne Calment, lived till the age of 122 years"
		)
		.optional(),
	nationality: z.string().max(254, "Nationality is too long").optional(),
	tournament_name: z
		.string()
		.min(3, "Alias must be at least 3 characters long")
		.max(32, "Alias is too long"),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

type Match = {
	duelNumber?: number;
	adversary?: string;
	date?: string;
	result?: string; // W/L
};

export default function Profile({
	userProfile,
	setUserProfile,
	setIsProfileOpen,
}: ProfileProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const [chartData, setChartData] = useState({});
	const [matches, setMatches] = useState<Match[]>([]);

	const [profileData, profileAction, profilePending] = useActionState(
		handleUserProfileUpdate,
		undefined
	);

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
		formData: FormData
	) {
		const profileInput = {
			username: formData.get("username"),
			email: formData.get("email"),
			age: formData.get("age") ? Number(formData.get("age")) : undefined,
			nationality: formData.get("nationality"),
			tournament_name: formData.get("tournamentName"),
			bio: formData.get("bio"),
		};

		const validationResult = profileSchema.safeParse(profileInput);

		if (!validationResult.success) {
			const emailError = validationResult.error.errors.find(
				(err) => err.path[0] === "email"
			);
			const usernameError = validationResult.error.errors.find(
				(err) => err.path[0] === "username"
			);
			const ageError = validationResult.error.errors.find(
				(err) => err.path[0] === "age"
			);
			const nationalityError = validationResult.error.errors.find(
				(err) => err.path[0] === "nationality"
			);
			const tournamentNameError = validationResult.error.errors.find(
				(err) => err.path[0] === "tournament_name"
			);
			const bioError = validationResult.error.errors.find(
				(err) => err.path[0] === "bio"
			);
			return {
				emailError: emailError ? emailError.message : undefined,
				usernameError: usernameError ? usernameError.message : undefined,
				ageError: ageError ? ageError.message : undefined,
				nationalityError: nationalityError
					? nationalityError.message
					: undefined,
				tournamentNameError: tournamentNameError
					? tournamentNameError
					: undefined,
				bioError: bioError ? bioError.message : undefined,
			};
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
			return;
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
			<ProfileImage
				userProfile={userProfile}
				setUserProfile={setUserProfile}
				setAlert={setAlert}
			/>
			<form action={profileAction}>
				<div className="contour-informations">
					<div className="left-informations">
						<div>
							<label>Username:</label>
							<input
								type="text"
								name="username"
								defaultValue={userProfile.username}
							/>
						</div>
						{profileData?.usernameError && (
							<p className="input-error">{profileData?.usernameError}</p>
						)}
						<div>
							<label>Email:</label>
							<input
								type="email"
								name="email"
								defaultValue={userProfile.email}
							/>
						</div>
						{profileData?.emailError && (
							<p className="input-error">{profileData?.emailError}</p>
						)}
						<div>
							<label>Age:</label>
							<input type="number" name="age" defaultValue={userProfile?.age} />
						</div>
						{profileData?.ageError && (
							<p className="input-error">{profileData?.ageError}</p>
						)}
						<div>
							<label>Nationality:</label>
							<input
								type="text"
								name="nationality"
								defaultValue={userProfile?.nationality}
							/>
						</div>
						{profileData?.nationalityError && (
							<p className="input-error">{profileData?.nationalityError}</p>
						)}
					</div>

					<div className="separator"></div>

					<div className="right-informations">
						<div>
							<label>Alias (Tournament name):</label>
							<input
								type="text"
								name="tournamentName"
								defaultValue={userProfile?.tournament_name}
							/>
						</div>
						{profileData?.nationalityError && (
							<p className="input-error">{profileData?.nationalityError}</p>
						)}
						<div>
							<label>Bio:</label>
							<textarea
								name="bio"
								placeholder="Whatever!"
								defaultValue={userProfile?.bio}
							/>
						</div>
						{profileData?.bioError && (
							<p className="input-error">{profileData?.bioError}</p>
						)}
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
								disabled={profilePending}
							>
								Save
							</button>
							<button
								className="button-cancel"
								onClick={() => setIsProfileOpen(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
