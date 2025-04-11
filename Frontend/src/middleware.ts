import { NextRequest, NextResponse } from "next/server";

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
	try {
		const response = await fetch(`http://backend:8001/token/verify/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		});

		return response.ok; // True if token is valid, false otherwise
	} catch (error) {
		console.warn("Error verifying token:", error);
		return false;
	}
}
