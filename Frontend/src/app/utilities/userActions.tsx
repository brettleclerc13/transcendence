"use server";

import { cookies } from "next/headers";

type LoginProps = {
	email: string;
	pass: string;
};

export const login = async ({ email, pass }: LoginProps) => {
	const requestData = {
		username: email,
		password: pass,
	};
	const response = await fetch("http://backend:8001/token/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestData),
	});

	let data;

	if (!response.ok) {
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		const errorMessage =
			data.error ||
			data.non_field_errors?.[0] || // First item in non_field_errors array
			data.message || // Fallback to a generic message
			data.detail || // Another common key for error messages
			"Failed to login user.";
		throw new Error(errorMessage);
	} else {
		data = await response.json();

		const accessToken = data.access;
		const refreshToken = data.refresh;

		// Decode token to get expiry time (JWT payload is base64 encoded)
		const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
		const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds

		const cookieStore = await cookies();

		cookieStore.set("accessToken", accessToken);
		cookieStore.set("refreshToken", refreshToken);
		cookieStore.set("tokenExpiry", expiresAt.toString());

		return data;
	}
};

export async function backendLogout() {
	try {
		const cookieStore = await cookies();

		cookieStore.delete("accessToken");
		cookieStore.delete("refreshToken");
		cookieStore.delete("tokenExpiry");

		const response = await fetch("http://backend:8001/logout/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (response.ok) console.log("Logout successful");
		else console.error("Logout unsuccessful");

		return response.ok;
	} catch (error) {
		console.error("Error: issue while logging out", error);
		return false;
	}
}

type RegisterProps = {
	email: string;
	username: string;
	password: string;
	profile: {
		age?: number | undefined;
		nationality?: string | undefined;
		bio?: string | undefined;
		is_online: boolean;
	};
};

export const register = async (requestData: RegisterProps) => {
	const response = await fetch("http://backend:8001/register/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestData),
	});

	let data;

	if (!response.ok) {
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		const errorMessage =
			data.email?.[0] || // First error message related to email
			data.username?.[0] || // First error message related to username
			data.error ||
			data.non_field_errors?.[0] || // First item in non_field_errors array
			data.message || // Fallback to a generic message
			data.detail || // Another common key for error messages
			"Failed to register user.";
		throw new Error(errorMessage);
	} else {
		return await response.json();
	}
};
