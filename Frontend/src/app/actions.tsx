"use client"

type loginProps = {
	email: string,
	pass: string,
}

export const login = async ( { email, pass } : loginProps ) => {
	const requestData = {
		username: email,
		password: pass,
	};
	
	const response = await fetch("/api/token/", {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestData),
	});
	
	const data = await response.json();

	if (response.ok) {
		localStorage.setItem('accessToken', data.access);
		localStorage.setItem('refreshToken', data.refresh);
		console.log("Login successful:", data);
		return data;
	} else {
		console.error("Login failed: ", data);
		if (data.message === "User already logged in")
			throw new Error("User already logged in");
		else
			throw new Error(data.detail || "Login failed");
	}
}
