"use client";

import { jwtDecode } from "jwt-decode";
import { getCookie } from "cookies-next/client";

export const isUserLoggedIn = () => {
	const accessToken = getCookie("accessToken");
	const refreshToken = getCookie("refreshToken");

	if (!accessToken || !refreshToken) {
		console.log("Haven't found tokens in document");
		return false;
	}

	try {
		const decodedAccessToken = jwtDecode(accessToken);
		const decodedRefreshToken = jwtDecode(refreshToken);

		if (!decodedAccessToken || !decodedRefreshToken) return false;

		const currentTime = Math.floor(Date.now() / 1000); // current time in seconds

		// Check if tokens have expired
		if (
			(decodedAccessToken as { exp: number }).exp > currentTime &&
			(decodedRefreshToken as { exp: number }).exp > currentTime
		)
			return true;
		else return false;
	} catch (error) {
		console.warn("Error decoding refresh token:", error);
		return false;
	}
};
