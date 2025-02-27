import GameCanvas from "./gameCanvas";
import { isUserLoggedIn } from "../utilities/userActions";
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
					<p>
						Please register or log in before starting a game. It won't even take
						a minute!
					</p>
					<div className="flex gap-6">
						<Link className="standard-button" href="/register">
							Register
						</Link>
						<Link className="standard-button" href="/login">
							Login
						</Link>
						{/* Once logged in, should be redirected back to game page */}
					</div>
				</div>
			)}
		</div>
	);
}
