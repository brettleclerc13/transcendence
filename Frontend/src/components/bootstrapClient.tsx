"use client";
import { useEffect } from "react";

export default function BootstrapClient() {
	useEffect(() => {
		import("bootstrap/dist/js/bootstrap.bundle.min.js")
			.then(() => {
				console.log("Bootstrap chargé !");
			})
			.catch((err) => console.error("Erreur lors du chargement de Bootstrap :", err));
	}, []);

	return null;
}
