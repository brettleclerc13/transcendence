"use client";

import React, { useState, useActionState } from "react";
import "./profile.css";
import { updateUserProfile } from "../utilities/profileActions";
import { z } from "zod";
import ProfileImage from "./profileImage";

import type { UserProfileData } from "../utilities/profileActions";
import MatchHistory from "./matchHistory";

type ProfileProps = {
	userProfile: UserProfileData | null;
	setUserProfile: (newProfile: UserProfileData) => void;
	setIsProfileOpen: (isProfileOpen: boolean) => void;
};

export const profileSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(32, "Username is too long"),
	email: z
		.string()
		.email("Invalid email format")
		.max(254, "Email address is too long"),
	age: z
		.number()
		.positive("Age must be a positive number")
		.max(
			123,
			"The oldest human, Jeanne Calment, lived till the age of 122 years"
		)
		.optional(),
	nationality: z.string().max(254, "Nationality is too long").optional(),
	tournament_name: z
		.string()
		.min(3, "Alias must be at least 3 characters long")
		.max(32, "Alias is too long")
		.optional(),
	bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
	old_password: z
		.string()
		.min(8)
		.max(128)
		.regex(
			/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#?_])[a-zA-Z0-9!@#?_]+$/,
			"Password must contain an uppercase letter, a number, and a special character (! @ # ? _)"
		)
		.optional(),
	new_password: z
		.string()
		.min(8)
		.max(128)
		.regex(
			/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#?_])[a-zA-Z0-9!@#?_]+$/,
			"Password must contain an uppercase letter, a number, and a special character (! @ # ? _)"
		)
		.optional(),
});

export default function Profile({
	userProfile,
	setUserProfile,
	setIsProfileOpen,
}: ProfileProps) {
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);

	const [profileData, profileAction, profilePending] = useActionState(
		handleUserProfileUpdate,
		undefined
	);

	async function handleUserProfileUpdate(
		_previousState: unknown,
		formData: FormData
	) {
		const profileInput = {
			username: formData.get("username"),
			email: formData.get("email"),
			age: formData.get("age") ? Number(formData.get("age")) : undefined,
			nationality: formData.get("nationality") || undefined,
			tournament_name: formData.get("tournamentName") || undefined,
			bio: formData.get("bio") || undefined,
			old_password: formData.get("oldPassword") || undefined,
			new_password: formData.get("newPassword") || undefined,
		};

		const validationResult = profileSchema.safeParse(profileInput);

		if (!validationResult.success) {
			const emailError = validationResult.error.errors.find(
				(err) => err.path[0] === "email"
			);
			const usernameError = validationResult.error.errors.find(
				(err) => err.path[0] === "username"
			);
			const ageError = validationResult.error.errors.find(
				(err) => err.path[0] === "age"
			);
			const nationalityError = validationResult.error.errors.find(
				(err) => err.path[0] === "nationality"
			);
			const tournamentNameError = validationResult.error.errors.find(
				(err) => err.path[0] === "tournament_name"
			);
			const bioError = validationResult.error.errors.find(
				(err) => err.path[0] === "bio"
			);
			const oldPasswordError = validationResult.error.errors.find(
				(err) => err.path[0] === "old_password"
			);
			const newPasswordError = validationResult.error.errors.find(
				(err) => err.path[0] === "new_password"
			);
			return {
				emailError: emailError ? emailError.message : undefined,
				usernameError: usernameError ? usernameError.message : undefined,
				ageError: ageError ? ageError.message : undefined,
				nationalityError: nationalityError
					? nationalityError.message
					: undefined,
				tournamentNameError: tournamentNameError
					? tournamentNameError
					: undefined,
				bioError: bioError ? bioError.message : undefined,
				oldPasswordError: oldPasswordError
					? oldPasswordError.message
					: undefined,
				newPasswordError: newPasswordError
					? newPasswordError.message
					: undefined,
			};
		}

		const result = await updateUserProfile(validationResult.data);
		if (!result.ok) {
			setAlert({
				message: `Error updating your profile: ${result.error}`,
				type: "danger",
			});
			return;
		} else {
			setUserProfile({ ...userProfile, ...validationResult.data });
			setAlert({
				message: "Your profile has been successfully updated!",
				type: "success",
			});
		}
	}

	if (!userProfile) {
		return <div>Failed to load profile.</div>;
	}

	return (
		<div className="profile-container">
			{alert && (
				<div className={`alert alert-${alert.type} alert-box`} role="alert">
					{alert.message}
					<button
						type="button"
						className="close"
						onClick={() => setAlert(null)}
						aria-label="Close"
					>
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
			)}
			<ProfileImage
				userProfile={userProfile}
				setUserProfile={setUserProfile}
				setAlert={setAlert}
			/>
			<form action={profileAction}>
				<div className="contour-informations">
					<div className="left-informations">
						<div>
							<label htmlFor="username">Username:</label>
							<input
								type="text"
								name="username"
								id="username"
								autoComplete="username"
								defaultValue={userProfile.username}
							/>
						</div>
						{profileData?.usernameError && (
							<p className="input-error">{profileData?.usernameError}</p>
						)}
						<div>
							<label htmlFor="email">Email:</label>
							<input
								type="email"
								name="email"
								id="email"
								defaultValue={userProfile.email}
								autoComplete="email"
							/>
						</div>
						{profileData?.emailError && (
							<p className="input-error">{profileData?.emailError}</p>
						)}
						<div>
							<label htmlFor="age">Age:</label>
							<input
								type="number"
								name="age"
								id="age"
								defaultValue={userProfile?.age}
							/>
						</div>
						{profileData?.ageError && (
							<p className="input-error">{profileData?.ageError}</p>
						)}
						<div>
							<label htmlFor="nationality">Nationality:</label>
							<input
								type="text"
								name="nationality"
								id="nationality"
								defaultValue={userProfile?.nationality}
							/>
						</div>
						{profileData?.nationalityError && (
							<p className="input-error">{profileData?.nationalityError}</p>
						)}
						<div>
							<label htmlFor="current_password">Old Password:</label>
							<input type="password" name="oldPassword" id="current_password" />
						</div>
						{profileData?.oldPasswordError && (
							<p className="input-error">{profileData?.oldPasswordError}</p>
						)}
						<div>
							<label htmlFor="new_password">New Password:</label>
							<input type="password" name="newPassword" id="new_password" />
						</div>
						{profileData?.newPasswordError && (
							<p className="input-error">{profileData?.newPasswordError}</p>
						)}
					</div>

					<div className="separator"></div>

					<div className="right-informations">
						<div>
							<label htmlFor="nickname">Alias (Tournament name):</label>
							<input
								type="text"
								name="tournamentName"
								id="nickname"
								defaultValue={userProfile?.tournament_name}
								autoComplete="nickname"
							/>
						</div>
						{profileData?.nationalityError && (
							<p className="input-error">{profileData?.nationalityError}</p>
						)}
						<div>
							<label htmlFor="bio">Bio:</label>
							<textarea
								name="bio"
								id="bio"
								placeholder="Whatever!"
								defaultValue={userProfile?.bio}
							/>
						</div>
						{profileData?.bioError && (
							<p className="input-error">{profileData?.bioError}</p>
						)}
						<MatchHistory setAlert={setAlert} />
						<div className="button-container">
							<button
								className="button-save"
								type="submit"
								disabled={profilePending}
							>
								Save
							</button>
							<button
								className="button-cancel"
								onClick={() => setIsProfileOpen(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
