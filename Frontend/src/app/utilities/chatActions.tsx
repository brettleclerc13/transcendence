'use client'

export const FetchFriends = async () => {
    const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");

    try {
        const response = await fetch('/api/friends/', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage =
                data.non_field_errors?.[0] || // First item in non_field_errors array
                data.message || // Fallback to a generic message
                data.detail || // Another common key for error messages
                "Failed to update friend's list.";
            throw new Error(errorMessage);
        }
        return data;

    } catch (error) {
        throw new Error(String(error) || "Erreur réseau (friends)");
    }
};

export const FetchInvitations = async () => {
    const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");
    
    try {
        const response = await fetch('/api/friends/request/pending', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage =
                data.non_field_errors?.[0] || // First item in non_field_errors array
                data.message || // Fallback to a generic message
                data.detail || // Another common key for error messages
                "Failed to update invitation list.";
            throw new Error(errorMessage);
        }
        
        return data;

    } catch (error) {
        throw new Error(String(error) || "Erreur réseau (invitations)");
    }
};

export const AcceptInvitation = async (id: number) => {
    const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");
    
    try {
        const response = await fetch(`/api/friends/request/accept/${id}/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage =
                data.non_field_errors?.[0] || // First item in non_field_errors array
                data.message || // Fallback to a generic message
                data.detail || // Another common key for error messages
                "Failed to accept invitation.";
            throw new Error(errorMessage);
        }
        
        return data;

    } catch (error) {
        throw new Error(String(error) || "Erreur réseau (accept invitation)");
    }
};

export const DeclineInvitation = async (id: number) => {
    const token = localStorage.getItem('accessToken');
        if (!token) throw new Error("Access token missing");
    
    try {
        const response = await fetch(`/api/friends/request/decline/${id}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
    
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage =
                data.non_field_errors?.[0] || // First item in non_field_errors array
                data.message || // Fallback to a generic message
                data.detail || // Another common key for error messages
                "Failed to decline invitation.";
            throw new Error(errorMessage);
        }
        
        return data;

    } catch (error) {
        throw new Error(String(error) || "Erreur réseau (decline invitation)");
    }
};