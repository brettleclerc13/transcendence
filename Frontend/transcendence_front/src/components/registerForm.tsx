import {useState } from "react";

export default function RegisterForm({ onBackClick }) {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [pass, setPass] = useState("");
	const [age, setAge] = useState("");
	const [nationality, setNationality] = useState("");
	const [bio, setBio] = useState("");
	
	const handleSubmit = (e) => {
		e.preventDefault();
		console.log(email, username, pass, age, nationality, bio);
		onBackClick(false);
	};

	return (
		<div className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg w-96">
				<button 
					onClick={() => onBackClick(false)} 
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
				>
					&times;
				</button>
				<form onSubmit={handleSubmit}>
					<label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
					<input
						type="email"
						placeholder="youremail@gmail.com"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
					<input
						type="username"
						placeholder="JohnDoe"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
					<label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
					<input
						type="password"
						placeholder="*************"
						id="password"
						value={pass}
						onChange={(e) => setPass(e.target.value)}
						className="border rounded-md p-2 mb-4 w-full"
					/>
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
			</div>
    	</div>
	);
}
