"use server";

import { cookies } from "next/headers";
// import { fetchGenericAPIResponses } from "./generalActions";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

type LoginProps = {
	email: string;
	pass: string;
	otp?: string;
};

export const login = async ({ email, pass, otp }: LoginProps) => {
	const requestData = {
		username: email,
		password: pass,
		otp: otp,
	};

	const response = await fetchWithAgent(
		`${process.env.NEXT_PUBLIC_API_URL}/token/`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		},
	);

	let data;

	if (response && !response.ok) {
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
		return {
			ok: false,
			error: errorMessage,
		};
	} else {
		data = await response.json();

		if (data.otp_required) {
			return {
				ok: true,
				otp_required: true,
				user_id: data.user_id,
				email: data.email,
				message: data.message,
			};
		}

		const accessToken = data.access;
		const refreshToken = data.refresh;

		// Decode token to get expiry time (JWT payload is base64 encoded)
		const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
		const expiresAt = tokenPayload.exp * 1000; // Convert to milliseconds

		const cookieStore = await cookies();

		cookieStore.set("accessToken", accessToken);
		cookieStore.set("refreshToken", refreshToken);
		cookieStore.set("tokenExpiry", expiresAt.toString());

		return {
			ok: true,
			message: "Login successful! Redirecting...",
		};
	}
};

export async function backendLogout() {
	try {
		const cookieStore = await cookies();

		cookieStore.delete("accessToken");
		cookieStore.delete("refreshToken");
		cookieStore.delete("tokenExpiry");

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/logout/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (response && response.ok) console.log("Logout successful");
		else console.warn("Logout unsuccessful");

		return response.ok;
	} catch (error) {
		console.warn("Error: issue while logging out", error);
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
	const response = await fetchWithAgent(
		`${process.env.NEXT_PUBLIC_API_URL}/register/`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		},
	);

	let data;

	if (response && !response.ok) {
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
		return {
			ok: false,
			error: errorMessage,
		};
	} else {
		return {
			ok: true,
			message: "Registration successful! Redirecting...",
			data: await response.json(),
		};
	}
};
