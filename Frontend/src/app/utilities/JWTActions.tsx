"use client";

import { useEffect } from "react";
import { setCookie, deleteCookie, getCookie } from "cookies-next/client";

export default function RefreshAccessToken() {
	useEffect(() => {
		startTokenRefresh();
	}, []);

	return <></>;
}

export const refreshAccessToken = async () => {
	const refreshToken = getCookie("refreshToken");
	if (!refreshToken) return;

	try {
		const response = await fetch("/api/token/refresh/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh: refreshToken }),
		});

		let data;

		if (response && !response.ok) {
			deleteCookie("accessToken");
			deleteCookie("refreshToken");
			deleteCookie("tokenExpiry");

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
					"Refresh token refers to a non-existent user. Removing tokens ..."
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

			setCookie("accessToken", newAccessToken);
			setCookie("tokenExpiry", newExpiresAt.toString());
			console.log("Access token refreshed");
			return { ok: true };
		}
	} catch (error) {
		console.log("Error refreshing access token", error);
		return { ok: false };
	}
};

export const startTokenRefresh = async () => {
	const checkInterval = 30 * 1000; // Check every 30 secs

	setInterval(async () => {
		const accessToken = getCookie("accessToken");
		const tokenExpiry = getCookie("tokenExpiry");

		if (!accessToken || !tokenExpiry) {
			console.log("❌ No access token found, skipping refresh check");
			return;
		} else {
			const expiresIn = parseInt(tokenExpiry) - Date.now();
			console.log(`⏳ Access token expires in: ${expiresIn / 1000} seconds`);

			if (expiresIn < 2 * 60 * 1000) {
				console.log("🔄 Refreshing access token...");
				await refreshAccessToken();
			}
		}
	}, checkInterval);
};
