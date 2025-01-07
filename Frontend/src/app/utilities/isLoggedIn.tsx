'use client'

import { jwtDecode } from "jwt-decode";

export const isUserLoggedIn = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) return false;

    try {
        const decoded = jwtDecode(token) as { exp : number};
        const currentTime = Math.floor(Date.now() / 1000); // current time in seconds

        // Check if token has expired
        return decoded.exp > currentTime;
    } catch (error) {
        console.error("Token decoding error:", error);
        return false;
    }
}
