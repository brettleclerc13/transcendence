import React, { useEffect, useState } from "react";
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

export default function Profile() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [tempProfile, setTempProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);

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
					{/* match history */}
					{/* w/l wheel */}
					<div className="button-container">
						<button className="button-save" onClick={handleSave}>Save</button>
						<button className="button-cancel" onClick={handleCancel}>Cancel</button>
					</div>
				</div>
			</div>
		</div>
	);
}
