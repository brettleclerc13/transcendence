export const fetchUserProfile = async () => {
	try {
		const token = localStorage.getItem('accessToken');
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		let data;

		if (!response.ok) {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`Unexpected response: ${response.status}`);
			}
	
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch user's profile info.";
			throw new Error(errorMessage);
		} else {
			data = await response.json();
			return data;
		}

	} catch (error) {
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};

export type UserProfileUpdate = {
    email?: string;
    username?: string;
    password?: string;
    profile?: {
        age?: number;
        nationality?: string;
        bio?: string;
        is_online?: boolean;
		profile_picture?: string | null;
		tournamentName?: string;
    };
};

export const updateUserProfile = async (profileData: UserProfileUpdate) => {
	try {
		const token = localStorage.getItem('accessToken');
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(profileData),
		});

		let data;

		if (!response.ok) {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`Unexpected response: ${response.status}`);
			}
	
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to update profile.";
			throw new Error(errorMessage);
		} else {
			data = await response.json();
			console.log("User profile updated successfully. is_online: ", profileData.profile?.is_online);
			return data;
		}

	} catch (error) {
		console.error("updateUserProfileError: ", error);
		throw new Error(String(error) || "Failed to update profile.");
	}
};

export const updateUserProfileImage = async ( formData : FormData ) => {
	try {
		const token = localStorage.getItem('accessToken');
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`
			},
			body: formData,
		});

		let data;

		if (!response.ok) {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`Unexpected response: ${response.status}`);
			}
	
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to update profile image.";
			throw new Error(errorMessage);
		} else {
			console.log("User profile image successfully changed");
			return response;
		}

	} catch (error) {
		console.error("updateUserProfileImageError: ", error);
		throw new Error(String(error) || "Failed to update profile image.");
	}
}
