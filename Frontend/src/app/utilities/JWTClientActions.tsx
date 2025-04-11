"use client";

import { useEffect } from "react";
import { getCookie } from "cookies-next/client";
import { refreshAccessToken } from "./JWTActions";

export default function RefreshAccessToken() {
	useEffect(() => {
		startTokenRefresh();
	}, []);

	return <></>;
}

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
