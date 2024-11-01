import Link from "next/link";
import { useState } from "react";

export default function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex justify-between items-center">
			{/* Menu burger à gauche */}
			<button 
				onClick={() => setIsMenuOpen(!isMenuOpen)} 
				className="flex items-center text-xl">
				&#9776; {/* Icône de menu burger */}
			</button>

			{/* Menu burger (mobile) */}
			{isMenuOpen && (
				<div className="absolute top-16 left-0 w-52 h-screen bg-gray-800 p-4 flex flex-col items-center">
				<Link href="/" className="border-b-2 py-4 text-white">Accueil</Link>
				<Link href="/profil" className="border-b-2 py-4 text-white">Profil</Link>
				<Link href="/settings" className="border-b-2 py-4 text-white">Paramètres</Link>
				</div>
			)}

			{/* Titre centré */}
			<h1 className="text-xl font-bold mx-auto">DISCO PONG !</h1>

			{/* Boutons à droite */}
			<div className="flex space-x-4">
				<Link href="/login" className="py-2bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
				Login
				</Link>
				<Link href="/signup" className="py-2bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
				Sign Up
				</Link>
			</div>
		</header>
	);
}