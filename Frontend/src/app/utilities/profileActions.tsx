"use server";

import { cookies } from "next/headers";

export type UserProfileData = {
	email?: string;
	username?: string;
	age?: number;
	nationality?: string;
	bio?: string;
	is_online?: boolean;
	profile_picture?: string | null;
	tournament_name?: string;
	old_password?: string;
	new_password?: string;
};

export const fetchUserProfile = async () => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) throw new Error("Access token missing");

		const response = await fetch("http://backend:8001/profile/", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		let data;
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch user's profile info.";
			throw new Error(errorMessage);
		} else {
			return data;
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};

export const updateUserProfile = async (profileData: UserProfileData) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) throw new Error("Access token missing");

		const response = await fetch("http://backend:8001/profile/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(profileData),
		});

		let data;
		const text = await response.text();

		console.log("User update TEXT:", text);
		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to update profile.";
			throw new Error(errorMessage);
		} else {
			return {
				ok: true,
				message: data.message || "User profile updated successfully",
			};
		}
	} catch (error) {
		console.warn("updateUserProfileError: ", error);
		return {
			ok: false,
			error: (error as Error).message || "Failed to update profile.",
		};
	}
};

export const fetchUserPublicProfile = async ( username : string ) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) throw new Error("Access token missing");

		const response = await fetch(`http://backend:8001/public_profile/?username=${username}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		console.log("Response: ", response);

		let data;
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch user's profile info.";
			throw new Error(errorMessage);
		} else {
			console.log("data: ", data);
			return data;
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};