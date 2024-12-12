'use client'

import React, {useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [pass, setPass] = useState("");
	const [age, setAge] = useState("");
	const [nationality, setNationality] = useState("");
	const [bio, setBio] = useState("");
	const [errors, setErrors] = useState({ email: "", username: "", pass: "" });

	const validatePassword = (password: string) => {
		const requirements = [
			{ label: "At least 8 characters", isMet: password.length >= 8 },
			{ label: "At least one uppercase character", isMet: /[A-Z]/.test(password) },
			{ label: "At least one number", isMet: /[0-9]/.test(password) },
			{ label: "At least one special character (e.g., ! @ # ? _)", isMet: /[!@#?_]/.test(password) },
		];
		const unmetRequirements = requirements.filter((req) => !req.isMet);
		return unmetRequirements.map((req) => req.label);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		let formIsValid = true;
		const newErrors = {email: "", username: "", pass: "" };

		const passwordErrors = validatePassword(pass);
		if (passwordErrors.length > 0) {
			newErrors.pass = `Password must meet the following requirements:\n- ${passwordErrors.join("\n- ")}`;
			formIsValid = false;
		}

		if (!email) {
			newErrors.email = "Email is required.";
			formIsValid = false;
		}
		if (!username) {
			newErrors.username = "Username is required.";
			formIsValid = false;
		}
		if (!pass) {
			newErrors.pass = "Password is required.";
			formIsValid = false;
		}

		setErrors(newErrors);

		if (!formIsValid) {
			return;
		}

		// Préparer les données pour l'API
		const requestData = {
			email,
			user: username,
			password: pass,
			...(age ? { age } : {}), // Ajoute `age` uniquement si défini
    		...(nationality ? { nationality } : {}),  // Ajoute `nationality` uniquement si défini
    		...(bio ? { bio } : {}),
		};

		try {
			// Envoyer les données au backend avec fetch
			const response = await fetch("/api/users/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData), // Convertir les données en JSON
			});

			// Vérifier la réponse
			if (!response.ok) {
				const responseText = await response.text(); // Log raw response text
				console.error("Raw response:", responseText); // Helps debug non-JSON responses
				const errorData = response.headers.get("Content-Type") === "application/json" 
					? JSON.parse(responseText)
					: { message: "Unexpected response format" };
				console.error("Error creating user:", errorData);
				alert("Failed to register. Please try again.");
			}

			// Succès : Traiter la réponse
			const data = await response.json();
			console.log("User created:", data);
			//back to home page function.
		} catch (error) {
			// Gérer les erreurs réseau ou autres
			console.error("Error:", error);
			alert("An error occurred. Please try again later.");
		}
	};

	return (
		<div className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg w-96">
				<Link 
					href="?section=home" 
					className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl font-bold"
				>
					&times;
				</Link>
				<form onSubmit={handleSubmit}>
					<label htmlFor="email" className="block text-sm font-medium mb-1">Email<span className="text-red-500 ml-1">*</span></label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.email && <p className="text-red-500 text-sm mb-2">{errors.email}</p>}
					<label htmlFor="username" className="block text-sm font-medium mb-1">Username<span className="text-red-500 ml-1">*</span></label>
					<input
						type="username"
						placeholder="JohnDoe"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.username && <p className="text-red-500 text-sm mb-2">{errors.username}</p>}
					<label htmlFor="password" className="block text-sm font-medium mb-1">Password<span className="text-red-500 ml-1">*</span></label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						value={pass}
						onChange={(e) => setPass(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.pass && <p className="text-red-500 text-sm mb-2">{errors.pass}</p>}
					<label htmlFor="age" className="block text-sm font-medium mb-1">Age</label>
					<input
						type="age"
						placeholder="77"
						id="age"
						value={age}
						onChange={(e) => setAge(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="nationality" className="block text-sm font-medium mb-1">Nationality</label>
					<input
						type="nationality"
						placeholder="French"
						id="nationality"
						value={nationality}
						onChange={(e) => setNationality(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
					<input
						type="bio"
						placeholder="Hi there ! I'm John Doe the greatest"
						id="bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<button
						type="submit"
						className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
					>
						Sign Up
					</button>
				</form>
				<Link className="link-btn underline mt-4 ml-6" href="?section=login">
					Already have an account ? Login here
				</Link>
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}
