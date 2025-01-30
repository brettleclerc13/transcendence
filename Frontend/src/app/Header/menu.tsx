"use client"

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import "./headerComponent.css"
import { isUserLoggedIn } from "../utilities/userActions";

export default function Menu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setTimeout(() =>setIsMenuOpen(false), 100);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
		document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<>
			<button
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="menu-button"
					aria-label="Toggle menu"
				>
					&#9776; {/* Icon for burger menu */}
			</button>

			{isMenuOpen && (
                <div ref={menuRef} className="menu-container">
                    <nav className="menu-links">
                        <Link href="/" className="menu-button">
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