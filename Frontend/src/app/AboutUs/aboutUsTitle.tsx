"use client";

import React, { useEffect, useState } from "react";
import "./aboutUs.css";

export default function AboutUsTitle() {
	const [displayedText, setDisplayedText] = useState("");
	const textAboutUs = "About us:";
	const typingSpeed = 150;

	useEffect(() => {
		let index = 0;

		const intervalId = setInterval(() => {
			if (index <= textAboutUs.length) {
				setDisplayedText(textAboutUs.slice(0, index + 1));
				index++;
			}
		}, typingSpeed);

		return () => clearInterval(intervalId);
	}, []);

	return <h1 className="aboutus-title">{displayedText}</h1>;
}
