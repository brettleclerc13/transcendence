"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const Grid = forwardRef(function Grid({ onDisappear }: { onDisappear: () => void}, ref) {
	const containerRef = useRef<HTMLDivElement>(null);
	const cellSize = 50;
	const titleHeight = 200;

	useImperativeHandle(ref, () => ({
		resetGrid() {
			if (containerRef.current) {
				containerRef.current.innerHTML = ''; // Effacer toutes les cellules
				generateGrid(window.innerWidth); // Régénérer la grille
			}
		}
	}));

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
				r : 13,
				g : 148,
				b : 136
			};
			cell.hoverCount = 0;
		}
		cell.hoverCount++;
		if (cell.hoverCount >= 2) {
			cell.className = "flex items-center justify-center w-[50px] h-[50px] overflow-hidden";
			cell.classList.add('clickable');
			cell.style.cursor = 'pointer';
		}
		const darkeningPercentage = Math.max(1 - (0.5 * cell.hoverCount), 0);

		const r = Math.floor(cell.initColor.r * darkeningPercentage);
		const g = Math.floor(cell.initColor.g * darkeningPercentage);
		const b = Math.floor(cell.initColor.b * darkeningPercentage);

		cell.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;
	}

	function handleClick(cell: HTMLDivElement) {
		if (cell.hoverCount >= 2) {
			cell.style.opacity = '0'; // Hide the cell by making it transparent
			cell.style.pointerEvents = 'none'; // Disable further interactions with the cell
			onDisappear();
		}
	}

	function generateGrid(largeurPage: number) {
		const container = containerRef.current;
		if (container) container.innerHTML = '';

		const numCols = Math.floor(largeurPage / cellSize); // Nombre de colonnes basées sur la largeur disponible
		const numRows = Math.floor(window.innerHeight / cellSize);
		const middleScreenY = window.innerHeight / 2;

		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numCols; j++) {
				const cell = document.createElement("div");
				cell.classList.add("cell");
				cell.style.width = `${cellSize}px`;
				cell.style.height = `${cellSize}px`;

				// Calcul de la distance de chaque cellule par rapport au centre de la page
				const cellYPosition = i * cellSize;
				const fadeStart = middleScreenY - titleHeight / 2; // Le début du fondu (haut du titre)
				const fadeEnd = middleScreenY + titleHeight / 2; // La fin du fondu (bas du titre)

				// Calcul de l'opacité en fonction de la position de la cellule
				let opacity = 1;
				if (cellYPosition > fadeStart && cellYPosition < fadeEnd) {
					const distanceFromFadeStart = Math.abs(cellYPosition - fadeStart);
					const fadeRange = fadeEnd - fadeStart;
					opacity = 1 - (distanceFromFadeStart / fadeRange); // Réduction progressive de l'opacité
				} else if (cellYPosition >= fadeEnd) {
					opacity = 0; // Les cellules après le titre deviennent complètement transparentes
				}

				cell.style.opacity = `${opacity}`;

				cell.addEventListener("mouseenter", () => isHovered(cell), true);
				cell.addEventListener('click', () => handleClick(cell), true);

				cell.className = 'border border-teal-900/50 flex items-center justify-center w-[50px] h-[50px] overflow-hidden';

				container.appendChild(cell);
			}
		}
	}

	const resetGrid = () => {
		if (containerRef.current) {
			containerRef.current.innerHTML = ''; // Clear previous grid cells
			const largeurPage = window.innerWidth; // Recalculate width for grid
			generateGrid(largeurPage); // Generate the grid again
		}
	};

	return <div ref={containerRef} id="container" className="flex flex-wrap w-full overflow-hidden"></div>;
});

export default Grid;