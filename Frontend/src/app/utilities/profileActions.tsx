"use server";

import { cookies } from "next/headers";
import {
	fetchGenericAPIResponses,
	fetchAPIResponseData,
} from "./generalActions";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

export type UserProfileData = {
	id?: number;
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
	has_2fa?: boolean;
};

export const fetchUserProfile = async () => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/profile/`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to fetch user's profile info.",
				successMessage: "Successfully fetched user's profile info",
			},
		});

		if (result.ok) return result.data;
		else throw new Error(String(result.error));
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};

export const updateUserProfile = async (profileData: UserProfileData) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/profile/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(profileData),
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to update profile.",
				successMessage: "User profile updated successfully",
			},
		});
	} catch (error) {
		console.warn("updateUserProfileError: ", error);
		return {
			ok: false,
			error: (error as Error).message || "Failed to update profile.",
		};
	}
};

export const fetchUserPublicProfile = async (username: string) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/public_profile/?username=${username}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to fetch user's public profile info.",
				successMessage: "Successfully fetched user's public profile info",
			},
		});

		if (result.ok) return result.data;
		else throw new Error(String(result.error));
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch user profile.");
	}
};

export const fetchQrCode = async () => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/2fa/generate_qr/`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to generate QR Code.",
				successMessage: "QR Code image generation successful",
			},
		});

		if (result.ok)
			return {
				ok: true,
				message: result.message,
				qr_code: result.data.qr_code,
			};
		else
			return {
				ok: false,
				error: result.error,
			};
	} catch (error) {
		console.warn("QR Code generation error: ", error);
		return {
			ok: false,
			error: (error as Error).message || "Failed to generate QR Code.",
		};
	}
};

export const enable2FA = async (otpData: { otp: string }) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/2fa/enable/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(otpData),
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to enable 2FA.",
				successMessage: "2FA enabled successfully",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to verify 2FA OTP.",
		};
	}
};

export const disable2FA = async (otpData: { otp: string }) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/2fa/disable/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(otpData),
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to disable 2FA.",
				successMessage: "2FA disabled successfully",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to disable 2FA.",
		};
	}
};

export const verifyOTP = async (otpData: { otp: number }) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/2fa/verify/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(otpData),
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to verify 2FA OTP.",
				successMessage: "2FA verification successful",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to verify 2FA OTP.",
		};
	}
};

export const checkTwoFactorActivation = async () => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/2fa/check/`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to check if 2FA is active.",
				successMessage: "2FA activation check successful",
			},
		});

		if (result && result.ok)
			return {
				ok: true,
				message: result.message,
				has_2fa: result.data.has_2fa,
			};
		else
			return {
				ok: false,
				error: result.error,
			};
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to check if 2FA is active.",
		};
	}
};

export const updateUserProfileImage = async (formData: FormData) => {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("accessToken")?.value;
		if (!token) {
			return {
				ok: false,
				error: "Access token missing",
			};
		}

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/profile/`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			},
		);

		return await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to update profile image.",
				successMessage: "User profile image updated successfully",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to update profile image.",
		};
	}
};
