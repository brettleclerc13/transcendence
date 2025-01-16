"use client"

import { jwtDecode } from "jwt-decode";

export const isUserLoggedIn = () => {
	const token = localStorage.getItem("accessToken");
	
    if (!token) return false;
	
    try {
		const decoded = jwtDecode(token) as { exp : number};
        const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
		
        // Check if token has expired
        return decoded.exp > currentTime;
    } catch (error) {
		console.error("Token decoding error:", error);
        return false;
    }
}

type loginProps = {
	email: string,
	pass: string,
}

export const login = async ( { email, pass } : loginProps ) => {
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
		localStorage.setItem('accessToken', data.access);
		localStorage.setItem('refreshToken', data.refresh);
		return data;
	} else {
		const errorMessage =
			data.non_field_errors?.[0] || // First item in non_field_errors array
			data.message || // Fallback to a generic message
			data.detail || // Another common key for error messages
			"Login failed";
		throw new Error(errorMessage || "Login failed");
	}
}

type registerProps = {
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

export const register = async ( requestData : registerProps ) => {
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
			"Registration failed";
		throw new Error(errorMessage || "Registration failed"); 
	} else {
		return data;
	}
}

type UserProfile = {
    username: string;
    profilePicture: string;
    is_online: boolean;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
	try {
		const token = localStorage.getItem('accessToken');
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {	
			method: 'GET',
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Profile API Error:", errorText);
			throw new Error(`HTTP Error: ${response.status}`);
		}

		return await response.json();

	} catch (error) {
		console.error("fetUserProfileError: ", error);
		return { username: '', profilePicture: '', is_online: false };
	}
}

export const logout = async () => {
	try {
		localStorage.removeItem("accessToken");

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
			window.location.href = "/";
		}, 1000);

	} catch (error) {
		console.error("Error: issue while logging out", error);
	}
}

// if (!response.ok) {
// 	const errorText = await response.text();
// 	if (response.status >= 400 && response.status < 500) {
// 	  throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
// 	} else {
// 	  throw new Error(`HTTP Error: ${response.status}`);
// 	}
// }