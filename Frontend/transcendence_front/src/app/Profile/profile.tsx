import React, { useState } from "react";
import "./profile.css";

export default function Profile {
const [profile, setProfile] = useState({
	picture: "./img/default.png",
	username: "",
	email: "",
	age: "",
	nationality: "",
	tournamentName: "",
	bio: "Whatever!",
});
//prend les valeurs de l'utilisateur grace a la base de donnee

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

const handleSave = () => {
 	// appel API pour sauvegarder les changements
	console.log("Saved profile data:", profile);
};

	return (
		<div className="contour-informations">
			<div className="left-informations">
				<img src={profile.picture} alt='Profile Picture' className='profile-picture' />
				<div>
					<label>Username:</label>
					<input 
						type="text"
						name="username"
						value={profile.username}
						onChange={handleChange}
					/>
				</div>
				<div>
					<label>Email:</label>
					<input 
						type="email"
						name="email"
						value={profile.email}
						onChange={handleChange}
					/>
				</div>
				<div>
					<label>Age:</label>
					<input 
						type="number"
						name="age"
						value={profile.age}
						onChange={handleChange}
					/>
				</div>
				<div>
					<label>Nationality:</label>
					<input 
						type="text"
						name="nationality"
						value={profile.nationality}
						onChange={handleChange}
					/>
				</div>
				<div>
					<label>Tournament Name:</label>
					<input 
						type="text"
						name="tournamentName"
						value={profile.tournamentName}
						onChange={handleChange}
					/>
				</div>
			</div>
			<div className="right-informations">
				<div>
					<label>Bio:</label>
					<textarea 
						name="bio"
						value={profile.bio}
						onChange={handleChange}
					/>
				</div>
				{/* match history */}
				{/* w/l wheel */}
			</div>
			<button onClick={handleSave}>Save Changes</button>
		</div>
	);
}
