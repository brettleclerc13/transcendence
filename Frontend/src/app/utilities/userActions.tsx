"use client"

import { jwtDecode } from "jwt-decode";
import { useRouter } from 'next/navigation';
import { useEffect, createContext, ReactNode } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const AuthContext = createContext({});

export const isUserLoggedIn = () => {
	const accessToken = localStorage.getItem("accessToken");
	const refreshToken = localStorage.getItem("refreshToken");
	
    if (!accessToken || !refreshToken) 
		return false;
	
	const decodedAccessToken = jwtDecode(accessToken);
	const decodedRefreshToken = jwtDecode(refreshToken);

	if (!decodedAccessToken || !decodedRefreshToken)
		return false;

	const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
	
	// Check if tokens have expired
	if ((decodedAccessToken as { exp : number}).exp > currentTime && (decodedRefreshToken as { exp : number}).exp > currentTime)
		return true;
	else
		return false;
}

type LoginProps = {
	email: string,
	pass: string,
}

export const login = async ( { email, pass } : LoginProps ) => {
	const requestData = {
		username: email,
		password: pass,
	};
	
	const response = await fetch("/api/token/", {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestData),
	});
	
	const data = await response.json();

	if (response.ok) {
		const accessToken = data.access;
		const refreshToken = data.refresh;

		// Decode token to get expiry time (JWT payload is base64 encoded)
		const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
		const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds

		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		localStorage.setItem("tokenExpiry", expiresAt.toString());

		return data;
	} else {
		const errorMessage =
			data.non_field_errors?.[0] || // First item in non_field_errors array
			data.message || // Fallback to a generic message
			data.detail || // Another common key for error messages
			"Login failed";
		throw new Error(errorMessage);
	}
}

export async function logout(router: AppRouterInstance) {
	try {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("tokenExpiry");

		const response = await fetch("/api/logout/", {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			},
		});

		if (response.ok)
			console.log("Logout successful");
		else
			console.error("Logout unsuccessful");

		setTimeout(() => {
			router.push("/");
		}, 1000);

	} catch (error) {
		console.error("Error: issue while logging out", error);
	}
}

const refreshAccessToken = async ( router : AppRouterInstance ) => {

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
			console.error("Failed to refresh access token");
			logout(router);
		}
	} catch (error) {
		console.error("Error refreshing access token", error);
		logout(router);
	}
};

const startTokenRefresh = ( router : AppRouterInstance ) => {
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

	return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
};


type RegisterProps = {
	email: string,
	username: string,
	password: string,
	profile: {
		age?: number | undefined,
		nationality?: string | undefined,
		bio?: string | undefined,
		is_online: boolean
	}
}

export const register = async ( requestData : RegisterProps ) => {
	const response = await fetch("/api/register/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestData),
	});

	const data = await response.json();

	if (!response.ok) {
		const errorMessage =
			data.email?.[0] || // Email error
			data.username?.[0] || // Username error
			data.non_field_errors?.[0] || // Other validation error
			console.log(data.non_field_errors?.[0]);
			"Registration failed";
			console.log("Error message: ", errorMessage);
		throw new Error(errorMessage); 
	} else {
		return data;
	}
}
