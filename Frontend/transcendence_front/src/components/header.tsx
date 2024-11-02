import Link from "next/link";
import { useState } from "react";
import LoginButton from "./loginButton";
import RegisterButton from "./registerButton";

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
				<LoginButton />
				<RegisterButton />
			</div>
		</header>
	);
}