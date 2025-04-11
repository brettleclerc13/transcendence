"use server";

import { cookies } from "next/headers";
import {
	fetchGenericAPIResponses,
	fetchAPIResponseData,
} from "./generalActions";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

type TournamentFilterProps = {
	id?: string;
	players?: object;
	is_ongoing?: boolean;
	is_finished?: boolean;
	is_tournament?: boolean;
};

export const fetchTournaments = async (filters: TournamentFilterProps = {}) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const queryString = Object.keys(filters)
			.map((key) => {
				const value = filters[key as keyof TournamentFilterProps];

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
			`${process.env.NEXT_PUBLIC_API_URL}/tournaments/?${queryString}`,
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
				errorMessage: "Failed to fetch tournaments.",
				successMessage: "Successfully fetched tournaments",
			},
		});

		if (result.ok) return result.data;
		else
			throw new Error(String(result.error) || "Failed to fetch tournaments.");
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch tournaments.");
	}
};

export const createTournament = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({}),
			},
		);

		const result = await fetchAPIResponseData({
			response,
			defaultMessages: {
				errorMessage: "Failed to create tournament.",
				successMessage: "Successfully created tournament",
			},
		});

		if (result.ok) {
			if (result.data && result.data.id) {
				return { ok: true, tournamentID: result.data.id };
			} else throw new Error("TournamentID not found");
		} else
			throw new Error(String(result.error) || "Failed to create tournament.");
	} catch (error) {
		throw new Error(String(error) || "Failed to create tournament.");
	}
};

export const joinTournament = async (tournamentID: string) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token)
		return {
			ok: false,
			error: "Access token missing",
		};

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentID}/`,
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
				errorMessage: "Failed to join tournament.",
				successMessage: "Successfully joined the tournament",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to join tournament.",
		};
	}
};

export const leaveTournament = async (tournamentID: string) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) {
		return {
			ok: false,
			error: "Access token missing",
		};
	}

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournamentID}/`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			},
		);

		return await fetchGenericAPIResponses({
			response,
			defaultMessages: {
				errorMessage: "Failed to leave tournament.",
				successMessage: "Successfully left the tournament",
			},
		});
	} catch (error) {
		return {
			ok: false,
			error: (error as Error).message || "Failed to leave tournament.",
		};
	}
};

export const fetchTournamentHistory = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/tournament-history/`,
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
				errorMessage: "Failed to fetch user tournament history.",
				successMessage: "Successfully fetched user tournament history",
			},
		});

		if (result.ok) return result.data;
		else return result;
	} catch (error) {
		return {
			ok: false,
			error:
				(error as Error).message || "Failed to fetch user tournament history.",
		};
	}
};

export const checkTournaments = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetchWithAgent(
			`${process.env.NEXT_PUBLIC_API_URL}/tournament-check/`,
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
				errorMessage: "Failed to check user's active tournaments.",
				successMessage: "Successfully checked user's active tournaments",
			},
		});

		if (result.ok) {
			if (result.data && result.data[0].id) {
				return { ok: true, tournamentID: result.data[0].id };
			} else return result.data;
		} else return result;
	} catch (error) {
		return {
			ok: false,
			error:
				(error as Error).message ||
				"Failed to check user's active tournaments.",
		};
	}
};
