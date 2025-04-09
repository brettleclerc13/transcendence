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
	const [tournamentState, setTournamentState] = useState<
		Record<string, string>
	>({});
	const [gameOn, setGameOn] = useState<boolean>(false);
	const [countdownMessage, setCountdownMessage] = useState<string | undefined>(
		undefined
	);

	useEffect(() => {
		const accessToken = getCookie("accessToken");
		const host = process.env.NEXT_PUBLIC_WS_HOST;
		const port = process.env.NEXT_PUBLIC_WS_PORT;
		if (!accessToken) {
			console.warn("Access Token not retrieved in Tournament Canvas");
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
			}

			// Handle tournament state updates
			if (data.type === "tournament_display_update") {
				console.log("Tournament display update: ", data.state);
				setTournamentState(data.state);
			}

			if (data.type === "tournament_countdown") {
				setCountdownMessage(data.message);
			}

			// Handle when a match is created
			if (data.type === "tournament_match_created") {
				setMatchID(data.match_id);
				setGameOn(true);
			}
		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected");
			if (event.code === 4000) {
				setAlert({
					message: "Room is full",
					type: "danger",
				});
			}
		};

		setSocket(ws);
		return () => ws.close();
	}, []);

	useEffect(() => {
		if (!tournamentState) return;

		const layers = [
			"first_layer_1",
			"first_layer_2",
			"first_layer_3",
			"first_layer_4",
			"second_layer_1",
			"second_layer_2",
			"third_layer",
		];

		const updatedNames = layers.map((layer) => {
			const playerNumber = tournamentState[layer];
			console.log(
				`Layer: ${layer}, Player ID: ${playerNumber}, Player Found:`,
				playersMap[playerNumber]
			);
			return playersMap[playerNumber]?.tournament_name || "NA";
		});

		setDisplayedPlayers(updatedNames);
	}, [tournamentState, playersMap]);

	const handleTournamentExit = async () => {
		if (!socket) {
			setAlert({
				message: "WebSocket is not connected",
				type: "danger",
			});
			return;
		}

		socket.send(JSON.stringify({ type: "user_disconnected" }));

		const response = await leaveTournament(tournamentID);
		if (response && !response.ok) {
			setAlert({
				message: response.error || "Failed to leave tournament",
				type: "danger",
			});
		}

		socket.close();
		setTimeout(() => setGameType("lobby"), 1500);
	};

	return gameOn ? (
		<GameCanvas matchID={matchID} setGameType={setGameType} />
	) : (
		<section className="tournament-container">
			<h2 className="tournament-title">Tournament organisation :</h2>

			{alert && (
				<div className="alert-box" role="alert">
					{alert.message}
				</div>
			)}

			{countdownMessage && (
				<div className="countdown-screen">{countdownMessage}</div>
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
