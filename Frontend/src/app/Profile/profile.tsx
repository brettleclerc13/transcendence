"use client"

import React, { useEffect, useState, useActionState } from "react";
import { Doughnut } from "react-chartjs-2";
import "./profile.css";
import { fetchUserProfile, updateUserProfile } from "../utilities/profileActions";
import type { UserProfileUpdate } from "../utilities/profileActions";
import Link from "next/link";
import { z } from "zod";
import ProfileImage from "./profileImage"

export const profileSchema = z.object({
	username: z.string().min(3, "Username must be at least 3 characters long"),
	email: z.string().email("Invalid email format"),
	age: z.union([z.number().positive("Age must be a positive number"), z.string().optional()]),
	nationality: z.string().optional(),
	tournamentName: z.string().optional(),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

type Match = {
    duelNumber?: number;
    adversary?: string;
    date?: string;
    result?: string; // W/L
}

export default function Profile() {
	const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfileUpdate | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [chartData, setChartData] = useState({});
	const [matches, setMatches] = useState<Match[]>([]);

	const [ profileData, profileAction, profilePending ] = useActionState( handleUserProfile, undefined );

	useEffect(() => {
		const fetchData = async () => {
			try {
			const profileResults = await fetchUserProfile();
			
			setUserProfile(profileResults);
			setIsLoading(false);

			} catch (error) {
				console.error("failed to fetch user profile info");
				setUserProfile(null);
			}
		}
			// const matchResults = await fetchUserMatches();

			// if (matchResults.success) {
			// 	// Calcul des statistiques Win/Lose
			// 	const totalMatches = matches.length;
			// 	const wins = matches.filter(match => match.result === "W").length;
			// 	const losses = totalMatches - wins;

			// 	// Données pour la roue
			// 	setChartData({
			// 		labels: ["Wins", "Losses"],
			// 		datasets: [
			// 			{
			// 				data: [wins, losses],
			// 				backgroundColor: ["#4caf50", "#f44336"], // Couleurs pour Win et Lose
			// 				borderWidth: 1,
			// 			},
			// 		],
			// 	});

			// 	const chartOptions = {
			// 		cutout: "70%", // Taille du "trou" au centre de l'anneau
			// 		plugins: {
			// 			legend: {
			// 				display: true,
			// 				position: "bottom",
			// 			},
			// 		},
			// 	};
			// 	setMatches(matches);
			// }
			fetchData();
    }, []);

	async function handleUserProfile(_previousState: unknown, formData: FormData) {
		const profileInput ={
			username: formData.get("username"),
			email: formData.get("email"),
			age: formData.get("age") ? Number(formData.get("age")) : undefined,
			nationality: formData.get("nationality"),
			tournamentName: formData.get("tournamentName"),
			bio: formData.get("bio"),
		}

		const validationResult = profileSchema.safeParse(profileInput);

		if (!validationResult.success) {
			return { error: String(validationResult.error.format()) };
		}

		try {
			await updateUserProfile(validationResult.data);
			setUserProfile(validationResult.data);
			setAlert({ message: "Your profile has been successfully updated!", type: "success" });

		} catch (error) {
			return { error: String(error) };
		}
	}

	if (isLoading) {
        return <div>Loading profile...</div>; // Affiche un message ou un spinner pendant le chargement
    }

    if (!userProfile) {
        return <div>Failed to load profile.</div>; // Affiche un message si le profil n'est pas disponible
    }

	return (
		<div className="profile-container">
			{alert && (
				<div className={`alert alert-${alert.type} mb-4`} role="alert">
					{alert.message}
				</div>
			)}
			{profileData?.error && (
				<div className="alert alert-danger mb-4" role="alert">
					{profileData?.error ?? 'An unknown error occurred'}
				</div>
			)}
			<ProfileImage profilePicture={userProfile.profile?.profile_picture ? userProfile.profile?.profile_picture : "/img/default.png" } />
			<form action={profileAction}>
				<div className="contour-informations">
					<div className="left-informations">
						<div>
							<label>Username:</label>
							<input 
								name="username"
								defaultValue={userProfile.username}
								/>
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
							<input 
								type="number"
								name="age"
								defaultValue={userProfile.profile?.age}
								/>
						</div>
						<div>
							<label>Nationality:</label>
							<input 
								type="text"
								name="nationality"
								defaultValue={userProfile.profile?.nationality}
								/>
						</div>
					</div>
					<div className="right-informations">
						<div>
							<label>Bio:</label>
							<textarea
								name="bio"
								placeholder="Whatever!"
								defaultValue={userProfile.profile?.bio}
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
							<button className="button-save" type="submit" disabled={profilePending}>Save</button>
							<Link href="/" className="button-cancel">Cancel</Link>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
