"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import "./headerComponent.css";

export default function DiscoBallButton({
	toggleMenu,
}: {
	toggleMenu: () => void;
}) {
	const [isClicked, setIsClicked] = useState(false);

	const handleClick = () => {
		setIsClicked(true);
		setTimeout(() => {
			setIsClicked(false);
			toggleMenu();
		}, 800); // Attendre la fin de l'animation
	};

	return (
		<motion.button
			onClick={handleClick}
			className="disco-button"
			aria-label="Toggle menu"
			animate={{ y: isClicked ? -200 : 0 }} // Monte et sort de l'écran
			transition={{ duration: 0.8, ease: "easeInOut" }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="50"
				height="50"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="disco-icon"
			>
				<circle cx="12" cy="12" r="10" stroke="black" fill="gray" />
				<line x1="12" y1="2" x2="12" y2="4" stroke="black" />
				<line x1="12" y1="20" x2="12" y2="22" stroke="black" />
				<line x1="2" y1="12" x2="4" y2="12" stroke="black" />
				<line x1="20" y1="12" x2="22" y2="12" stroke="black" />
			</svg>
		</motion.button>
	);
}
