"use server";

import { fetchWithAgent } from "@/lib/fetchWithAgent";
import { cookies } from "next/headers";

export const refreshAccessToken = async () => {
	const cookieStore = await cookies();
	const refreshToken = cookieStore.get("refreshToken")?.value;
	if (!refreshToken) return;

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refresh: refreshToken }),
			},
		);

		let data;

		if (response && !response.ok) {
			cookieStore.delete("accessToken");
			cookieStore.delete("refreshToken");
			cookieStore.delete("tokenExpiry");

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
				"Failed to refresh JWT access token.";
			if (errorMessage === "User does not exist") {
				console.warn(
					"Refresh token refers to a non-existent user. Removing tokens ...",
				);
				return { ok: false };
			} else {
				throw new Error(errorMessage);
			}
		} else {
			const data = await response.json();

			const newAccessToken = data.access;
			const tokenPayload = JSON.parse(atob(newAccessToken.split(".")[1]));
			const newExpiresAt = tokenPayload.exp * 1000;

			cookieStore.set("accessToken", newAccessToken);
			cookieStore.set("tokenExpiry", newExpiresAt.toString());
			console.log("Access token refreshed");
			return { ok: true };
		}
	} catch (error) {
		console.log("Error refreshing access token", error);
		return { ok: false };
	}
};
