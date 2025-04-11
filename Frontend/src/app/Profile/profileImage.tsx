import { useState } from "react";
import Image from "next/image";
import { updateUserProfileImage } from "../utilities/profileClientActions";
import { UserProfileData } from "../utilities/profileActions";

export default function ProfileImage({
	userProfile,
	setUserProfile,
	setAlert,
}: {
	userProfile: UserProfileData | null;
	setUserProfile: (profileData: UserProfileData) => void;
	setAlert: (
		alertMessage: { message: string; type: "danger" | "success" } | null
	) => void;
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

			if (response && response.ok) {
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
				message: `Failed to update profile picture:, ${error}`,
				type: "danger",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="image-wrapper">
				<div className="image-subwrapper">
					<Image
						src={
							userProfile?.profile_picture
								? `/api/${userProfile.profile_picture}`
								: "/img/default.png"
						} // Fallback to default image
						
						alt="Profile Picture"
						className="profile-picture"
					/>

					<label htmlFor="file-input" className="label-file-input">
						<div className="pencil">
							<svg
								fill="#FFFFFF"
								version="1.1"
								id="Capa_1"
								xmlns="http://www.w3.org/2000/svg"
								xmlnsXlink="http://www.w3.org/1999/xlink"
								viewBox="0 0 306.637 306.637"
								xmlSpace="preserve"
								stroke="#FFFFFF"
							>
								<g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
								<g
									id="SVGRepo_tracerCarrier"
									strokeLinecap="round"
									strokeLinejoin="round"
								></g>
								<g id="SVGRepo_iconCarrier">
									{" "}
									<g>
										{" "}
										<g>
											{" "}
											<path d="M12.809,238.52L0,306.637l68.118-12.809l184.277-184.277l-55.309-55.309L12.809,238.52z M60.79,279.943l-41.992,7.896 l7.896-41.992L197.086,75.455l34.096,34.096L60.79,279.943z"></path>{" "}
											<path d="M251.329,0l-41.507,41.507l55.308,55.308l41.507-41.507L251.329,0z M231.035,41.507l20.294-20.294l34.095,34.095 L265.13,75.602L231.035,41.507z"></path>{" "}
										</g>{" "}
										<g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{" "}
										<g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{" "}
										<g> </g> <g> </g> <g> </g>{" "}
									</g>{" "}
								</g>
							</svg>
						</div>
					</label>

					<input
						id="file-input"
						type="file"
						accept="image/png, image/jpeg, image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					{loading && <div className="uploading-overlay">Uploading...</div>}
				</div>
			</div>
		</>
	);
}
