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

		const data = await response.json();

		if (!response.ok) {
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch user's profile info.";
			throw new Error(errorMessage);
		}

		return data;

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
		picture?: string;
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

		const data = await response.json();

		if (!response.ok) {
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to update profile.";
			throw new Error(errorMessage);
		}

		console.log("User profile updated successfully. is_online: ", profileData.profile?.is_online);
		return data;

	} catch (error) {
		console.error("updateUserProfileError: ", error);
		throw new Error(String(error) || "Failed to update profile.");
	}
};
