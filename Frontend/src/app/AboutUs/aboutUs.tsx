import React, { useEffect, useState } from "react";
import { FormProps } from "@/app/types";
import Carousel from "../../components/carouselBootStrap"
import "./aboutUs.css"

export interface AboutUsProps {
	onBackClick: () => void;
}

export default function AboutUsLayer() {
	const [displayedText, setDisplayedText] = useState('');
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

	return (
		<div className="aboutus-container">
			<h1 className="aboutus-title">{displayedText}</h1>
			<h2 className="aboutus-description">
				This website is a project related to the 42 school, consisting of setting up a one-page and implementing the Pong game. Other aspects of development such as a database, a backend and others are integrated into our project. Hoping you will enjoy the visit!
			</h2>
			<div className="carousel-container">
				<Carousel />
			</div>
		</div>
	);
}
