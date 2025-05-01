"use server";

import { cookies } from "next/headers";
import {
	fetchGenericAPIResponses,
	fetchAPIResponseData,
} from "./generalActions";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

type MatchFilterProps = {
	id?: string;
	player1?: string;
	player2?: string | undefined;
	winner?: string;
	looser?: string;
	is_ongoing?: boolean;
	is_finished?: boolean;
	is_tournament?: boolean;
};

export const fetchMatches = async (filters: MatchFilterProps = {}) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const queryString = Object.keys(filters)
			.map((key) => {
				const value = filters[key as keyof MatchFilterProps];

				if (typeof value === "boolean") {
					return `${key}=${value ? "1" : "0"}`;
				}
				if (value === undefined) {
					return `${key}=`;
				}
				return `${key}=${value}`;
			})
			.join("&");

		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/matches/?${queryString}`,
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
				errorMessage: "Failed to fetch matches.",
				successMessage: "Successfully fetched matches",
			},
		});

		if (result.ok) return result.data;
		else throw new Error(String(result.error) || "Failed to fetch matches.");
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch matches.");
	}
};

export const createSimpleMatch = async (invite_game?: boolean) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/matches/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: invite_game
					? JSON.stringify({ invite_game })
					: JSON.stringify({}),
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to create simple match.",
				successMessage: "Successfully created simple match",
			},
		});

		if (result.ok) {
			if (result.data && result.data.id) {
				return { ok: true, matchID: result.data.id };
			} else throw new Error("MatchID not found");
		} else
			throw new Error(String(result.error) || "Failed to create simple match.");
	} catch (error) {
		throw new Error(String(error) || "Failed to create simple match.");
	}
};

export const joinSimpleMatch = async (matchID: string) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token)
		return {
			ok: false,
			error: "Access token missing",
		};

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchID}/`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to join simple match.",
				successMessage: "Successfully joined simple match",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to join simple match.",
		};
	}
};

export const fetchSimpleMatchHistory = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token)
		return {
			ok: false,
			error: "Access token missing",
		};

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/match-history/`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		return await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to fetch user 1v1 match history.",
				successMessage: "Successfully fetched user 1v1 match history",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error:
				(error as Error).message || "Failed to fetch user 1v1 match history.",
		};
	}
};

export const checkMatches = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token)
		return {
			ok: false,
			error: "Access token missing",
		};

	try {
		console.log("Checking 1v1 matches");
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/match-check/`,
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
				errorMessage: "Failed to check user 1v1 active matches.",
				successMessage: "Successfully checked user 1v1 active matches",
			},
		});

		if (result.ok) {
			if (result.data && result.data[0].id) {
				return { ok: true, matchID: result.data[0].id };
			} else return result.data;
		} else return result;
	} catch (error) {
		return {
			ok: false,
			error:
				(error as Error).message || "Failed to check user 1v1 active matches.",
		};
	}
};
