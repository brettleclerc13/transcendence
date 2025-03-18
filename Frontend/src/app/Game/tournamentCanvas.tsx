import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";
import { leaveTournament } from "../utilities/tournamentActions";
import GameCanvas from "./gameCanvas";
import { match } from "assert";

type TournamentPlayer = {
	id: string | null;
	tournament_name: string | null;
	profile_picture: string | null;
	is_on_page: boolean;
}


export default function TournamentCanvas({
	tournamentID,
	setGameType,
}: {
		tournamentID : string;
		setGameType: (isReadyToPlay: string) => void;
	}) {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [players, setPlayers] = useState<TournamentPlayer[]>([]);
	const [alert, setAlert] = useState<{ message: string; type: string } | null>(
		null
	);
	const [matchID, setMatchID] = useState<string>("");
	const [gameOn, setGameOn] = useState<boolean>(false);

	useEffect(() => {
		const accessToken = getCookie("accessToken");

		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}
		const roomName = tournamentID;
		const ws = new WebSocket(
			`wss://127.0.0.1:8080/ws/tournament/${roomName}/?token=${accessToken}`
		);

		ws.onopen = () => {
			console.log("Connected to WebSocket");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log("data: ", data);
			if (data.type) {
				console.log("Data type received: ", data.type);
			}

			if (data.type ==="Connected to tournament") {
				console.log("Ready to send data");
				ws.send(
					JSON.stringify({
						type: "user_connected"
					})
				);
			}

			if (data.type === "new_user") {
				console.log("data new user: ", data);

				// Récupérer tous les joueurs sous forme de tableau
				const newPlayers = Object.values(data.users) as TournamentPlayer[];

				setPlayers((prevPlayers) => {
					// Ajouter uniquement les nouveaux joueurs qui ne sont pas déjà dans la liste
					const updatedPlayers = newPlayers.filter(
						(newPlayer) => !prevPlayers.some((player) => player.id === newPlayer.id)
					  );

					// Limiter à 4 joueurs
					return prevPlayers.length + updatedPlayers.length <= 4
            			? [...prevPlayers, ...updatedPlayers]
            			: prevPlayers;
				});
			}

			if (data.type === "user_left") {
				//grey out the user
			}

			if (data.type === "tournament_display_update") {
				//player update map
			}

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
	
		// Envoyer le message de déconnexion
		socket.send(
			JSON.stringify({
				type: "user_disconnected",
			})
		);

		try {
			const response = await leaveTournament(tournamentID);
			console.log("Tournament exit response: ", response);
			setAlert({
				message: "Bye bye!",
				type: "success",
			});
		} catch (error) {
			setAlert({
				message: `Error leaving the tournament: ${error}`,
				type: "danger",
			});
		}
		socket.close();

		setInterval(() => {
			setGameType("lobby");
		}, 1000)	
	}
	
	return (
		<>
			{gameOn ? <GameCanvas ID={matchID}/> : (
			<section className="flex justify-center items-center h-full w-full">
				{alert && (
					<div className={`alert alert-${alert.type} alert-box`} role="alert">
						{alert.message}
						<button
							type="button"
							className="close"
							onClick={() => setAlert(null)}
							aria-label="Close"
						>
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
				)}
				<div className="flex flex-col-reverse gap-5">
					<button
					className="mb-4 px-4 py-2 bg-red-500 w-fit pr-10 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition"
					onClick={handleTournamentExit}
					>
						❌ Quitter le tournoi
					</button>
					<div className="grid grid-cols-3 gap-8 items-center">
					{/* Colonne de gauche (4 joueurs) */}
						<div className="flex flex-col gap-4">
							<PlayerBox player={players[0]} />
							<span className="text-xxl font-bold text-center">VS</span>
							<PlayerBox player={players[1]} />
							<div className="h-8"></div> {/* Espacement */}
							<PlayerBox player={players[2]} />
							<span className="text-xxl font-bold text-center">VS</span>
							<PlayerBox player={players[3]} />
						</div>

					{/* Colonne du centre (2 gagnants) */}
					<div className="flex flex-col gap-16">
						<PlayerBox player={undefined} />
						<span className="text-xl font-bold text-center">VS</span>
						<PlayerBox player={undefined} />
					</div>

					{/* Colonne de droite (Gagnant final) */}
					<div className="flex flex-col gap-16 justify-center">
						<PlayerBox player={undefined} />
					</div>
				</div>
			</div>
			</section>
			)};
		</>
	);
}

function PlayerBox({ player }: { player: TournamentPlayer | undefined }) {
	return (
		<div className="w-32 h-16 flex items-center justify-center bg-blue-500 text-white font-bold rounded-lg shadow-md">
			{player ? `🎮 ${player.tournament_name}` : "NA"}
		</div>
	);
}

