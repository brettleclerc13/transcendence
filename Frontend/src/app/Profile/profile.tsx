import React, { useEffect, useState } from "react";
// import { Doughnut } from "react-chartjs-2";
import "./profile.css";

interface Profile {
    picture: string;
    username: string;
    email: string;
    age: string;
    nationality: string;
    tournamentName: string;
    bio: string;
}

interface Match {
    duelNumber: number;
    adversary: string;
    date: string;
    result: string; // W/L
}

export default function Profile() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [tempProfile, setTempProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [matches, setMatches] = useState<Match[]>([]);

	useEffect(() => {
        fetch("/users/")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch profile data");
                }
                return response.json();
            })
            .then((data) => {
                setProfile(data);
                setTempProfile(data);
				setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching profile data:", error);
				setLoading(false);
            });

		fetch("/matches/")
            .then((response) => response.json())
            .then((data) => {
                setMatches(data);
            })
            .catch((error) => {
                console.error("Error fetching match data:", error);
            });
    }, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (tempProfile) {
            const { name, value } = e.target;
            setTempProfile({
                ...tempProfile,
                [name]: value,
            });
        }
	};

	const handleSave = () => {
        fetch("/users/${profile.id}/", {
            method: "PUT", // Utilisez POST ou PUT selon votre API
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tempProfile),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to save profile data");
                }
                return response.json();
            })
            .then((data) => {
                setProfile(data); // Met à jour les données avec la réponse du serveur
                console.log("Profile saved successfully:", data);
            })
            .catch((error) => {
                console.error("Error saving profile data:", error);
            });
    };
	
	const handleCancel = () => {
		setTempProfile(profile);
	}

	// Calcul des statistiques Win/Lose
	const totalMatches = matches.length;
	const wins = matches.filter(match => match.result === "W").length;
	const losses = totalMatches - wins;

	// Données pour la roue
	const chartData = {
		labels: ["Wins", "Losses"],
		datasets: [
			{
				data: [wins, losses],
				backgroundColor: ["#4caf50", "#f44336"], // Couleurs pour Win et Lose
				borderWidth: 1,
			},
		],
	};

	const chartOptions = {
		cutout: "70%", // Taille du "trou" au centre de l'anneau
		plugins: {
			legend: {
				display: true,
				position: "bottom",
			},
		},
	};

	if (loading) {
        return <div>Loading profile...</div>; // Affiche un message ou un spinner pendant le chargement
    }

    if (!profile || !tempProfile) {
        return <div>Failed to load profile.</div>; // Affiche un message si le profil n'est pas disponible
    }

	return (
		<div className="profile-container">
			<div className="image-wrapper">
				<img src={profile.picture} alt='Profile Picture' className='profile-picture' />
			</div>
			<div className="contour-informations">
				<div className="left-informations">
					<div>
						<label>Username:</label>
						<input 
							type="text"
							name="username"
							value={tempProfile.username}
							onChange={handleChange}
							/>
					</div>
					<div>
						<label>Email:</label>
						<input 
							type="email"
							name="email"
							value={tempProfile.email}
							onChange={handleChange}
							/>
					</div>
					<div>
						<label>Age:</label>
						<input 
							type="number"
							name="age"
							value={tempProfile.age}
							onChange={handleChange}
							/>
					</div>
					<div>
						<label>Nationality:</label>
						<input 
							type="text"
							name="nationality"
							value={tempProfile.nationality}
							onChange={handleChange}
							/>
					</div>
					<div>
						<label>Tournament Name:</label>
						<input
							type="text"
							name="tournamentName"
							value={tempProfile.tournamentName}
							onChange={handleChange}
							/>
					</div>
				</div>
				<div className="right-informations">
					<div>
						<label>Bio:</label>
						<textarea
							name="bio"
							placeholder="Whatever!"
							value={tempProfile.bio}
							onChange={handleChange}
							/>
					</div>
					<div className="match-history">
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
									{/* Afficher les matchs */}
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
					</div>
					<div className="button-container">
						<button className="button-save" onClick={handleSave}>Save</button>
						<button className="button-cancel" onClick={handleCancel}>Cancel</button>
					</div>
				</div>
			</div>
		</div>
	);
}
