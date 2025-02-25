"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { register } from "@/app/utilities/userActions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import "./user.css";

export const registerSchema = z.object({
	email: z
		.string()
		.email("Invalid email format")
		.max(254, "Email address is too long"),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(32, "Username is too long"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.max(128, "Password is too long")
		.regex(
			/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#?_])[a-zA-Z0-9!@#?_]+$/,
			"Password must contain at least one uppercase character, one number, and one special character (e.g., ! @ # ? _)"
		),
	age: z
		.number()
		.positive("Age must be a positive number")
		.max(
			123,
			"The oldest human, Jeanne Calment, lived till the age of 122 years"
		)
		.optional(),
	nationality: z.string().max(254, "Nationality is too long").optional(),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export default function RegisterForm() {
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const router = useRouter();

	const [data, action, isPending] = useActionState(handleSubmit, undefined);

	async function handleSubmit(_previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		const age = parseInt(formData.get("age") as string);
		const nationality = formData.get("nationality") as string;
		const bio = formData.get("bio") as string;

		const validationResult = registerSchema.safeParse({
			email,
			username,
			password,
			age,
			nationality,
			bio,
		});

		if (!validationResult.success) {
			const emailError = validationResult.error.errors.find(
				(err) => err.path[0] === "email"
			);
			const usernameError = validationResult.error.errors.find(
				(err) => err.path[0] === "username"
			);
			const passwordError = validationResult.error.errors.find(
				(err) => err.path[0] === "password"
			);
			const ageError = validationResult.error.errors.find(
				(err) => err.path[0] === "age"
			);
			const nationalityError = validationResult.error.errors.find(
				(err) => err.path[0] === "nationality"
			);
			const bioError = validationResult.error.errors.find(
				(err) => err.path[0] === "bio"
			);

			return {
				previousValues: { email, username, password, age, nationality, bio },
				emailError: emailError ? emailError.message : undefined,
				usernameError: usernameError ? usernameError.message : undefined,
				passwordError: passwordError ? passwordError.message : undefined,
				ageError: ageError ? ageError.message : undefined,
				nationalityError: nationalityError
					? nationalityError.message
					: undefined,
				bioError: bioError ? bioError.message : undefined,
			};
		}

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
					...{ is_online: true },
				},
			};

			await register(requestData);
			setAlert({
				message: "Registration successful! Redirecting...",
				type: "success",
			});
			setTimeout(() => {
				router.push("/login"); // redirect to login section
			}, 2000);
		} catch (error) {
			setAlert({ message: String(error), type: "danger" });
			return {
				previousValues: { email, username, password, age, nationality, bio },
			};
		}
	}

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

				<form action={action}>
					<label htmlFor="email" className="block text-sm font-medium mb-1">
						Email<span className="text-red-500 ml-1">*</span>
					</label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						name="email"
						defaultValue={data?.previousValues?.email}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.emailError && (
						<p className="input-error">{data?.emailError}</p>
					)}
					<label htmlFor="username" className="block text-sm font-medium mb-1">
						Username<span className="text-red-500 ml-1">*</span>
					</label>
					<input
						type="text"
						placeholder="JohnDoe"
						id="username"
						name="username"
						defaultValue={data?.previousValues?.username}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.usernameError && (
						<p className="input-error">{data?.usernameError}</p>
					)}
					<label htmlFor="password" className="block text-sm font-medium mb-1">
						Password<span className="text-red-500 ml-1">*</span>
					</label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						defaultValue={data?.previousValues?.password}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.passwordError && (
						<p className="input-error">{data?.passwordError}</p>
					)}
					<label htmlFor="age" className="block text-sm font-medium mb-1">
						Age
					</label>
					<input
						type="number"
						placeholder="77"
						id="age"
						name="age"
						defaultValue={data?.previousValues?.age}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.ageError && <p className="input-error">{data?.ageError}</p>}
					<label
						htmlFor="nationality"
						className="block text-sm font-medium mb-1"
					>
						Nationality
					</label>
					<input
						type="text"
						placeholder="French"
						id="nationality"
						name="nationality"
						defaultValue={data?.previousValues?.nationality}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.nationalityError && (
						<p className="input-error">{data?.nationalityError}</p>
					)}
					<label htmlFor="bio" className="block text-sm font-medium mb-1">
						Bio
					</label>
					<input
						type="text"
						placeholder="Hi there ! I'm John Doe the greatest"
						id="bio"
						name="bio"
						defaultValue={data?.previousValues?.bio}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.bioError && <p className="input-error">{data?.bioError}</p>}
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
				<p className="text-xs mt-4">
					<span className="text-red-500 mr-1">*</span>: Mandatory information
				</p>
			</div>
		</div>
	);
}
