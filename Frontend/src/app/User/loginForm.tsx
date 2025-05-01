"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/utilities/userActions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import "./user.css";
import "./loginForm.css";

const otpSchema = z.object({
	otp: z
		.string()
		.length(6, "OTP code must be 6 digits")
		.regex(/^\d+$/, "OTP code must contain only digits"),
});

const loginSchema = z.object({
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
	const [alert, setAlert] = useState<
		{ message: string; type: string } | undefined
	>(undefined);
	const [otpRequired, setOtpRequired] = useState(false);
	const [credentials, setCredentials] = useState<
		{ email: string; password: string } | undefined
	>(undefined);
	const router = useRouter();

	const [loginData, loginAction, loginPending] = useActionState(
		handleSubmit,
		undefined,
	);

	async function handleSubmit(_previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;
		const otp = formData.get("otpCode") as string;

		if (otpRequired && credentials) {
			const validationResult = otpSchema.safeParse({ otp: otp });

			if (!validationResult.success) {
				return {
					otpError:
						validationResult.error.errors.find((err) => err.path[0] === "otp")
							?.message || "Invalid OTP",
				};
			}

			try {
				const result = await login({
					email: credentials.email,
					pass: credentials.password,
					otp: otp,
				});

				if (result && result.ok) {
					setOtpRequired(false);
					setCredentials(undefined);

					setAlert({
						message: result.message || "Login successful! Redirecting...",
						type: "success",
					});
					setTimeout(() => {
						router.push("/lobby");
					}, 2000);
				} else {
					setAlert({
						message: result.error || "Failed to login user.",
						type: "danger",
					});
				}
			} catch (error) {
				setAlert({ message: "Failed to login user.", type: "danger" });
				return { previousValues: { email: credentials.email } };
			}
		} else {
			const validationResult = loginSchema.safeParse({ email, password });

			if (!validationResult.success) {
				const emailError = validationResult.error.errors.find(
					(err) => err.path[0] === "email",
				);
				const passwordError = validationResult.error.errors.find(
					(err) => err.path[0] === "password",
				);
				return {
					previousValues: { email },
					emailError: emailError ? emailError.message : undefined,
					passwordError: passwordError ? passwordError.message : undefined,
				};
			}

			try {
				const result = await login({
					email: email as string,
					pass: password as string,
				});

				if (result && result.ok && result.otp_required) {
					setOtpRequired(true);
					setCredentials({ email, password });
					setAlert({
						message: "Please enter the 2FA verification code",
						type: "info",
					});
					return { previousValues: { email } };
				} else if (result && result.ok) {
					setAlert({
						message: result.message || "Login successful! Redirecting...",
						type: "success",
					});
					setTimeout(() => {
						router.push("/lobby");
					}, 2000);
				} else {
					setAlert({
						message: result.error || "Failed to login user.",
						type: "danger",
					});
				}
			} catch (error) {
				setAlert({ message: "Failed to login user.", type: "danger" });
				return { previousValues: { email } };
			}
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
					{otpRequired ? (
						<>
							<label htmlFor="otpCode" className="label">
								OTP Code
							</label>
							<input
								type="text"
								placeholder="Enter 6-digit code"
								id="otpCode"
								name="otpCode"
								className="input-field"
							/>
							{loginData?.otpError && (
								<p className="error-message">{loginData?.otpError}</p>
							)}
							<button
								type="submit"
								formAction={loginAction}
								disabled={loginPending}
								className="submit-button"
							>
								Verify
							</button>
						</>
					) : (
						<>
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
						</>
					)}
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
