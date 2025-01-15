'use client'

import React, { useState, useActionState } from "react";
import Link from "next/link"
import { login } from "@/app/utilities/actions";
import { useRouter } from 'next/navigation';


export default function LoginForm() {
	const [alert, setAlert] = useState<{ message: string, type: string } | null>(null);
	const router = useRouter();

	const [data, action, isPending] = useActionState(handleSubmit, undefined);

	async function handleSubmit(previousState: unknown, formData: FormData) {
		const email = formData.get("email") as string;
		const pass = formData.get("password") as string

		if (!email || !pass) {
			if (!email)
				return { emailError: "Email is required." };
			else
				return { passwordError: "Password is required." };
		}

		console.log("Login request data: ", { email: email, password: pass, });

		try {
			await login({ email, pass });
			setAlert({ message: "Login successful! Redirecting...", type: "success" });
			setTimeout(() => {
				router.push('/');
			}, 2000);

		} catch (error) {
			return { error: String(error), fieldData: { email } };
		}
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
						defaultValue={data?.fieldData?.email}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.emailError && <p className="text-red-500 text-sm mb-2">{data?.emailError}</p>}
					<label htmlFor="password" className="block text-sm font-medium mb-1">Password<span className="text-red-500 ml-1">*</span></label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						name="password"
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{data?.passwordError && <p className="text-red-500 text-sm mb-2">{data?.passwordError}</p>}
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
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}
