import { useState } from "react";

export default function LoginForm({ onBackClick }) {
	const [email, setEmail] = useState("");
	const [pass, setPass] = useState("");
	
	const handleSubmit = (e) => {
		e.preventDefault();
		console.log(email, pass);
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
				<label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
				<input
					type="password"
					placeholder="*************"
					id="password"
					value={pass}
					onChange={(e) => setPass(e.target.value)}
					className="border rounded-md p-2 mb-4 w-full"
				/>
				<button
					type="submit"
					className="text-white bg-teal-600 hover:bg-teal-700 rounded-md p-2 w-full"
				>
					Log In
				</button>
				</form>
			</div>
    	</div>
	);
}
