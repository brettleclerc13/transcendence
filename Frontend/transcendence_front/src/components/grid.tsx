"use client"

import { useEffect, useRef } from 'react';

export default function Grid() {
	const containerRef = useRef<HTMLDivElement>(null);
	const cellSize = 50;

	useEffect(() => {
		const updateGrid = () => {
			const largeurPage = window.innerWidth;
			generateGrid(largeurPage);
		  };

		// Appel initial pour générer la grille au chargement
		updateGrid();

		// Écouteur d'événement pour redimensionner la grille quand la fenêtre est redimensionnée
		window.addEventListener('resize', updateGrid);

		// Cleanup de l'événement lors du démontage du composant
		return () => window.removeEventListener('resize', updateGrid);
	}, []);

	function isHovered(cell: HTMLDivElement) {
		if (!cell.hoverCount) {
			cell.initColor = {
				r : 62,
				g : 68,
				b : 160
			};
			cell.hoverCount = 0;
		}
		cell.hoverCount++;

		const darkeningPercentage = Math.max(1 - (0.5 * cell.hoverCount), 0);

		const r = Math.floor(cell.initColor.r * darkeningPercentage);
		const g = Math.floor(cell.initColor.g * darkeningPercentage);
		const b = Math.floor(cell.initColor.b * darkeningPercentage);

		cell.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;
	}

	function generateGrid(largeurPage: number) {
		const container = containerRef.current;
		if (container) container.innerHTML = '';

		const numCols = Math.floor(largeurPage / cellSize); // Nombre de colonnes basées sur la largeur disponible
		const numRows = Math.floor(window.innerHeight / cellSize);
		// const totalSpacing = 16 * 2;
		// let cellDimension = (largeurPage - totalSpacing) / 16;
		// cellDimension = parseInt(cellDimension.toString());

		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numCols; j++) {
				const cell = document.createElement("div");
				cell.classList.add("cell");
				cell.style.width = `${cellSize}px`;
				cell.style.height = `${cellSize}px`;
				cell.addEventListener("mouseenter", () => isHovered(cell), true);

				// Ajout des classes Tailwind pour chaque cellule
				cell.className = 'border border-blue-900/50 flex items-center justify-center w-[50px] h-[50px]';

				container.appendChild(cell);
			}
		}
	}
	return <div ref={containerRef} id="container" className="flex flex-wrap w-full"></div>;
}
