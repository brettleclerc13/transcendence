"use server";

import { cookies } from "next/headers";

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

		const response = await fetch(
			`http://backend:8001/tournaments/?${queryString}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);

		let data;
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(`Unexpected response: ${response.status}`);
		}

		if (!response.ok) {
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch tournaments.";
			throw new Error(errorMessage);
		} else {
			return data;
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch tournaments.");
	}
};

export const createTournament = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch("http://backend:8001/tournaments/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({}),
		});

		let data;
		const text = await response.text();
		try {
			data = JSON.parse(text);
		} catch {
			throw new Error(
				`Unexpected response concerning tournament creation: ${response.status}`
			);
		}
		if (!response.ok) {
			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to create tournament.";
			throw new Error(errorMessage);
		} else {
			console.log("create Match data: ", data);
			if (data.id) return { tournamentID: data.id as string };
			else throw new Error("TournamentID not found");
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to create tournament.");
	}
}

export const joinTournament = async (tournamentID: string) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch(`http://backend:8001/matches/${tournamentID}/`, {
			method: "PATCH",
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
			throw new Error(
				`Unexpected response when trying to join simple match: ${response.status}`
			);
		}
		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to join simple match.";
			throw new Error(errorMessage);
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to join simple match.");
	}
}

export const fetchTournamentHistory = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch(`http://backend:8001/tournament-history/`, {
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
			throw new Error(
				`Unexpected response when trying to fetch user tournament history: ${response.status}`
			);
		}
		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to fetch user tournament history.";
			throw new Error(errorMessage);
		} else {
			return data;
		}
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
		const response = await fetch(`http://backend:8001/tournament-check/`, {
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
			throw new Error(
				`Unexpected response when trying to check user's active tournaments: ${response.status}`
			);
		}
		if (!response.ok) {
			const errorMessage =
				data.error ||
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to check user's active tournaments.";
			throw new Error(errorMessage);
		} else {
			return data;
		}
	} catch (error) {
		return {
			ok: false,
			error:
				(error as Error).message || "Failed to check user's active tournaments.",
		};
	}
}
