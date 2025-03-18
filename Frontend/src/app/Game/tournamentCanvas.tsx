import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";

interface TournamentPlayer {
	user_id: string | null;
	tournament_name: string | null;
	profile_picture: string | null;
	is_on_page: boolean;
}

interface TournamentPlayers {
	[key: string]: TournamentPlayer;
}


export default function TournamentCanvas( tournament: { ID: string } ) {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [players, setPlayers] = useState<TournamentPlayer[]>([]);

	useEffect(() => {
		const accessToken = getCookie("accessToken");

		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}
		const roomName = tournament.ID;
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
					const uniquePlayers = newPlayers.filter(
						(newPlayer) =>
							!prevPlayers.some((player) => player.user_id === newPlayer.user_id)
					);

					// Limiter à 4 joueurs
					return prevPlayers.length + uniquePlayers.length <= 4
						? [...prevPlayers, ...uniquePlayers]
						: prevPlayers;
				});
			}


		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected");
			if (event.code === 4000) console.log("Room is Full");
		};

		setSocket(ws);

		return () => ws.close();
	}, [tournament]);
	
	return (
		<section className="flex w-full h-full justify-center items-center">
			<p className="mb-4 text-lg font-bold">This is the tournament waiting room</p>
			<ul>
				{players.map((player, index) => (
					<li key={player.user_id || `player-${index}`} className="text-center">
						🎮 Player {index + 1}: {player.user_id ?? "Unknow"}
					</li>
				))}
			</ul>
		</section>
	);
}
