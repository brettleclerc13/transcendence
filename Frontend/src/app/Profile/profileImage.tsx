import { useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { updateUserProfileImage } from "../utilities/profileActions";

export default function ProfileImage ({ profilePicture }: { profilePicture: string }) {
	const [image, setImage] = useState(profilePicture);
	const [loading, setLoading] = useState(false);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("profile_picture", file);

		try {
			setLoading(true);
			const response = await updateUserProfileImage(formData);
	
			if (response.ok) {
				setImage(URL.createObjectURL(file)); // Show preview immediately
			}
		} catch (error) {
		  console.error("Failed to update profile picture:", error);
		} finally {
		  setLoading(false);
		}
	};

	return (
		<div className="relative w-32 h-32">
			<Image
				src={image} // Fallback to default image
				alt="Profile Picture"
				width={128}
				height={128}
				className="rounded-full object-cover w-32 h-32 border border-gray-300"
			/>

			<label htmlFor="file-input" className="absolute bottom-1 right-1 bg-black/70 p-2 rounded-full cursor-pointer">
				<Pencil className="text-white w-4 h-4" />
			</label>

			<input
				id="file-input"
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>

			{loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">Uploading...</div>}
		</div>
	);
}
