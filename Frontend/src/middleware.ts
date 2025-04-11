import { NextRequest, NextResponse } from "next/server";
import { fetchWithAgent } from "@/lib/fetchWithAgent";

export const config = {
	matcher: "/",
};

export async function middleware(request: NextRequest) {
	const accessToken = request.cookies.get("accessToken")?.value;
	const refreshToken = request.cookies.get("refreshToken")?.value;

	if (!accessToken || !refreshToken) {
		console.log("❌ No valid tokens found");
		return;
	}

	const isValid = await verifyToken(accessToken);

	if (!isValid) {
		console.log("❌ Invalid token detected. Clearing tokens...");

		request.cookies.delete("accessToken");
		request.cookies.delete("refreshToken");

		return;
	}

	return NextResponse.next();
}

async function verifyToken(token: string) {
	const API_URL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const response = await fetchWithAgent(`${API_URL}/token/verify/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		});

		return response.ok;
	} catch (error) {
		console.warn("Error verifying token:", error);
		return false;
	}
}
