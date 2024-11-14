'use-client'

import BackButton from "@/components/backButton";
import { useState, useEffect } from "react";

export interface GameProps {
	onBackClick: () => void;
}

export default function Game({onBackClick}:GameProps) {

	const [count, setCount] = useState<number>(0);

	useEffect(() => {
        const fetchCount = async () => {
            try {
                const response = await fetch("http://localhost:8001/counter/");
                const data = await response.json();
                setCount(data.count);
            } catch (error) {
                console.error("Error fetching count:", error);
            }
        };
        fetchCount();
    }, []);

	// Increment the count when the button is clicked
    const handleIncrement = async () => {
        try {
            const response = await fetch("http://localhost:8001/counter/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            setCount(data.count);
        } catch (error) {
            console.error("Error incrementing count:", error);
        }
    };

	return (
		<div className="w-full h-screen flex bg-teal-800">
			<div className="absolute top-24 left-4 w-fit h-fit inset-0 transition-opacity duration-500 opacity-100">
				<BackButton onReappear={onBackClick}/>
			</div>
			<div className="flex justify-center items-center h-full w-full">
				<button
					className="TEST-BUTTON w-fit h-fit px-10 py-2 rounded bg-teal-100 font-normal hover:bg-teal-400 active:bg-teal-200 text-gray-900"
					onClick={handleIncrement}
				>
					Count: {count}
				</button>
			</div>
		</div>
	);
}
