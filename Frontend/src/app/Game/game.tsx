import GameCanvas from "./gameCanvas";

export default function Game() {
	return (
		<div className="w-full h-screen flex bg-teal-600">
			<div className="flex justify-center items-center h-full w-full">
				<GameCanvas />
			</div>
		</div>
	);
}
