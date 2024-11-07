import React, {useState } from "react";
import { FormProps } from "@/app/types";

export default function RegisterForm({ onBackClick, onFormSwitch }: FormProps) {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [pass, setPass] = useState("");
	const [age, setAge] = useState("");
	const [nationality, setNationality] = useState("");
	const [bio, setBio] = useState("");
	const [errors, setErrors] = useState({ email: "", username: "", pass: "" });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		let formIsValid = true;
		const newErrors = {email: "", username: "", pass: "" };

		if (!email) {
			newErrors.email = "Email is required.";
			formIsValid = false;
		}
		if (!username) {
			newErrors.username = "Username is required.";
			formIsValid = false;
		}
		if (!pass) {
			newErrors.pass = "Password is required.";
			formIsValid = false;
		}

		setErrors(newErrors);

		if (!formIsValid) {
			return;
		}
		console.log(email, username, pass, age, nationality, bio);
		onBackClick();
	};

	return (
		<div className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg w-96">
				<button 
					onClick={() => onBackClick()} 
					className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl font-bold"
				>
					&times;
				</button>
				<form onSubmit={handleSubmit}>
					<label htmlFor="email" className="block text-sm font-medium mb-1">Email<span className="text-red-500 ml-1">*</span></label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.email && <p className="text-red-500 text-sm mb-2">{errors.email}</p>}
					<label htmlFor="username" className="block text-sm font-medium mb-1">Username<span className="text-red-500 ml-1">*</span></label>
					<input
						type="username"
						placeholder="JohnDoe"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.username && <p className="text-red-500 text-sm mb-2">{errors.username}</p>}
					<label htmlFor="password" className="block text-sm font-medium mb-1">Password<span className="text-red-500 ml-1">*</span></label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						value={pass}
						onChange={(e) => setPass(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					{errors.pass && <p className="text-red-500 text-sm mb-2">{errors.pass}</p>}
					<label htmlFor="age" className="block text-sm font-medium mb-1">Age</label>
					<input
						type="age"
						placeholder="77"
						id="age"
						value={age}
						onChange={(e) => setAge(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="nationality" className="block text-sm font-medium mb-1">Nationality</label>
					<input
						type="nationality"
						placeholder="French"
						id="nationality"
						value={nationality}
						onChange={(e) => setNationality(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
					<input
						type="bio"
						placeholder="Hi there ! I'm John Doe the greatest"
						id="bio"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<button
						type="submit"
						className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
					>
						Sign Up
					</button>
				</form>
				<button className="link-btn underline mt-4 ml-6" onClick={onFormSwitch}>
					Already have an account ? Login here
				</button>
				<p className="text-xs mt-4"><span className="text-red-500 mr-1">*</span>: Mandatory information</p>
			</div>
    	</div>
	);
}
