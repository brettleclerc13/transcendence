"use client";

import { useState, useEffect } from "react";
import "./heroTitle.css"

export default function Title() {
	const [displayedText, setDisplayedText] = useState("");
	const [showCursor, setShowCursor] = useState(true);
	const [isFirstTypingComplete, setIsFirstTypingComplete] = useState(false);
	const [isFinalTypingComplete, setIsFinalTypingComplete] = useState(false);
	const fullTextDance = "ft_transcendance🕺🏽🪩";
	const fullText = "ft_transcendence";
	const typingSpeed = 150;
	const deleteSpeed = 50;
	const cursorBlinkSpeed = 500;

	// First typing animation
	useEffect(() => {
		let index = 0;

		const intervalId = setInterval(() => {
			if (index <= fullTextDance.length) {
				setDisplayedText(fullTextDance.slice(0, index + 1));
				index++;
			} else {
				clearInterval(intervalId);
				setIsFirstTypingComplete(true);
			}
		}, typingSpeed);

		return () => clearInterval(intervalId);
	}, []);

	// Cursor blinking
	useEffect(() => {
		if (isFirstTypingComplete) {
			const blinkInterval = setInterval(() => {
				setShowCursor((prev) => !prev);
			}, cursorBlinkSpeed);

			return () => clearInterval(blinkInterval);
		} else {
			setShowCursor(true);
		}
	}, [isFirstTypingComplete]);

	// Text deletion until "d" and final typing
	useEffect(() => {
		if (isFirstTypingComplete) {
			setTimeout(() => {
				let index = fullTextDance.length;

				const deleteInterval = setInterval(() => {
					if (index > fullText.indexOf("d")) {
						setDisplayedText(fullTextDance.slice(0, index - 1));
						index--;
					} else {
						clearInterval(deleteInterval);
						setIsFinalTypingComplete(true);
					}
				}, deleteSpeed);

				return () => clearInterval(deleteInterval);
			}, 700);
		}
	}, [isFirstTypingComplete]);

	// Final typing of fullText
	useEffect(() => {
		if (isFinalTypingComplete) {
			let index = fullText.indexOf("d"); // Start typing from the "d"

			const finalTypingInterval = setInterval(() => {
				if (index <= fullText.length) {
					setDisplayedText(fullText.slice(0, index + 1));
					index++;
				} else {
					clearInterval(finalTypingInterval);
				}
			}, typingSpeed);

			return () => clearInterval(finalTypingInterval);
		}
	}, [isFinalTypingComplete]);

	return (
		<h1 className="title-text">
			{displayedText}
			<span
				className="cursor"
				style={{ backgroundColor: showCursor ? "white" : "transparent" }}
			/>
		</h1>
	);
}
