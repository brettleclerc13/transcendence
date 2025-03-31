"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./grid.css";

const cellSize = 48;

export default function Grid() {
	const [cells, setCells] = useState<
		{ id: string; state: number; originX: number; rotate: number }[]
	>([]);

	useEffect(() => {
		generateGrid();
		window.addEventListener("resize", generateGrid);
		return () => window.removeEventListener("resize", generateGrid);
	}, []);

	function generateGrid() {
		const numCols = Math.floor(window.innerWidth / cellSize) + 1;
		const numRows = Math.floor(window.innerHeight / cellSize);

		const newCells = [];
		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numCols; j++) {
				newCells.push({ id: `${i}-${j}`, state: 0, originX: 0, rotate: 0 });
			}
		}
		setCells(newCells);
	}

	function handleHover(id: string) {
		setCells((prevCells) =>
			prevCells.map((cell) => {
				if (cell.id === id) {
					const newOriginX = Math.random() < 0.5 ? 0 : 1;
					return {
						...cell,
						state: cell.state < 2 ? cell.state + 1 : 2,
						originX: newOriginX,
						rotate: newOriginX === 0 ? 30 : -30,
					};
				}
				return cell;
			}),
		);
	}

	return (
		<div className="grid-container">
			{cells.map(({ id, state, originX, rotate }) => (
				<motion.div
					key={id}
					className="cell"
					initial={{}}
					animate={
						state === 1
							? {
									rotate: rotate,
									originX: originX,
									originY: 0,
								}
							: state === 2
								? { y: 100, opacity: 0 }
								: {}
					}
					transition={{ type: "spring", stiffness: 100, duration: 0.5 }}
					onMouseEnter={() => handleHover(id)}
				/>
			))}
		</div>
	);
}
