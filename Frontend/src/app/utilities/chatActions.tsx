"use server";

import { cookies } from "next/headers";
import { fetchWithAgent } from "@/lib/fetchWithAgent";
import type { Friend, Invitation } from "../utilities/charTypes";

type ApiResponse<T = unknown> =
	| { status: true; data?: T }
	| { status: "warning"; message: string }
	| { status: false; error: string };

// interface Friend {
//   username: string;
//   id: number;
//   profile_picture?: string;
// }

// interface Invitation {
//   id: number;
//   sender: string;
// }

export const getToken = async () => {
	const cookieStore = await cookies();
	return cookieStore.get("accessToken")?.value;
};

const handleResponse = async <T = unknown>(
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
	searchValue: string,
): Promise<ApiResponse<Friend[]>> => {
	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/search/?query=${searchValue}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse<Friend[]>(response);
	} catch (error: unknown) {
		return {
			status: false,
			error: (error instanceof Error ? error.message : "An unexpected error occurred."),
		};
	}
};

export const FetchFriends = async (): Promise<ApiResponse<Friend[]>> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/friends/`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse<Friend[]>(response);
	} catch (error: unknown) {
		return { status: false, error: (error instanceof Error ? error.message : "Network error (friends)") };
	}
};

export const FetchInvitations = async (): Promise<ApiResponse<Invitation[]>> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/friends/request/pending/`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse<Invitation[]>(response);
	} catch (error: unknown) {
		return {
			status: false,
			error: (error instanceof Error ? error.message : "Network error (invitations)"),
		};
	}
};

export const SendFriendRequest = async (
	receiver_username: string,
): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/friends/request/send/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ receiver_username }),
			},
		);
		return await handleResponse(response);
	} catch (error: unknown) {
		return {
			status: false,
			error: (error instanceof Error ? error.message : "An unexpected error occurred."),
		};
	}
};

export const AcceptInvitation = async (id: number): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/friends/request/accept/${id}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse(response);
	} catch (error: unknown) {
		return {
			status: false,
			error: (error instanceof Error ? error.message : "Network error (accept invitation)"),
		};
	}
};

export const DeclineInvitation = async (id: number): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/friends/request/decline/${id}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse(response);
	} catch (error: unknown) {
		return {
			status: false,
			error: (error instanceof Error ? error.message : "Network error (decline invitation)"),
		};
	}
};

export const GetOrCreateConversation = async (
	user_id: number,
): Promise<ApiResponse> => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/get_or_create_conversation/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ user_id }),
			},
		);
		return await handleResponse(response);
	} catch (error) {
		return {
			status: false,
			error:
				(error as Error).message ||
				"Network error (get or create conversation)",
		};
	}
};

export const FetchMessages = async (conversation_id: string) => {
	const token = await getToken();
	if (!token) return { status: false, error: "Access token missing" };

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/messages/?conversation_id=${conversation_id}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		return await handleResponse(response);
	} catch (error) {
		return {
			status: false,
			error: (error as Error).message || "Network error (fetch messages)",
		};
	}
};
