import { fail } from "assert";

const getToken = () => localStorage.getItem("accessToken");

const handleResponse = async (response: Response) => {
	const text = await response.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error(`Unexpected response: ${response.status} - ${text}`);
	}
	if (!response.ok) {
		const errorMessage =
			data.non_field_errors?.[0] ||
			data.message ||
			data.detail ||
			"An unexpected error occurred.";
		throw new Error(errorMessage);
	}
	return data;
};

export const SearchFriend = async (searchValue: string) => {

	try {
		const response = await fetch(`/api/search/?query=${searchValue}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await handleResponse(response);
		return { data, status: true };
	} catch (error) {
		console.error("Erreur lors de la recherche :", error);
		return {error, status:false};
	}
}

export const FetchFriends = async () => {
	const token = getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch("/api/friends/", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return await handleResponse(response);
	} catch (error) {
		throw new Error(String(error) || "Erreur réseau (friends)");
	}
};

export const FetchInvitations = async () => {
	const token = getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch("/api/friends/request/pending/", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return await handleResponse(response);
	} catch (error) {
		throw new Error(String(error) || "Erreur réseau (invitations)");
	}
};

export const SendFriendRequest = async (receiver_username: string) => {
	const token = getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch("/api/friends/request/send/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ receiver_username }),
		});
		return await handleResponse(response);
	} catch (error) {
		throw new Error(String(error) || "Erreur réseau (send request)");
	}
};

export const AcceptInvitation = async (id: number) => {
	const token = getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch(`/api/friends/request/accept/${id}/`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return await handleResponse(response);
	} catch (error) {
		throw new Error(String(error) || "Erreur réseau (accept invitation)");
	}
};

export const DeclineInvitation = async (id: number) => {
	const token = getToken();
	if (!token) throw new Error("Access token missing");

	try {
		const response = await fetch(`/api/friends/request/decline/${id}/`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		return await handleResponse(response);
	} catch (error) {
		throw new Error(String(error) || "Erreur réseau (decline invitation)");
	}
};
