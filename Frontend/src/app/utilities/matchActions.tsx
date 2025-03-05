"use server";

import { cookies } from "next/headers";

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
	console.log("AcessToken: ", token);
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
			console.log("Match API return data: ", data);

			const errorMessage =
				data.non_field_errors?.[0] || // First item in non_field_errors array
				data.message || // Fallback to a generic message
				data.detail || // Another common key for error messages
				"Failed to create simple match.";
			throw new Error(errorMessage);
		} else {
			console.log("Simple match successfully created");
			return;
		}
	} catch (error) {
		console.error("createSimpleMatch: ", error);
		throw new Error(String(error) || "Failed to create simple match.");
	}
};
