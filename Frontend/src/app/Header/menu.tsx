"use client"

import { useState } from "react";
import Link from "next/link";
import "./headerComponent.css"
import { isUserLoggedIn } from "../utilities/isLoggedIn";

export default function Menu( { section } : { section : string } ) {
	const [isMenuOpen, setMenuOpen] = useState(false);

	const toggleMenu = () => {
    	setMenuOpen(!isMenuOpen);
    };

	return (
		<>
			<button
					onClick={toggleMenu}
					className="menu-button"
					aria-label="Toggle menu"
				>
					&#9776; {/* Icon for burger menu */}
			</button>

			{isMenuOpen && (
                <div className="menu-container">
                    <button
                        onClick={toggleMenu}
                        className="close-menu-button"
                        aria-label="Close menu"
                    >
                        ×
                    </button>
                    <nav className="menu-links">
                        <Link key="home" href="/home" className="menu-button">
                            Home
                        </Link>
                        <Link key="play" href="/play" className="menu-button">
                            Game
                        </Link>
                        <Link key="aboutUs" href="/aboutUs" className="menu-button">
                            About Us
                        </Link>
                        {isUserLoggedIn() && (
                            <Link key="liveChat" href="/liveChat" className="menu-button">
                                Live Chat
                            </Link>
                        )}
                    </nav>
                </div>
            )}
		</>
	);
}