'use client'

import { useState, useRef } from "react";
import Grid from "../components/grid"
import Title from "../components/title"
import BackButton from "@/components/backButton";

export default function Home() {
  const [showFirstLayer, setShowFirstLayer] = useState(true);
	const [showBlackLayer, setShowBlackLayer] = useState(false);
  const gridRef = useRef<any>(null);

  const handleDisappear = () => {
    setShowFirstLayer(false);

    setTimeout(() => {
      setShowBlackLayer(true);
    }, 500);
  };

  const handleReappear = () => {
    setShowBlackLayer(false);
    setShowFirstLayer(true);
    if (gridRef.current) {
      gridRef.current.resetGrid();
    }
  };

  return (
    <div className="relative h-screen flex justify-center items-center bg-teal-600">
        <Grid ref={gridRef} onDisappear={handleDisappear}/>
        {showFirstLayer && (
          <div className="absolute shadow-lg shadow-gray-900 bg-gray-800 text-white rounded-full px-8 py-4 pointer-events-none transition-opacity duration-500 ${!showFirstLayer ? 'opacity-0' : 'opacity-100'}">
            <Title />
          </div>
        )}
        {showBlackLayer && (
				<div className="absolute inset-0 bg-black transition-opacity duration-500 opacity-100 z-20">
					<BackButton onReappear={handleReappear}/>
				</div>
			)}
    </div>
  );
}

//relative flex flex-col items-center justify-center h-full z-10 pointer-events-none