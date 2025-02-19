"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/utilities/userActions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import "./user.css";

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

	const [data, action, isPending] = useActionState(handleSubmit, undefined);

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
				router.push("/");
			}, 2000);
		} catch (error) {
			setAlert({ message: String(error), type: "danger" });
			return { previousValues: { email } };
		}
	}

	return (
		<div className="fixed inset-0 bg-teal-800 flex justify-center items-center">
			<div className="bg-white p-8 top-20 rounded-lg shadow-lg w-96">
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
						<p className="text-red-500 text-sm mb-2">{data?.emailError}</p>
					)}
					<label htmlFor="password" className="block text-sm font-medium mb-1">
						Password<span className="text-red-500 ml-1">*</span>
					</label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.passwordError && (
						<p className="text-red-500 text-sm mb-2">{data?.passwordError}</p>
					)}
					<button
						type="submit"
						disabled={isPending}
						className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
					>
						Log In
					</button>
				</form>
				<Link className="link-btn underline mt-4 ml-6" href="/register">
					Don&apos;t have an account ? Register here
				</Link>
				<p className="text-xs mt-4">
					<span className="text-red-500 mr-1">*</span>: Mandatory information
				</p>
			</div>
		</div>
	);
}
