import { useState } from "react";
import { updateUserProfileImage } from "../utilities/profileActions";
import { UserProfileData } from "../utilities/profileActions";

export default function ProfileImage({
	userProfile,
	setUserProfile,
	setAlert,
}: {
	userProfile: UserProfileData | null;
	setUserProfile: (profileData: UserProfileData) => void;
	setAlert: (
		alertMessage: { message: string; type: "danger" | "success" } | null,
	) => void;
}) {
	const [loading, setLoading] = useState(false);

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Size validation
		const maxSize = 2 * 1024 * 1024; // 2MB in bytes
		if (file.size > maxSize) {
			setAlert({ message: "File size must be under 2MB.", type: "danger" });
			return;
		}

		const validImageTypes = [
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/webp",
		];
		if (!validImageTypes.includes(file.type)) {
			setAlert({
				message: "Only PNG, JPEG, and WebP images are allowed.",
				type: "danger",
			});
			return;
		}

		// Additional validation - check file signature
		try {
			// Read the first few bytes to check file signature
			const fileReader = new FileReader();
			fileReader.onloadend = async (e) => {
				const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(
					0,
					4,
				);
				let header = "";
				for (let i = 0; i < arr.length; i++) {
					header += arr[i].toString(16);
				}

				// Check file signatures
				// PNG: 89504e47
				// JPEG: ffd8ffe0, ffd8ffe1, ffd8ffe2
				// WebP: 52494646 (RIFF)
				const isPNG = header.startsWith("89504e47");
				const isJPEG = header.startsWith("ffd8ffe");
				const isWebP = header.startsWith("52494646"); // WebP files start with RIFF

				const fileExtension = file.name.split(".").pop()?.toLowerCase();
				const validExtensions = ["png", "jpg", "jpeg", "webp"];
				const hasValidExtension = validExtensions.includes(fileExtension || "");

				if (!(isPNG || isJPEG || isWebP) || !hasValidExtension) {
					setAlert({
						message:
							"Invalid image format. Please upload a valid PNG, JPEG, or WebP image.",
						type: "danger",
					});
					return;
				}

				// If all validations pass, proceed with upload
				const formData = new FormData();
				formData.append("profile_picture", file);

				setLoading(true);
				const response = await updateUserProfileImage(formData);

				if (response && response.ok && "data" in response) {
					setUserProfile({
						...userProfile,
						profile_picture: response.data.profile_picture,
					});
					setAlert({
						message: "Profile picture updated successfully!",
						type: "success",
					});
				} else {
					setAlert({
						message: response.error || "Failed to update profile picture.",
						type: "danger",
					});
				}
				setLoading(false);
			};
			fileReader.readAsArrayBuffer(file.slice(0, 4));
		} catch (error) {
			setAlert({
				message: "Error validating file. Please try again.",
				type: "danger",
			});
			setLoading(false);
		}
	};

	return (
		<>
			<div className="image-wrapper">
				<div className="image-subwrapper">
					<img
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
						accept="image/png, image/jpeg, image/jpeg, image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					{loading && <div className="uploading-overlay">Uploading...</div>}
				</div>
			</div>
		</>
	);
}
