import { useEffect, useState } from "react";
import { getCookie } from "cookies-next/client";

export default function TournamentCanvas( tournament: { ID: string } ) {
	const [socket, setSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		const accessToken = getCookie("accessToken");

		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}
		const roomName = tournament.ID;
		const ws = new WebSocket(
			`wss://127.0.0.1:8080/game/${roomName}/?token=${accessToken}`
		);

		ws.onopen = () => {
			console.log("Connected to WebSocket");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected");
			if (event.code === 4000) console.log("Room is Full");
		};

		setSocket(ws);

		return () => ws.close();
	}, []);
	
	return (
		<section className="flex w-full h-full justify-center items-center">
		<p>This is the tournament waiting room</p>
		</section>
	);
}