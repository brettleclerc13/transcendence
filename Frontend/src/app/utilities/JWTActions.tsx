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

		const data = await response.json();
		if (response.ok) {
			const newAccessToken = data.access;
			const tokenPayload = JSON.parse(atob(newAccessToken.split(".")[1]));
			const newExpiresAt = tokenPayload.exp * 1000;

			localStorage.setItem("accessToken", newAccessToken);
			localStorage.setItem("tokenExpiry", newExpiresAt.toString());
			console.log("Access token refreshed");
		} else {
			logout(router); //instead of going back to homepage, just return null
		}
	} catch (error) {
		console.error("Error refreshing access token", error);
		logout(router); //instead of going back to homepage, just return null
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
		}

		const expiresIn = parseInt(tokenExpiry) - Date.now();
		console.log(`⏳ Access token expires in: ${expiresIn / 1000} seconds`);

		if (expiresIn < 2 * 60 * 1000) {
			console.log("🔄 Refreshing access token...");
			await refreshAccessToken(router);
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
