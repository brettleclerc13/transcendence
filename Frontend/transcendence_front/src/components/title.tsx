'use client'

import { useState, useEffect } from "react";

export default function Title () {
	const [displayedText, setDisplayedText] = useState('');
	const [showCursor, setShowCursor] = useState(true);
	const [isTypingComplete, setIsTypingComplete] = useState(false);
	const fullText = "ft_transcendence";
	const typingSpeed = 150;
	let cursorBlinkSpeed = 500;

	useEffect(() => {
		let index = 0;

		const intervalId = setInterval(() => {
			if (index <= fullText.length) {
				setDisplayedText(fullText.slice(0, index + 1));
        		index++;
			} else {
				clearInterval(intervalId);
				setIsTypingComplete(true);
			}
		}, typingSpeed);

		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		if (isTypingComplete) {
			const blinkInterval = setInterval(() => {
				setShowCursor(prev => !prev);
			}, cursorBlinkSpeed);

			return () => clearInterval(blinkInterval);
		} else {
			setShowCursor(true);
		}
	}, [isTypingComplete]);

	return (
		<h1 className="text-5xl text-white font-mono">
			{displayedText}
			<span className="inline-block w-1 h-9" style={{ backgroundColor: showCursor ? 'white' : 'transparent' }} />
		</h1>
	);
}
