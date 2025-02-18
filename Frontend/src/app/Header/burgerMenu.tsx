"use client"

import { useState } from "react";

export default function BurgerMenu() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

	const handleClick = ( isMenuOpen : boolean ) => () => {
		if (isMenuOpen)
			setIsMenuOpen(false);
		else
			setIsMenuOpen(true);
	}

	return (
		<button onClick={() => handleClick(isMenuOpen)} className="menu-button">
			&#9776; {/* Icône de menu burger */}
		</button>
	);
}
