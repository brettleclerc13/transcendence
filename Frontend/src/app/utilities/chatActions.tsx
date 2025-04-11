"use server";

import { fail } from "assert";
import { cookies } from "next/headers";

type ApiResponse<T = any> =
	| { status: true; data?: T }
	| { status: "warning"; message: string }
	| { status: false; error: string };

const getToken = async () => {
	const cookieStore = await cookies();
	return cookieStore.get("accessToken")?.value;
};

const handleResponse = async <T = any,>(
	response: Response
): Promise<ApiResponse<T>> => {
	const text = await response.text();
	let data = null;

	if (!text && response.ok) {
		return { status: true };
	}

	try {
		data = JSON.parse(text);
	} catch {
		return {
			status: false,
			error: `Unexpected response: ${response.status} - ${text}`,
		};
	}

	if (!response.ok) {
		const errorMessage =
			data?.error ||
			data?.non_field_errors?.[0] ||
			data?.message ||
			data?.detail ||
			"An unexpected error occurred.";
		return { status: false, error: errorMessage };
	}

	if (data?.warning) {
		return { status: "warning", message: data.warning };
	}

	return { status: true, data };
};

export const SearchFriend = async (
	searchValue: string
): Promise<ApiResponse<any[]>> => {
	try {
		const response = await fetch(
			`https://backend:8001/search/?query=${searchValue}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		return await handleResponse(response);
	} catch (error: any) {
		return {
			status: false,
			error: error.message || "An unexpected error occurred.",
		};
	}
};

export const FetchFriends = async (): Promise<ApiResponse<any[]>> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetch("https://backend:8001/friends/", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return await handleResponse(response);
	} catch (error: any) {
		return { status: false, error: error.message || "Network error (friends)" };
	}
};

export const FetchInvitations = async (): Promise<ApiResponse<any[]>> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetch(
			"https://backend:8001/friends/request/pending/",
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);
		return await handleResponse(response);
	} catch (error: any) {
		return {
			status: false,
			error: error.message || "Network error (invitations)",
		};
	}
};

export const SendFriendRequest = async (
	receiver_username: string
): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetch("https://backend:8001/friends/request/send/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ receiver_username }),
		});
		return await handleResponse(response);
	} catch (error: any) {
		return {
			status: false,
			error: error.message || "An unexpected error occurred.",
		};
	}
};

export const AcceptInvitation = async (id: number): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetch(
			`https://backend:8001/friends/request/accept/${id}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);
		return await handleResponse(response);
	} catch (error: any) {
		return {
			status: false,
			error: error.message || "Network error (accept invitation)",
		};
	}
};

export const DeclineInvitation = async (id: number): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetch(
			`https://backend:8001/friends/request/decline/${id}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);
		return await handleResponse(response);
	} catch (error: any) {
		return {
			status: false,
			error: error.message || "Network error (decline invitation)",
		};
	}
};
