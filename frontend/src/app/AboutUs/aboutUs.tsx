// import React, { useEffect, useState } from "react";
// import { FormProps } from "@/app/types";

// export interface AboutUsProps {
// 	onBackClick: () => void;
// }

// export default function AboutUsLayer({ onBackClick }: AboutUsProps) {
	// const textAboutUs = "About us:";
	// const typingSpeed = 150;

	// useEffect(() => {
	// 	let index = 0;

	// 	const intervalId = setInterval(() => {
	// 		if (index <= textAboutUs.length) {
	// 			setDisplayedText(textAboutUs.slice(0, index + 1));
	// 			index++;
	// 		}
	// 	}, typingSpeed);

	// 	return () => clearInterval(intervalId);
	// }, []);

// 	return (
// 		<div onClick={onBackClick} className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">
// 			<h1 className="align-top justify-center ">ABOUT US</h1>
// 		</div>
// 	);
// }