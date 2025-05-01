"use server";

import { getToken } from "./chatActions";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

export const FetchBlockedUsers = async () => {
	const token = await getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/blocked-users/`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (response && !response.ok)
			throw new Error("Failed to fetch blocked users");
		return await response.json();
	} catch (error) {
		console.warn("Error fetching blocked users:", error);
		return [];
	}
};

export const BlockUser = async (userId: number) => {
	const token = await getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/block-user/${userId}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response && !response.ok) throw new Error("Failed to block user");
	} catch (error) {
		console.warn("Error blocking user:", error);
	}
};

export const UnblockUser = async (userId: number) => {
	const token = await getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/unblock-user/${userId}/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		);
		if (response && !response.ok) throw new Error("Failed to unblock user");
	} catch (error) {
		console.warn("Error unblocking user:", error);
	}
};
