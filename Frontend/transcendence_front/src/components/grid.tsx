"use client"

import { useEffect, useRef } from 'react';

export default function Grid() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		generateGrid();
	}, []);

	function isHovered(cell: HTMLDivElement) {
		if (!cell.hoverCount) {
			function randomRGB() {
				return Math.floor(Math.random() * 256);
			}
			cell.initColor = {
				r : randomRGB(),
				g : randomRGB(),
				b : randomRGB()
			};
			cell.hoverCount = 0;
		}
		cell.hoverCount++;

		const darkeningPercentage = Math.max(1.1 - (0.1 * cell.hoverCount), 0);

		const r = Math.floor(cell.initColor.r * darkeningPercentage);
		const g = Math.floor(cell.initColor.g * darkeningPercentage);
		const b = Math.floor(cell.initColor.b * darkeningPercentage);

		cell.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;
	}

	function generateGrid() {
		const container = containerRef.current;
		if (container) container.innerHTML = '';

		const totalSpacing = 16 * 2;
		let cellDimension = (960 - totalSpacing) / 16;
		// cellDimension = parseInt(cellDimension.toString());

		for (let i = 0; i < 16; i++) {
			for (let j = 0; j < 16; j++) {
				const cell = document.createElement("div");
				cell.classList.add("cell");
				cell.style.width = `${cellDimension}px`;
				cell.style.height = `${cellDimension}px`;
				cell.addEventListener("mouseenter", () => isHovered(cell), true);
				// cell.textContent = `${i}, ${j}`;

				// Ajout des classes Tailwind pour chaque cellule
				cell.className = 'border border-white flex items-center justify-center w-[50px] h-[50px]';

				container.appendChild(cell);
			}
		}
	}
	return <div ref={containerRef} id="container" className="flex flex-wrap w-[960px]"></div>;
}
// function getHumanChoice() {
// let input = prompt("Please choose an integer of squares per side ( Between 1 and 100 )");
// 	input = parseInt(input);
// while (!Number.isInteger(input) || input < 1 || input > 100) {
// 	alert("Error : Wrong entry ! Please choose again.");
// 	input = prompt("Please choose a number of squares per side ( Between 1 and 100 )");
// 			input = parseInt(input);
// }
// return input;
// }