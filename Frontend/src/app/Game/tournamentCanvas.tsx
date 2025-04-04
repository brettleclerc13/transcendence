import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";
import { leaveTournament } from "../utilities/tournamentActions";
import GameCanvas from "./gameCanvas";
import "./tournament.css";

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
	const [playersMap, setPlayersMap] = useState<
		Record<string, TournamentPlayer>
	>({});
	const [displayedPlayers, setDisplayedPlayers] = useState<string[]>([
		"NA",
		"NA",
		"NA",
		"NA",
		"NA",
		"NA",
		"NA",
	]);
	const [matchID, setMatchID] = useState<string | undefined>(undefined);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const host = process.env.NEXT_PUBLIC_WS_HOST;
	const port = process.env.NEXT_PUBLIC_WS_PORT;

	useEffect(() => {
		const accessToken = getCookie("accessToken");
		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}

		const ws = new WebSocket(
			`wss://${host}:${port}/ws/tournament/${tournamentID}/?token=${accessToken}`
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
						type: "user_connected",
					})
				);
			}

			// Handle when a new user joins
			if (data.type === "new_user") {
				console.log("New user data: ", data);

				// Convert user object into a dictionary with "player_1", "player_2", etc.
				const newPlayers: Record<string, TournamentPlayer> = {};

				Object.entries(data.users).forEach(([key, player]: [string, any]) => {
					// Prevent errors if player is undefined or missing user_id
					if (!player || !player.id) {
						console.warn(`Invalid player data for ${key}:`, player);
						return; // Skip this entry
					}

					newPlayers[key] = {
						id: String(player.id), // Ensure it is always a string
						tournament_name: player.tournament_name || "Unknown",
						profile_picture: player.profile_picture || null,
						is_on_page: true,
					};
				});

				// Update players mapping
				setPlayersMap((prev) => ({ ...prev, ...newPlayers }));

				// Display them immediately (just the first 4 players)
				const firstFour = Object.values(newPlayers)
					.slice(0, 4)
					.map((p) => p.tournament_name);
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
					"first_layer_1",
					"first_layer_2",
					"first_layer_3",
					"first_layer_4",
					"second_layer_1",
					"second_layer_2",
					"third_layer",
				];

				// Map player IDs to tournament names
				const updatedNames = layers.map((layer) => {
					const playerNumber = data.state[layer];
					return playersMap[playerNumber]?.tournament_name || "NA"; // Default to NA if not found
				});

				// Update displayed player names
				setDisplayedPlayers(updatedNames);
			}

			// Handle when a match is created
			if (data.type === "tournament_match_created") {
				console.log(data.match_id);
				setMatchID(data.match_id);
				return <GameCanvas ID={matchID} />;
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
		<section className="tournament-container">
			<h2 className="tournament-title">Tournament organisation :</h2>

			{alert && (
				<div className="alert-box" role="alert">
					{alert.message}
				</div>
			)}

			<div className="tournament-grid">
				{/* Left column (first 4 players) */}
				<div className="round-container">
					<h3 className="round-title">Round 1</h3>
					<div className="round">
						<PlayerBox className="player1" name={displayedPlayers[0]} />
						<div className="match-line vertical vertical1"></div>
						<div className="match-line horizontal horizontal1"></div>
						<PlayerBox className="player2" name={displayedPlayers[1]} />
						<PlayerBox className="player3" name={displayedPlayers[2]} />
						<div className="match-line vertical vertical2"></div>
						<div className="match-line horizontal horizontal2"></div>
						<PlayerBox className="player4" name={displayedPlayers[3]} />
					</div>
				</div>

				{/* Middle column (2 winners) */}
				<div className="round-container">
					<h3 className="round-title">Round 2</h3>
					<div className="round">
						<PlayerBox className="player5" name={displayedPlayers[4]} />
						<div className="match-line vertical vertical3"></div>
						<div className="match-line horizontal horizontal3"></div>
						<PlayerBox className="player6" name={displayedPlayers[5]} />
					</div>
				</div>

				{/* Right column (Winner) */}
				<div className="round-container">
					<h3 className="round-title">Winner!👑</h3>
					<div className="round">
						<PlayerBox className="player7" name={displayedPlayers[6]} />
					</div>
				</div>
			</div>
			<button className="quit-tournament-btn" onClick={handleTournamentExit}>
				❌ Quit Tournament
			</button>
		</section>
	);
}

function PlayerBox({ className, name }: { className: string; name: string }) {
	return <div className={`player-box ${className}`}>{name}</div>;
}
