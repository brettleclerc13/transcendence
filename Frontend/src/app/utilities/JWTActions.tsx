"use client";

import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { logout } from "./userActions";
import { createContext } from "react";

export const AuthContext = createContext({});

const refreshAccessToken = async (router: AppRouterInstance) => {
	const refreshToken = localStorage.getItem("refreshToken");
	if (!refreshToken) return;

	try {
		const response = await fetch("/api/token/refresh/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh: refreshToken }),
		});

		let data;

		if (!response.ok) {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(`Unexpected response: ${response.status}`);
			}

			if (data.non_field_errors?.[0] === "User does not exist") {
				console.warn(
					"Refresh token refers to a non-existent user. Logging out..."
				);
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("accessToken");
				localStorage.removeItem("tokenExpiry");
				return;
			}

			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to refresh JWT access token.";
			throw new Error(errorMessage);
		} else {
			const data = await response.json();

			const newAccessToken = data.access;
			const tokenPayload = JSON.parse(atob(newAccessToken.split(".")[1]));
			const newExpiresAt = tokenPayload.exp * 1000;

			localStorage.setItem("accessToken", newAccessToken);
			localStorage.setItem("tokenExpiry", newExpiresAt.toString());
			console.log("Access token refreshed");
		}
	} catch (error) {
		console.log("Error refreshing access token", error);
		return;
	}
};

const startTokenRefresh = (router: AppRouterInstance) => {
	const checkInterval = 30 * 1000; // Check every 30 secs

	setInterval(async () => {
		const accessToken = localStorage.getItem("accessToken");
		const tokenExpiry = localStorage.getItem("tokenExpiry");

		if (!accessToken || !tokenExpiry) {
			console.log("❌ No access token found, skipping refresh check");
			return;
		} else {
			const expiresIn = parseInt(tokenExpiry) - Date.now();
			console.log(`⏳ Access token expires in: ${expiresIn / 1000} seconds`);

			if (expiresIn < 2 * 60 * 1000) {
				console.log("🔄 Refreshing access token...");
				await refreshAccessToken(router);
			}
		}
	}, checkInterval);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const router = useRouter();

	useEffect(() => {
		startTokenRefresh(router);
	}, [router]);

	return (
		<AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
	);
};
