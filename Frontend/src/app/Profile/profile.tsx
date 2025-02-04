"use client"

import React, { useEffect, useState, useActionState } from "react";
import { Doughnut } from "react-chartjs-2";
import "./profile.css";
import { fetchUserProfile } from "../utilities/userActions";
import Link from "next/link";

type Profile = {
	username: string;
    email: string;
    picture?: string;
    age?: string;
    nationality?: string;
    tournamentName?: string;
    bio?: string;
}

type Match = {
    duelNumber?: number;
    adversary?: string;
    date?: string;
    result?: string; // W/L
}

export default function Profile() {
	const [chartData, setChartData] = useState({});
	const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [matches, setMatches] = useState<Match[]>([]);

	const [ profileData, profileAction, profilePending ] = useActionState( handleUserProfile, undefined );

	useEffect(() => {
		const fetchData = async () => {
			try {
			const profileResults = await fetchUserProfile();
			
			setProfile(profileResults);
			setIsLoading(false);

			} catch (error) {
				console.error("failed to fetch user profile info");
				setProfile(null);
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
		const username = formData.get("username") as string;
		const email = formData.get("email") as string;
		const picture = formData.get("picture") as string;
		const age = parseInt(formData.get("age") as string);
		const nationality = formData.get("nationality") as string;
		const tournamentName = formData.get("tournamentName") as string;
		const bio = formData.get("bio") as string;

		try {
			// Préparer les données pour l'API
			const requestData = {
				email,
				username,
				profile: {
					...(picture ? { picture } : {}),
					...(age ? { age } : {}),
					...(nationality ? { nationality } : {}),
					...(tournamentName ? { tournamentName } : {}),
					...(bio ? { bio } : {}),
				}
			};

			//await updateUserProfile(requestData);
			setProfile(requestData);
			setAlert({ message: "Your profile has been successfully updated!", type: "success" });

		} catch (error) {
			return { error: String(error) };
		}
	}

	if (isLoading) {
        return <div>Loading profile...</div>; // Affiche un message ou un spinner pendant le chargement
    }

    if (!profile) {
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
			<form action={profileAction}>
				<div className="image-wrapper">
					<img src={profile.picture} alt='Profile Picture' className='profile-picture' />
				</div>
				<div className="contour-informations">
					<div className="left-informations">
						<div>
							<label>Username:</label>
							<input 
								name="username"
								defaultValue={profile.username}
								/>
						</div>
						<div>
							<label>Email:</label>
							<input 
								type="email"
								name="email"
								defaultValue={profile.email}
								/>
						</div>
						<div>
							<label>Age:</label>
							<input 
								type="number"
								name="age"
								defaultValue={profile.age}
								/>
						</div>
						<div>
							<label>Nationality:</label>
							<input 
								type="text"
								name="nationality"
								defaultValue={profile.nationality}
								/>
						</div>
						<div>
							<label>Tournament Name:</label>
							<input
								type="text"
								name="tournamentName"
								defaultValue={profile.tournamentName}
								/>
						</div>
					</div>
					<div className="right-informations">
						<div>
							<label>Bio:</label>
							<textarea
								name="bio"
								placeholder="Whatever!"
								defaultValue={profile.bio}
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
