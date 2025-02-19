import { jwtDecode } from "jwt-decode";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const isUserLoggedIn = () => {
	const accessToken = localStorage.getItem("accessToken");
	const refreshToken = localStorage.getItem("refreshToken");

	if (!accessToken || !refreshToken) return false;

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
};

type LoginProps = {
	email: string;
	pass: string;
};

export const login = async ({ email, pass }: LoginProps) => {
	const requestData = {
		username: email,
		password: pass,
	};

	const response = await fetch("/api/token/", {
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

		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);
		localStorage.setItem("tokenExpiry", expiresAt.toString());

		return data;
	}
};

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

		if (response.ok) console.log("Logout successful");
		else console.error("Logout unsuccessful");

		setTimeout(() => {
			router.push("/");
		}, 1000);
	} catch (error) {
		console.error("Error: issue while logging out", error);
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
	const response = await fetch("/api/register/", {
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
			data.non_field_errors?.[0] || // First item in non_field_errors array
			data.message || // Fallback to a generic message
			data.detail || // Another common key for error messages
			"Failed to register user.";
		throw new Error(errorMessage);
	} else {
		return await response.json();
	}
};
