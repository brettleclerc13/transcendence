import React, { useState } from "react";
import "./profile.css";

export default function Profile() {
const [profile, setProfile] = useState({
	picture: "./img/default.png",
	username: "",
	email: "",
	age: "",
	nationality: "",
	tournamentName: "",
	bio: "Whatever!",
});

const [tempProfile, setTempProfile] = useState({...profile});

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prevTempProfile) => ({
      ...prevTempProfile,
      [name]: value,
    }));
};

const handleSave = () => {
	setProfile(tempProfile);
 	// appel API pour sauvegarder les changements
	console.log("Saved profile data:", profile);
};

const handleCancel = () => {
	setTempProfile(profile);
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
