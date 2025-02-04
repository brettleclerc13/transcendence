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
		console.error("fetchUserProfileError: ", error);
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};
