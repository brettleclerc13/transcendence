"use client";

import { useActionState, useEffect, useState } from "react";
import { z } from "zod";
import { fetchQrCode, verifyOTP } from "../utilities/profileActions";
import Image from "next/image";

const twoFactorAuthSchema = z.object({
	otp: z
		.number()
		.positive("OTP must be a positive number")
		.refine((val) => val.toString().length === 6, {
			message: "OTP must be of 6 digits",
		}),
});

export default function TwoFactorAuth({
	setAlert,
}: {
	setAlert: (
		alertMessage: { message: string; type: "danger" | "success" } | null
	) => void;
}) {
	const [qrCode, setQrCode] = useState<string | undefined>(undefined);
	const [otpData, otpAction, otpPending] = useActionState(
		handleOtpValidation,
		undefined
	);

	useEffect(() => {
		const fetchQr = async () => {
			const result = await fetchQrCode();
			if (result.ok === false) {
				setAlert({
					message: "Failed to load QR Code for 2FA activation",
					type: "danger",
				});
				return;
			} else {
				setQrCode(result.qr_code);
				return;
			}
		};
		fetchQr();
	}, []);

	async function handleOtpValidation(
		_previousState: unknown,
		formData: FormData
	) {
		const otp = Number(formData.get("otp"));

		const validationResult = twoFactorAuthSchema.safeParse({ otp: otp });

		if (!validationResult.success) {
			return {
				otpError:
					validationResult.error.errors.find((err) => err.path[0] === "otp")
						?.message || "Invalid OTP",
			};
		} else {
			if (validationResult.data) {
				const result = await verifyOTP(validationResult.data);
				if (result.ok === false) {
					setAlert({
						message: result.message || "Failed to activate 2FA",
						type: "danger",
					});
				} else {
					setAlert({
						message: result.message || "2FA activation successful",
						type: "success",
					});
				}
			} else {
				return {
					otpError: "Invalid OTP",
				};
			}
		}
	}

	return (
		<div className="twofa">
			<h3>Enable Two-Factor Authentication</h3>
			{qrCode ? (
				<Image width={200} height={200} src={qrCode} alt="Scan QR Code" />
			) : (
				<p>Loading QR code...</p>
			)}
			<form className="otp-form" action={otpAction}>
				<input
					type="text"
					name="otp"
					id="otp"
					placeholder="Enter 6-digit code"
				/>
				{otpData?.otpError && (
					<p className="input-error">{otpData?.otpError}</p>
				)}
				<button type="submit" disabled={otpPending}>
					{otpPending ? "Loading..." : "Activate 2FA"}
				</button>
			</form>
		</div>
	);
}
