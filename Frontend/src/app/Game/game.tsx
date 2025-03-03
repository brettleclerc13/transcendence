"use client";

import GameCanvas from "./gameCanvas";
import { isUserLoggedIn } from "../utilities/userClientActions";
import Link from "next/link";

export default function Game() {
	return (
		<div className="w-full h-screen flex bg-teal-600">
			{isUserLoggedIn() ? (
				<div className="flex justify-center items-center h-full w-full">
					{/* should be lobby component */}
					<GameCanvas />
				</div>
			) : (
				<div className="flex flex-col gap-4 justify-center items-center h-full w-full">
					<p className="text-lg">
						Please log in before starting a game. It won't even take a minute!
					</p>
					<Link className="secondary-button" href="/login">
						Connect
					</Link>
				</div>
			)}
		</div>
	);
}
