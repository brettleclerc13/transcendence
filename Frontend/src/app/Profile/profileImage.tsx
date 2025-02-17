import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateUserProfileImage } from "../utilities/profileActions";
import { UserProfileData } from "../utilities/profileActions";

export default function ProfileImage ({
	userProfile,
	setUserProfile
}: {
	userProfile: UserProfileData | null;
	setUserProfile: (profileData : UserProfileData) => void
}) {
	const [loading, setLoading] = useState(false);
	const [showAlert, setShowAlert] = useState(false);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("profile_picture", file);

		try {
			setLoading(true);
			const response = await updateUserProfileImage(formData);

			const data = await response.json();
			console.log("Updated image response:", data.profile_picture);
	
			if (response.ok) {
				setUserProfile({ ...userProfile, profile_picture: data.profile_picture });
				setShowAlert(true);
			}
		} catch (error) {
		  console.error("Failed to update profile picture:", error);
		} finally {
			setLoading(false);
			// setTimeout(() => {
			// 	setShowAlert(false);
			// }, 4000);
		}
	};

	return (
		<>
			<div className="image-wrapper">
				<div className="relative w-32 h-32">
					<img
						src={`/api/${userProfile?.profile_picture}` || "/img/default.png"} // Fallback to default image
						alt="Profile Picture"
						className="profile-picture"
					/>

					<label htmlFor="file-input" className="absolute bottom-1 right-1 bg-black/70 p-2 rounded-full cursor-pointer">
						<Pencil className="text-white w-4 h-4" />
					</label>

					<input
						id="file-input"
						type="file"
						accept="image/png, image/jpeg, image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					{loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">Uploading...</div>}
				</div>
				{showAlert && (
					<div className="alert alert-success alert-dismissible fade show" role="alert">
						Profile picture updated successfully!
						<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
					</div>
				)}
			</div>
		</>
	);
}
