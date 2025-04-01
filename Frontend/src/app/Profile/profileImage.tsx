import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateUserProfileImage } from "../utilities/profileClientActions";
import { UserProfileData } from "../utilities/profileActions";

export default function ProfileImage({
	userProfile,
	setUserProfile,
	setAlert,
}: {
	userProfile: UserProfileData | null;
	setUserProfile: (profileData: UserProfileData) => void;
	setAlert: (alertMessage: { message: string; type: string } | null) => void;
}) {
	const [loading, setLoading] = useState(false);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const maxSize = 2 * 1024 * 1024; // 2MB in bytes
		if (file.size > maxSize) {
			setAlert({ message: "File size must be under 2MB.", type: "danger" });
			return;
		}

		const formData = new FormData();
		formData.append("profile_picture", file);

		try {
			setLoading(true);
			const response = await updateUserProfileImage(formData);

			const data = await response.json();
			console.log("Updated image response:", data.profile_picture);

			if (response.ok) {
				setUserProfile({
					...userProfile,
					profile_picture: data.profile_picture,
				});
				setAlert({
					message: "Profile picture updated successfully!",
					type: "success",
				});
			}
		} catch (error) {
			setAlert({
				message: "Failed to update profile picture:",
				type: "danger",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="image-wrapper">
				<div className="relative">
					<img
						src={
							userProfile?.profile_picture
								? `/api/${userProfile.profile_picture}`
								: "/img/default.png"
						} // Fallback to default image
						alt="Profile Picture"
						className="profile-picture"
					/>

					<label
						htmlFor="file-input"
						className="label-file-input"
					>
						<Pencil className="label-file-input svg" />
					</label>

					<input
						id="file-input"
						type="file"
						accept="image/png, image/jpeg, image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					{loading && (
						<div className="uploading-overlay">
							Uploading...
						</div>
					)}
				</div>
			</div>
		</>
	);
}
