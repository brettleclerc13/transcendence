'use client'

export const FetchBlockedUsers = async () => {
	const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");

    try {
        const response = await fetch(`/api/blocked-users/`, {
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			}
		});

        if (!response.ok) throw new Error("Failed to fetch blocked users");
        return await response.json();
    } catch (error) {
        console.error("Error fetching blocked users:", error);
        return [];
    }
};

export const BlockUser = async (userId: number) => {
	const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");

    try {
        const response = await fetch(`/api/block-user/${userId}/`, {
            method: "POST",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			}
        });
        if (!response.ok) throw new Error("Failed to block user");
    } catch (error) {
        console.error("Error blocking user:", error);
    }
};

export const UnblockUser = async (userId: number) => {
	const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");

    try {
        const response = await fetch(`/api/unblock-user/${userId}/`, {
            method: "POST",
			headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) throw new Error("Failed to unblock user");
    } catch (error) {
        console.error("Error unblocking user:", error);
    }
};