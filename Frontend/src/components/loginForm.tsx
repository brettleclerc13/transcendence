'use client'

import React, { useState, useActionState } from "react";
import Link from "next/link"
import { login } from "@/app/actions";


export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [pass, setPass] = useState("");
	const [errors, setErrors] = useState({email: "", pass: ""});
	const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);
	
	// const { mutate, error } = useMutation({
	// 	mutationFn: () => login({ email, pass}),
	// 	onSuccess: () => {
	// 		setAlert({ message: "Login successful! Redirecting...", type: "success" });

	// 		setTimeout(() => {
	// 			window.location.href = "/?section=home"; // redirect to home section
	// 		}, 2000);
	// 	},
	// 	onError: (err: Error) => {
	// 		if (err.message === "User already logged in")
	// 			setAlert({ message: "You are already logged in.", type: "danger" });
	// 		else
	// 			setAlert({ message: "An unexpected error occurred. Please try again later.", type: "danger" });
	// 	},
	// 	onSettled: () => {
	// 		//setLoading(false);
	// 	}
	// });

	const [data, action, isPending] = useActionState(login, undefined);

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

		console.log("Login request data: ", requestData);

		//setLoading(true);

		action();
	};

	return (
		<div className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg w-96">
				<Link 
				href="/"
				className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl font-bold"
				>
				&times;
				</Link>

				{alert && (
                    <div className={`alert alert-${alert.type} mb-4`} role="alert">
                        {alert.message}
                    </div>
                )}

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
				<Link className="link-btn underline mt-4 ml-6" href="/register">
					Don&apos;t have an account ? Register here
				</Link>
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}

// onLoginSuccess({
// 	name: data.name,
// 	profilePicture: data.profilePicture,
// 	status: "Disponible",
// });