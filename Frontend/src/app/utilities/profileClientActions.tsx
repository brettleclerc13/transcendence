"use client";

import { getCookie } from "cookies-next/client";
import { fetchGenericAPIResponses } from "./generalActions";

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

		const result = await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to update profile image.",
				successMessage: "User profile image updated successfully",
			},
		});

		if (result.ok) return response;
		else throw new Error(String(result.error));
	} catch (error) {
		throw new Error(String(error) || "Failed to update profile image.");
	}
};
