"use client";

import { useState, useEffect } from "react";
import Hero from "./hero";

export default function HeroWrapper() {
	const [showFirstLayer, setShowFirstLayer] = useState(false);

	useEffect(() => {
		setTimeout(() => {
			setShowFirstLayer(true);
		}, 500);
	}, []);

	return <Hero showFirstLayer={showFirstLayer} />;
}
