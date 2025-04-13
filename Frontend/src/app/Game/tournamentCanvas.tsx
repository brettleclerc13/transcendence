import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";
import { leaveTournament } from "../utilities/tournamentActions";
import GameCanvas from "./gameCanvas";
import "./tournament.css";
import { Alert } from "react-bootstrap";

type TournamentPlayer = {
	id: string;
	tournament_name: string;
	profile_picture: string | null;
	is_on_page: boolean;
};

function isTournamentPlayer(obj: unknown): obj is TournamentPlayer {
	if (typeof obj !== "object" || obj === null) return false;

	const player = obj as Record<string, unknown>;

	return (
		"id" in player &&
		(typeof player.id === "string" || typeof player.id === "number") &&
		"tournament_name" in player &&
		typeof player.tournament_name === "string"
	);
}

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
	const [alert, setAlert] = useState<{
		message: string;
		type: "danger" | "success";
	} | null>(null);

	const setAlertWithTimeout = (
		alertData: { message: string; type: "danger" | "success" } | null,
	) => {
		setAlert(alertData);
		if (alertData) {
			setTimeout(() => {
				setAlert(null);
			}, 3000); // 3 seconds
		}
	};
	const [tournamentState, setTournamentState] = useState<
		Record<string, string>
	>({});
	const [gameOn, setGameOn] = useState<boolean>(false);
	const [countdownMessage, setCountdownMessage] = useState<string | undefined>(
		undefined,
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
			`wss://${host}:${port}/tournament/${tournamentID}/?token=${accessToken}`,
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
					}),
				);
			}

			// Handle when a new user joins
			if (data.type === "new_user") {
				const newPlayers: Record<string, TournamentPlayer> = {};
				
				Object.entries(data.users).forEach(([key, player]) => {

					if (isTournamentPlayer(player)) {
						newPlayers[key] = {
							id: player.id, // Ensure it is always a string
							tournament_name: player.tournament_name.trim() || "Unknown",
							profile_picture: player.profile_picture || null,
							is_on_page: true,
						};
					} else {
						console.warn(`Invalid player data for ${key}:`, player);
					}
				})
			  
				setPlayersMap((prev) => {
					const updatedMap = { ...prev, ...newPlayers };
					updateDisplayedPlayers(tournamentState, updatedMap); // Use latest state
					return updatedMap;
				});
			}

			// Handle tournament state updates
			if (data.type === "tournament_display_update") {
				console.log("Tournament display update: ", data.state);
				setTournamentState(() => {
				  const newState = data.state;
				  updateDisplayedPlayers(newState, playersMap); // Use latest map
				  return newState;
				});
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
				setAlertWithTimeout({
					message: "Room is full",
					type: "danger",
				});
			}
		};

		setSocket(ws);
		return () => ws.close();
	}, []);

	const layers = [
		"first_layer_1",
		"first_layer_2",
		"first_layer_3",
		"first_layer_4",
		"second_layer_1",
		"second_layer_2",
		"third_layer",
	];
	  
	const updateDisplayedPlayers = (
		currentState: Record<string, string>,
		playerMap: Record<string, TournamentPlayer>
	) => {
		const updatedNames = layers.map((layer) => {
		  const playerID = currentState[layer];
		  return playerMap[playerID]?.tournament_name || "NA";
		});
		setDisplayedPlayers(updatedNames);
	};

	const handleTournamentExit = async () => {
		if (!socket) {
			setAlertWithTimeout({
				message: "WebSocket is not connected",
				type: "danger",
			});
			return;
		}

		socket.send(JSON.stringify({ type: "user_disconnected" }));

		const response = await leaveTournament(tournamentID);
		if (!response.ok) {
			setAlertWithTimeout({
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
				<div className="alert-box">
					<Alert
						variant={alert.type}
						onClose={() => setAlertWithTimeout(null)}
						dismissible
						show={!!alert}
					>
						<span className="alert-message">{alert.message}</span>
					</Alert>
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