import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";
import { leaveTournament } from "../utilities/tournamentActions";
import GameCanvas from "./gameCanvas";

type TournamentPlayer = {
	id: string;
	tournament_name: string;
	profile_picture: string | null;
	is_on_page: boolean;
};

export default function TournamentCanvas({
	tournamentID,
	setGameType,
}: {
	tournamentID: string;
	setGameType: (isReadyToPlay: string) => void;
}) {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [playersMap, setPlayersMap] = useState<Record<string, TournamentPlayer>>({});
	const [displayedPlayers, setDisplayedPlayers] = useState<string[]>(["NA", "NA", "NA", "NA", "NA", "NA", "NA"]);
	const [matchID, setMatchID] = useState<string>("");

	useEffect(() => {
		const accessToken = getCookie("accessToken");
		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}

		const ws = new WebSocket(
			`wss://c3r2p3:8080/ws/tournament/${tournamentID}/?token=${accessToken}`
		);

		ws.onopen = () => {
			console.log("Connected to WebSocket");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log("Received WebSocket message: ", data);

			if (data.type === "Connected to tournament") {
				console.log("Ready to send data");
				ws.send(
					JSON.stringify({
						type: "user_connected"
					})
				);
			}

			// Handle when a new user joins
			if (data.type === "new_user") {
				console.log("New user data: ", data);

				// Convert user object into a dictionary with "player_1", "player_2", etc.
				const newPlayers: Record<string, TournamentPlayer> = {};
				Object.entries(data.users).forEach(([key, player]: [string, any]) => {
					newPlayers[key] = {
						id: player.user_id.toString(),
						tournament_name: player.tournament_name,
						profile_picture: player.profile_picture || null,
						is_on_page: true,
					};
				});

				// Update players mapping
				setPlayersMap(prev => ({ ...prev, ...newPlayers }));

				// Display them immediately (just the first 4 players)
				const firstFour = Object.values(newPlayers).slice(0, 4).map(p => p.tournament_name);
				setDisplayedPlayers((prev) => {
					let updated = [...prev];
					for (let i = 0; i < firstFour.length; i++) {
						updated[i] = firstFour[i];
					}
					return updated;
				});
			}

			// Handle tournament state updates
			if (data.type === "tournament_display_update") {
				console.log("Tournament display update: ", data.state);

				// Extracting tournament IDs from the state
				const layers = [
					"first_layer_1", "first_layer_2", "first_layer_3", "first_layer_4",
					"second_layer_1", "second_layer_2",
					"third_layer"
				];

				// Map player IDs to tournament names
				const updatedNames = layers.map(layer => {
					const playerNumber = data.state[layer];
					return playersMap[playerNumber]?.tournament_name || "NA"; // Default to NA if not found
				});

				// Update displayed player names
				setDisplayedPlayers(updatedNames);
			}

			// Handle when a match is created
			if (data.type === "tournament_match_created") {
				setMatchID(data.match_id);
			}
		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected");
			if (event.code === 4000) console.log("Room is Full");
		};

		setSocket(ws);
		return () => ws.close();
	}, []);

	const handleTournamentExit = async () => {
		if (!socket) {
			console.error("WebSocket is not connected");
			return;
		}

		socket.send(JSON.stringify({ type: "user_disconnected" }));

		try {
			const response = await leaveTournament(tournamentID);
			console.log("Tournament exit response: ", response);
		} catch (error) {
			console.error("Error leaving the tournament:", error);
		}

		socket.close();
		setTimeout(() => setGameType("lobby"), 1000);
	};

	return (
		<>
			{matchID ? <GameCanvas ID={matchID} /> : (
				<section className="flex justify-center items-center h-full w-full">
					<div className="flex flex-col-reverse gap-5">
						<button
							className="mb-4 px-4 py-2 bg-red-500 w-fit pr-10 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition"
							onClick={handleTournamentExit}
						>
							❌ Quit Tournament
						</button>

						<div className="grid grid-cols-3 gap-8 items-center">
							{/* Left column (first 4 players) */}
							<div className="flex flex-col gap-4">
								<PlayerBox name={displayedPlayers[0]} />
								<span className="text-xxl font-bold text-center">VS</span>
								<PlayerBox name={displayedPlayers[1]} />
								<div className="h-8"></div> {/* Spacing */}
								<PlayerBox name={displayedPlayers[2]} />
								<span className="text-xxl font-bold text-center">VS</span>
								<PlayerBox name={displayedPlayers[3]} />
							</div>

							{/* Middle column (2 winners) */}
							<div className="flex flex-col gap-16">
								<PlayerBox name={displayedPlayers[4]} />
								<span className="text-xl font-bold text-center">VS</span>
								<PlayerBox name={displayedPlayers[5]} />
							</div>

							{/* Right column (Final winner) */}
							<div className="flex flex-col gap-16 justify-center">
								<PlayerBox name={displayedPlayers[6]} />
							</div>
						</div>
					</div>
				</section>
			)}
		</>
	);
}

function PlayerBox({ name }: { name: string }) {
	return (
		<div className="w-32 h-16 flex items-center justify-center bg-blue-500 text-white font-bold rounded-lg shadow-md">
			{name}
		</div>
	);
}
