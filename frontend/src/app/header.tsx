import { useState } from "react";

export interface MenuProps {
	goToSection: (section:string) => void;
}

export default function Header({goToSection}:MenuProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center z-40">
			{/* Menu burger à gauche */}
			<button 
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className="flex items-center text-xl">
				&#9776; {/* Icône de menu burger */}
			</button>

			{/* Menu burger (mobile) */}
			{isMenuOpen && (
				<div className="absolute top-16 left-0 w-52 h-screen bg-gray-800 p-4 flex flex-col items-center">
				<button onClick={() => goToSection('home')} className="border-b-2 py-4 text-white">Home</button>
				<button onClick={() => goToSection('game')} className="border-b-2 py-4 text-white">Game</button>
				<button onClick={() => goToSection('aboutUs')} className="border-b-2 py-4 text-white">About Us</button>
				</div>
			)}
			<h1 className="text-xl font-bold mx-auto">DISCO PONG !</h1>
			<div className="flex space-x-4">
				<button onClick={() => goToSection('login')} className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
					Login
				</button>
				<button onClick={() => goToSection('register')} className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
					Sign Up
				</button>
			</div>
		</header>
	);
}
