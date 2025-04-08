"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/utilities/userActions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import "./user.css";
import "./loginForm.css";

export const loginSchema = z.object({
	email: z
		.string()
		.email("Invalid email format")
		.max(254, "Email address is too long"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.max(128, "Password is too long"),
});

export default function LoginForm() {
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const router = useRouter();

	const [loginData, loginAction, loginPending] = useActionState(
		handleSubmit,
		undefined
	);

	async function handleSubmit(_previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		const validationResult = loginSchema.safeParse({ email, password });

		if (!validationResult.success) {
			const emailError = validationResult.error.errors.find(
				(err) => err.path[0] === "email"
			);
			const passwordError = validationResult.error.errors.find(
				(err) => err.path[0] === "password"
			);
			return {
				previousValues: { email },
				emailError: emailError ? emailError.message : undefined,
				passwordError: passwordError ? passwordError.message : undefined,
			};
		}

		try {
			await login({ email: email as string, pass: password as string });
			setAlert({
				message: "Login successful! Redirecting...",
				type: "success",
			});
			setTimeout(() => {
				router.push("/lobby");
			}, 2000);
		} catch (error) {
			setAlert({ message: String(error), type: "danger" });
			return { previousValues: { email } };
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
						defaultValue={loginData?.previousValues?.email}
						className="input-field"
					/>
					{loginData?.emailError && (
						<p className="error-message">{loginData?.emailError}</p>
					)}

					<label htmlFor="password" className="label">
						Password<span className="mandatory">*</span>
					</label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						className="input-field"
					/>
					{loginData?.passwordError && (
						<p className="error-message">{loginData?.passwordError}</p>
					)}

					<button
						type="submit"
						formAction={loginAction}
						disabled={loginPending}
						className="submit-button"
					>
						Log In
					</button>
				</form>

				<Link className="register-link" href="/register">
					Don&apos;t have an account? Register here
				</Link>

				<p className="mandatory-info">
					<span>*</span>: Mandatory information
				</p>
			</div>
		</div>
	);
}
