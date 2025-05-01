"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { register } from "@/app/utilities/userActions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import "./user.css";
import "./registerForm.css";

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
			"Password must contain at least one uppercase character, one number, and one special character (e.g., ! @ # ? _)",
		),
	age: z
		.number()
		.positive("Age must be a positive number")
		.max(
			123,
			"The oldest human, Jeanne Calment, lived till the age of 122 years",
		)
		.optional(),
	nationality: z.string().max(254, "Nationality is too long").optional(),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

export default function RegisterForm() {
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null,
	);
	const router = useRouter();

	const [registerData, registerAction, registerPending] = useActionState(
		handleSubmit,
		undefined,
	);

	async function handleSubmit(_previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		const age = formData.get("age") ? Number(formData.get("age")) : undefined;
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
				(err) => err.path[0] === "email",
			);
			const usernameError = validationResult.error.errors.find(
				(err) => err.path[0] === "username",
			);
			const passwordError = validationResult.error.errors.find(
				(err) => err.path[0] === "password",
			);
			const ageError = validationResult.error.errors.find(
				(err) => err.path[0] === "age",
			);
			const nationalityError = validationResult.error.errors.find(
				(err) => err.path[0] === "nationality",
			);
			const bioError = validationResult.error.errors.find(
				(err) => err.path[0] === "bio",
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

			const result = await register(requestData);
			if (result && result.ok) {
				setAlert({
					message: result.message || "Registration successful! Redirecting...",
					type: "success",
				});
				setTimeout(() => {
					router.push("/login"); // redirect to login section
				}, 2000);
			} else {
				setAlert({
					message: result.error || "Failed to register user.",
					type: "danger",
				});
				return {
					previousValues: { email, username, password, age, nationality, bio },
				};
			}
		} catch (error) {
			setAlert({ message: "Failed to register user.", type: "danger" });
			return {
				previousValues: { email, username, password, age, nationality, bio },
			};
		}
	}

	return (
		<div className="modal-container">
			<div className="modal-content">
				<Link href="/" className="close-button">
					&times;
				</Link>

				{alert && (
					<div className={`alert alert-${alert.type}`} role="alert">
						{alert.message}
					</div>
				)}

				<form>
					<label htmlFor="email" className="label">
						Email<span className="mandatory">*</span>
					</label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						name="email"
						defaultValue={registerData?.previousValues?.email}
						className="input-field"
					/>
					{registerData?.emailError && (
						<p className="input-error">{registerData?.emailError}</p>
					)}

					<label htmlFor="username" className="label">
						Username<span className="mandatory">*</span>
					</label>
					<input
						type="text"
						placeholder="JohnDoe"
						id="username"
						name="username"
						defaultValue={registerData?.previousValues?.username}
						className="input-field"
					/>
					{registerData?.usernameError && (
						<p className="input-error">{registerData?.usernameError}</p>
					)}

					<label htmlFor="password" className="label">
						Password<span className="mandatory">*</span>
					</label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						defaultValue={registerData?.previousValues?.password}
						className="input-field"
					/>
					{registerData?.passwordError && (
						<p className="input-error">{registerData?.passwordError}</p>
					)}

					<label htmlFor="age" className="label">
						Age
					</label>
					<input
						type="number"
						placeholder="77"
						id="age"
						name="age"
						defaultValue={registerData?.previousValues?.age}
						className="input-field"
					/>
					{registerData?.ageError && (
						<p className="input-error">{registerData?.ageError}</p>
					)}

					<label htmlFor="nationality" className="label">
						Nationality
					</label>
					<input
						type="text"
						placeholder="French"
						id="nationality"
						name="nationality"
						defaultValue={registerData?.previousValues?.nationality}
						className="input-field"
					/>
					{registerData?.nationalityError && (
						<p className="input-error">{registerData?.nationalityError}</p>
					)}

					<label htmlFor="bio" className="label">
						Bio
					</label>
					<input
						type="text"
						placeholder="Hi there ! I'm John Doe the greatest"
						id="bio"
						name="bio"
						defaultValue={registerData?.previousValues?.bio}
						className="input-field"
					/>
					{registerData?.bioError && (
						<p className="input-error">{registerData?.bioError}</p>
					)}

					<button
						disabled={registerPending}
						formAction={registerAction}
						type="submit"
						className="submit-button"
					>
						Sign Up
					</button>
				</form>

				<Link className="register-link" href="/login">
					Already have an account? Login here
				</Link>

				<p className="mandatory-info">
					<span>*</span>: Mandatory information
				</p>
			</div>
		</div>
	);
}
