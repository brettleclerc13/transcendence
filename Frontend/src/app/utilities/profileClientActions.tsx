"use client";

import { getCookie } from "cookies-next/client";

export const updateUserProfileImage = async (formData: FormData) => {
	try {
		const token = getCookie("accessToken");
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
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
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to update profile image.";
			throw new Error(errorMessage);
		} else {
			return response;
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to update profile image.");
	}
};
