"use client";
/// <reference path="/global.d.ts" />
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import "./headerComponent.css";
import { isUserLoggedIn } from "../utilities/userClientActions";
import lottie from "lottie-web";
import { defineElement } from "@lordicon/element";

export default function Menu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		defineElement(lottie.loadAnimation);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setTimeout(() => setIsMenuOpen(false), 100);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="menu-main">
			{/* @ts-ignore */}
			<lord-icon
				trigger="hover"
				src="/img/wired-gradient-1062-disco-ball-hover-pinch.json"
				style={{ width: "60px", height: "60px", cursor: "pointer" }}
				onClick={() => setIsMenuOpen(!isMenuOpen)}
			/>

			{isMenuOpen && (
				<div ref={menuRef} className="menu-container">
					<nav className="menu-links">
						<Link href="/" className="menu-button-select">
							Home
						</Link>
						<Link key="lobby" href="/lobby" className="menu-button-select">
							Game
						</Link>
						<Link key="aboutUs" href="/aboutUs" className="menu-button-select">
							About Us
						</Link>
						{isUserLoggedIn() && (
							<Link
								key="liveChat"
								href="/liveChat"
								className="menu-button-select"
							>
								Live Chat
							</Link>
						)}
					</nav>
				</div>
			)}
		</div>
	);
}
