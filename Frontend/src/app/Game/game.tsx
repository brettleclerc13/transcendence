'use client';

import { useState, useEffect } from "react";

export interface GameProps { 
    onBackClick: () => void;
}

type GameState = {
    player1_position: number;
    player2_position: number;
    ball_position: [number, number];
    ball_velocity: [number, number];
    score: [number, number];
    paddle_speed: number;
    last_update_time: number;
}

export default function Game({ onBackClick }: GameProps) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        const roomName = "defaultRoom"; // Example room name
        const wsUrl = `wss://transcendence.fr/game/${roomName}/`;
		let ws: WebSocket | null = null;

		const timeout = setTimeout(() => {
			ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				console.log("WebSocket connection established");
				setSocket(ws);
			};

			ws.onmessage = (event) => {
				const state = JSON.parse(event.data);
				setGameState(state);
			};

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
			};

			ws.onclose = () => {
				console.log("WebSocket connection closed");
			};
		}, 500);

		return () => {
			clearTimeout(timeout);
			if (ws) {
				ws.close();
			}
		};
	}, []);

    useEffect(() => {
        if (!gameState) return;
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        drawGame(gameState, canvas);
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!socket) return;

            let direction = 0;
            if (event.key === "ArrowUp") direction = -1;
            if (event.key === "ArrowDown") direction = 1;

            if (direction !== 0) {
                const player = "player1"; // Or determine dynamically for multiplayer
                const timestamp = Date.now();
                socket.send(JSON.stringify({ player, direction, timestamp }));
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [socket]);

    return (
        <div className="w-full h-screen flex bg-teal-600">
            <div className="flex justify-center items-center h-full w-full">
                <canvas id="gameCanvas" width="800" height="400" style={{ backgroundColor: 'black' }}></canvas>
            </div>
            <button onClick={onBackClick} className="absolute top-4 left-4 p-2 bg-red-500 text-white">
                Exit Game
            </button>
        </div>
    );
}

function drawGame(state: GameState, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(50, (state.player1_position / 100) * canvas.height - 50, 10, 100);
    ctx.fillRect(canvas.width - 60, (state.player2_position / 100) * canvas.height - 50, 10, 100);

    ctx.beginPath();
    ctx.arc(
        (state.ball_position[0] / 100) * canvas.width,
        (state.ball_position[1] / 100) * canvas.height,
        10,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.font = "30px Arial";
    ctx.fillText(`Player 1: ${state.score[0]}`, 20, 30);
    ctx.fillText(`Player 2: ${state.score[1]}`, canvas.width - 180, 30);
}
