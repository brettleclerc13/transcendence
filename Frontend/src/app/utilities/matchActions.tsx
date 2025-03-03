"use server";

import { cookies } from "next/headers";

type MatchFilterProps = {
	id?: string;
	player1?: string;
	player2?: string | null; // Use null instead of empty string to indicate player2__isnull=True
	winner?: string;
	looser?: string;
	is_ongoing?: boolean;
	is_finished?: boolean;
};

export const fetchMatches = async (filters: MatchFilterProps = {}) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const queryString = Object.keys(filters)
			.map((key) => {
				if (key in filters) {
					return `${key}=${filters[key as keyof MatchFilterProps]}`;
				} else {
					throw new Error(`Invalid key: ${key}`);
				}
			})
			.join("&");

		const response = await fetch(
			`http://backend:8001/matches/?${queryString}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);

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
				"Failed to fetch matches.";
			throw new Error(errorMessage);
		} else {
			data = await response.json();
			return data;
		}
	} catch (error) {
		throw new Error(String(error) || "Failed to fetch matches.");
	}
};

export const createSimpleMatch = async (invite_game?: boolean) => {
	const cookieStore = await cookies();
	const token = cookieStore.get("accessToken")?.value;
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch("http://backend:8001/matches/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: invite_game ? JSON.stringify({ invite_game }) : JSON.stringify({}),
		});
		let data;

		if (!response.ok) {
			const text = await response.text();
			try {
				data = JSON.parse(text);
			} catch {
				throw new Error(
					`Unexpected response concerning simple match creation: ${response.status}`
				);
			}

			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to create simple match.";
			throw new Error(errorMessage);
		} else {
			console.log("Simple match successfully created");
			return response;
		}
	} catch (error) {
		console.error("createSimpleMatch: ", error);
		throw new Error(String(error) || "Failed to create simple match.");
	}
};
