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

type UserProfile = {
    username: string;
    profilePicture: string;
    is_online: boolean;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
	try {
		const token = localStorage.getItem('accessToken');
		if (!token) throw new Error("Access token missing");

		const response = await fetch("/api/profile/", {	
			method: 'GET',
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Profile API Error:", errorText);
			throw new Error(`HTTP Error: ${response.status}`);
		}

		return await response.json();

	} catch (error) {
		console.error("fetUserProfileError: ", error);
		return { username: '', profilePicture: '', is_online: false };
	}
}

export const logout = async () => {
	try {
		localStorage.removeItem("accessToken");

		const response = await fetch("/api/logout/", {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			},
		});

		if (response.ok)
			console.log("Logout successful");
		else
			console.error("Logout unsuccessful");

		setTimeout(() => {
			window.location.href = "/?section=home";
		}, 1000);

	} catch (error) {
		console.error("Error: issue while logging out", error);
	}
}