'use client'

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { register } from "@/app/utilities/userActions";
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
	const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);
	const router = useRouter();
	
	const [data, action, isPending] = useActionState(handleSubmit, undefined);
	
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

	async function handleSubmit(_previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		const age = parseInt(formData.get("age") as string);
		const nationality = formData.get("nationality") as string;
		const bio = formData.get("bio") as string;

		const previousInputData = {
			email: email,
			username: username,
			password: password,
			age: ( age ? String(age) : ""),
			nationality: nationality,
			bio: bio
		}

		const passwordErrors = validatePassword(password);
		if (!email)
			return { emailError: "Email is required.", previousInputData };
		else if (!username)
			return { usernameError: "Username is required.", previousInputData };
		else if (!password)
			return { passwordError: "Password is required.", previousInputData };
		else if (password && passwordErrors.length > 0)
			return  { passwordError: `Password must meet the following requirements:\n- ${passwordErrors.join("\n- ")}`, previousInputData };

		try {
			// Préparer les données pour l'API
			const requestData = {
				email,
				username,
				password: password,
				profile: {
					...(age ? { age } : {}),
					...(nationality ? { nationality } : {}),
					...(bio ? { bio } : {}),
					...{ is_online: true }
				}
			};

			await register(requestData);
			setAlert({ message: "Registration successful! Redirecting...", type: "success" });
			setTimeout(() => {
				router.push('/login'); // redirect to login section
			}, 2000);

		} catch (error) {
			return { error: String(error), previousInputData };
		}}

	return (
		<div className="fixed inset-0 bg-teal-800 flex justify-center items-center">
			<div className="bg-white mt-20 p-8 rounded-lg shadow-lg w-96">
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
				{data?.error && (
                    <div className="alert alert-danger mb-4" role="alert">
                        {data?.error ?? 'An unknown error occurred'}
                    </div>
                )}

				<form action={action}>
					<label htmlFor="email" className="block text-sm font-medium mb-1">Email<span className="text-red-500 ml-1">*</span></label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						name="email"
						defaultValue={data?.previousInputData?.email}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.emailError && <p className="text-red-500 text-sm mb-2">{data?.emailError}</p>}
					<label htmlFor="username" className="block text-sm font-medium mb-1">Username<span className="text-red-500 ml-1">*</span></label>
					<input
						placeholder="JohnDoe"
						id="username"
						name="username"
						defaultValue={data?.previousInputData?.username}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.usernameError && <p className="text-red-500 text-sm mb-2">{data?.usernameError}</p>}
					<label htmlFor="password" className="block text-sm font-medium mb-1">Password<span className="text-red-500 ml-1">*</span></label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						defaultValue={data?.previousInputData?.password}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.passwordError && <p className="text-red-500 text-sm mb-2">{data?.passwordError}</p>}
					<label htmlFor="age" className="block text-sm font-medium mb-1">Age</label>
					<input
						placeholder="77"
						id="age"
						name="age"
						defaultValue={data?.previousInputData?.age}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="nationality" className="block text-sm font-medium mb-1">Nationality</label>
					<input
						placeholder="French"
						id="nationality"
						name="nationality"
						defaultValue={data?.previousInputData?.nationality}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
					<input
						placeholder="Hi there ! I'm John Doe the greatest"
						id="bio"
						name="bio"
						defaultValue={data?.previousInputData?.bio}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<button
						disabled={isPending}
						type="submit"
						className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
					>
						Sign Up
					</button>
				</form>
				<Link className="link-btn underline mt-4 ml-6" href="/login">
					Already have an account ? Login here
				</Link>
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}
