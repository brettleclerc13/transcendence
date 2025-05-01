"use client";

import { useActionState, useEffect, useState } from "react";
import { z } from "zod";
import {
	fetchQrCode,
	checkTwoFactorActivation,
	enable2FA,
	disable2FA,
} from "../utilities/profileActions";
import Image from "next/image";
import "./profile.css";

const twoFactorAuthSchema = z.object({
	otp: z
		.string()
		.length(6, "OTP code must be 6 digits")
		.regex(/^\d+$/, "OTP code must contain only digits"),
});

export default function TwoFactorAuth({
	setAlert,
}: {
	setAlert: (
		alertMessage: { message: string; type: "danger" | "success" } | null,
	) => void;
}) {
	const [qrCode, setQrCode] = useState<string | undefined>(undefined);
	const [isActive, setIsActive] = useState<boolean>(false);
	const [otpData, otpAction, otpPending] = useActionState(
		handleTwoFactorAuthActivation,
		undefined,
	);

	const checkTwoFactor = async () => {
		const twoFaActiveResult = await checkTwoFactorActivation();
		if (
			twoFaActiveResult &&
			twoFaActiveResult.ok &&
			"has_2fa" in twoFaActiveResult
		) {
			setIsActive(twoFaActiveResult.has_2fa);
		} else {
			setAlert({
				message: twoFaActiveResult.error || "Failed to check 2FA activation",
				type: "danger",
			});
		}
	};

	const prepareAuthSetUp = async () => {
		const QrResult = await fetchQrCode();
		if (QrResult && !QrResult.ok) {
			setAlert({
				message: "Failed to load QR Code for 2FA activation",
				type: "danger",
			});
		} else {
			setQrCode(QrResult.qr_code);
		}

		await checkTwoFactor();
	};

	useEffect(() => {
		prepareAuthSetUp();
	}, []);

	async function handleTwoFactorAuthActivation(
		_previousState: unknown,
		formData: FormData,
	) {
		const otp = formData.get("otp");

		const validationResult = twoFactorAuthSchema.safeParse({ otp: otp });

		if (!validationResult.success) {
			return {
				otpError:
					validationResult.error.errors.find((err) => err.path[0] === "otp")
						?.message || "Invalid OTP",
			};
		} else {
			if (validationResult.data) {
				let result;
				if (isActive) result = await disable2FA(validationResult.data);
				else result = await enable2FA(validationResult.data);
				if (result && result.ok && "message" in result) {
					setAlert({
						message:
							result.message ||
							`2FA ${isActive} ? "deactivation successful" : "activation successful"`,
						type: "success",
					});
				} else {
					setAlert({
						message: result.error || "Failed to activate 2FA",
						type: "danger",
					});
				}
			} else {
				return {
					otpError: "Invalid OTP",
				};
			}
			await prepareAuthSetUp();
		}
	}

	return (
		<div className="twofa-container">
			<h3>Enable Two-Factor Authentication</h3>
			{qrCode ? (
				<Image width={200} height={200} src={qrCode} alt="Scan QR Code" />
			) : (
				<p>Loading QR code...</p>
			)}
			<form className="otp-form">
				<input
					type="text"
					name="otp"
					id="otp"
					placeholder="Enter 6-digit code"
				/>
				{otpData?.otpError && (
					<p className="input-error">{otpData?.otpError}</p>
				)}
				{isActive ? (
					<button
						type="submit"
						formAction={otpAction}
						disabled={otpPending}
						className="button-disable"
					>
						{otpPending ? "Loading..." : "Disable 2FA"}
					</button>
				) : (
					<button
						type="submit"
						formAction={otpAction}
						disabled={otpPending}
						className="button-enable"
					>
						{otpPending ? "Loading..." : "Enable 2FA"}
					</button>
				)}
			</form>
		</div>
	);
}
