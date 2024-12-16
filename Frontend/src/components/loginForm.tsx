'use client'

import React, { useState } from "react";
import { FormProps } from "@/app/types";
import Link from "next/link"

interface LoginFormProps extends FormProps {
	onLoginSuccess: (userData: any) => void;
}

export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [pass, setPass] = useState("");
	const [errors, setErrors] = useState({email: "", pass: ""});
	const [serverError, setServerError] = useState("");
	
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		let formIsValid = true;
		const newErrors = {email: "", pass: ""};

		if (!email) {
			newErrors.email = "Email is required.";
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
		// Préparation des données pour l'API
		const requestData = {
			email: email,
			password: pass,
		};

		console.log("ICI : ")
		console.log("Request Data: ", requestData);

		try {
			// Appel à l'API avec fetch
			const response = await fetch("/api/login/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestData),
			});

			// Vérifier la réponse
			if (!response.ok) {
				const errorData = await response.json();
				setServerError(errorData.detail || "Login failed. Please try again.");
				return;
			}

			// Succès : Traiter la réponse
			const data = await response.json();
			console.log("Login successful:", data);

			// onLoginSuccess({
			// 	name: data.name,
			// 	profilePicture: data.profilePicture,
			// 	status: "Disponible",
			// });

		} catch (error) {
			console.error("Error during login:", error);
			setServerError("An unexpected error occurred. Please try again later.");
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
					<button
						type="submit"
						className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
					>
						Log In
					</button>
				</form>
				<Link className="link-btn underline mt-4 ml-6" href="?section=register">
					Don&apos;t have an account ? Register here
				</Link>
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}
