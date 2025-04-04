"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next/client";
import "./game.css";

type GameState = {
	winner: string;
	player1_position: [number, number];
	player2_position: [number, number];
	ball_speed: number;
	ball_position: [number, number];
	ball_direction: [number, number];
	score: [number, number];
	paddle_speed: number;
	resolution: number;
	collision_point: [number, number][];
	last_update_time: number;
};

function drawGame(state: GameState, canvas: HTMLCanvasElement) {
	//console.log("Drawing game state:", state);

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
	ctx.save();
	ctx.translate(0, canvas.height);
	ctx.scale(1, -1);

	// Convert paddle dimensions from "units" to pixels temporarry hard coded.
	const paddleWidth = 1.5 * state.resolution;
	const paddleHeight = 12 * state.resolution;

	// Player 1's paddle
	const player1XCenter = state.player1_position[0] * state.resolution; // Convert X-center to pixels
	const player1YCenter = state.player1_position[1] * state.resolution; // Convert Y-center to pixels

	const player1XTopLeft = player1XCenter - paddleWidth / 2; // Move from center X to top-left X
	const player1YTopLeft = player1YCenter + paddleHeight / 2; // Move from center Y to top-left Y (positive Y is up)

	ctx.fillStyle = "white";
	ctx.fillRect(player1XTopLeft, player1YTopLeft, paddleWidth, -paddleHeight); // -paddleHeight to draw upward

	// Player 2's paddle
	const player2XCenter = state.player2_position[0] * state.resolution;
	const player2YCenter = state.player2_position[1] * state.resolution;

	const player2XTopLeft = player2XCenter - paddleWidth / 2;
	const player2YTopLeft = player2YCenter + paddleHeight / 2;

	ctx.fillRect(player2XTopLeft, player2YTopLeft, paddleWidth, -paddleHeight);

	// Draw the ball
	ctx.beginPath();
	ctx.arc(
		state.ball_position[0] * state.resolution, // X-center
		state.ball_position[1] * state.resolution, // Y-center
		1.5 * state.resolution, // Radius (10 pixels)
		0,
		Math.PI * 2
	);
	ctx.fill();

	// Draw the score
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.font = "30px Arial";
	ctx.fillText(`Player 1: ${state.score[0]}`, 20, 30); // Player 1 score at the top
	if (state.score[0] === 10) {
		state.winner = "player_1";
		return state.winner;
	}
	ctx.fillText(`Player 2: ${state.score[1]}`, canvas.width - 180, 30); // Player 2 score at the top
	if (state.score[1] === 10) {
		state.winner = "player_2";
		return state.winner;
	}
	ctx.restore();
}

export default function GameCanvas(match: { ID: string | undefined }) {
	const [status, setStatus] = useState<
		"waiting" | "ready" | "playing" | "reconnection" | "ending"
	>("waiting");
	const [playerRole, setPlayerRole] = useState<"player_1" | "player_2" | null>(
		null
	);
	const [winner, setWinner] = useState<string | null>(null);
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const inputInterval = useRef<NodeJS.Timeout | null>(null);
	const currentDirectionRef = useRef(0); // ✅ Use a ref to track direction persistently
	//Smoothening variables
	const prevBallPosition = useRef<[number, number] | null>(null);
	const targetBallPosition = useRef<[number, number] | null>(null);
	const collisionPoints = useRef<[number, number][]>([]);
	const lerpProgress = useRef(0); // 0 to 1 progress between previous and target positions
	const lastUpdateTime = useRef(0); // Tracks last game update time
	const prevPaddle1Position = useRef<[number, number] | null>(null);
	const prevPaddle2Position = useRef<[number, number] | null>(null);
	const targetPaddle1Position = useRef<[number, number] | null>(null);
	const targetPaddle2Position = useRef<[number, number] | null>(null);
	const host = process.env.NEXT_PUBLIC_WS_HOST;
	const port = process.env.NEXT_PUBLIC_WS_PORT;
	const router = useRouter();

	useEffect(() => {
		const accessToken = getCookie("accessToken");

		if (!accessToken || !match.ID) {
			console.log("Access Token or Match ID not found in Game Canvas");
			return;
		}
		const roomName = match.ID;
		const ws = new WebSocket(
			`wss://${host}:${port}/game/${roomName}/?token=${accessToken}`
		);

		ws.onopen = () => {
			console.log("Connected to WebSocket");
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "game_ending") {
				console.log("Game FINISHED");
				// setWinner(data.winner);
				setStatus("ending");
			}

			if (data.type === "game_ending" || data.type === "game_pause")
				console.log("Game Stopped! reason:", data.reason);

			if (data.type === "initializer_pack") {
				console.log("player name:", data.player_role);
				setPlayerRole(data.player_role);
			}

			if (data.type === "get-ready") {
				setStatus("ready");
			}

			if (data.type === "start_game") {
				console.log("received start game");
				setStatus("playing");
			}

			if (data.type === "reconnected") {
				ws.send(
					JSON.stringify({
						type: "restart",
						game_parametres: {
							ball_diametre: 1.5,
							paddle_speed: 25,
							paddle_height: 12,
							paddle_width: 1.5,
							ball_speed: 35,
							paddle_xposition: 0.007,
							screen_width: 800,
							screen_height: 592,
							resolution: 8,
							point_goal: 10,
						},
					})
				);
			}

			if (data.type === "game_update") {
				const newBallPosition = data.game_state.ball_position;
				const newCollisions = data.game_state.collision_point || [];
				prevPaddle1Position.current =
					targetPaddle1Position.current || data.game_state.player1_position;
				prevPaddle2Position.current =
					targetPaddle2Position.current || data.game_state.player2_position;

				targetPaddle1Position.current = data.game_state.player1_position;
				targetPaddle2Position.current = data.game_state.player2_position;

				prevBallPosition.current =
					targetBallPosition.current || newBallPosition;
				targetBallPosition.current = newBallPosition;
				collisionPoints.current = newCollisions;

				lerpProgress.current = 0;
				lastUpdateTime.current = Date.now();

				setGameState(data.game_state);
			}

			if (data.type === "pending_reconnection") {
				setStatus("reconnection");
			}
		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected");
			if (event.code === 4000) console.log("Room is Full");
		};
		setSocket(ws);

		return () => ws.close();
	}, []);

	useEffect(() => {
		let animationFrameId: number;

		const renderLoop = () => {
			if (
				!gameState ||
				!canvasRef.current ||
				!prevBallPosition.current ||
				!targetBallPosition.current ||
				!prevPaddle1Position.current ||
				!targetPaddle1Position.current ||
				!prevPaddle2Position.current ||
				!targetPaddle2Position.current
			) {
				animationFrameId = requestAnimationFrame(renderLoop);
				return;
			}

			const ctx = canvasRef.current.getContext("2d");
			if (!ctx) return;

			const now = Date.now();
			const deltaTime = now - lastUpdateTime.current; // Time since last game update (ms)
			const totalDuration = 100; // Each tick lasts 50ms

			// Determine interpolation progress (0 to 1)
			lerpProgress.current = Math.min(deltaTime / totalDuration, 1);

			// Interpolate Paddle 1 Position
			const interpolatedPaddle1Position: [number, number] = [
				prevPaddle1Position.current[0] +
					(targetPaddle1Position.current[0] - prevPaddle1Position.current[0]) *
						lerpProgress.current,
				prevPaddle1Position.current[1] +
					(targetPaddle1Position.current[1] - prevPaddle1Position.current[1]) *
						lerpProgress.current,
			];

			// Interpolate Paddle 2 Position
			const interpolatedPaddle2Position: [number, number] = [
				prevPaddle2Position.current[0] +
					(targetPaddle2Position.current[0] - prevPaddle2Position.current[0]) *
						lerpProgress.current,
				prevPaddle2Position.current[1] +
					(targetPaddle2Position.current[1] - prevPaddle2Position.current[1]) *
						lerpProgress.current,
			];

			// Interpolate Ball Position (already implemented)
			let interpolatedBallPosition: [number, number] = prevBallPosition.current;
			if (collisionPoints.current.length > 0) {
				const numSegments = collisionPoints.current.length + 1;
				const segmentTime = totalDuration / numSegments;
				const currentSegment = Math.min(
					Math.floor(deltaTime / segmentTime),
					numSegments - 1
				);
				const segmentStartTime =
					lastUpdateTime.current + currentSegment * segmentTime;
				const segmentProgress = Math.min(
					(now - segmentStartTime) / segmentTime,
					1
				);

				let start: [number, number];
				let end: [number, number];

				if (currentSegment === 0) {
					start = prevBallPosition.current;
					end =
						collisionPoints.current.length > 0
							? collisionPoints.current[0]
							: targetBallPosition.current;
				} else if (currentSegment < collisionPoints.current.length) {
					start = collisionPoints.current[currentSegment - 1];
					end = collisionPoints.current[currentSegment];
				} else {
					start = collisionPoints.current[collisionPoints.current.length - 1];
					end = targetBallPosition.current;
				}

				interpolatedBallPosition = [
					start[0] + (end[0] - start[0]) * segmentProgress,
					start[1] + (end[1] - start[1]) * segmentProgress,
				];
			} else {
				interpolatedBallPosition = [
					prevBallPosition.current[0] +
						(targetBallPosition.current[0] - prevBallPosition.current[0]) *
							lerpProgress.current,
					prevBallPosition.current[1] +
						(targetBallPosition.current[1] - prevBallPosition.current[1]) *
							lerpProgress.current,
				];
			}

			// Draw the updated frame
			setWinner(
				drawGame(
					{
						...gameState,
						ball_position: interpolatedBallPosition,
						player1_position: interpolatedPaddle1Position,
						player2_position: interpolatedPaddle2Position,
					},
					canvasRef.current
				) ?? null
			);

			// Request the next frame
			animationFrameId = requestAnimationFrame(renderLoop);
		};

		animationFrameId = requestAnimationFrame(renderLoop);

		return () => cancelAnimationFrame(animationFrameId);
	}, [gameState]);

	useEffect(() => {
		if (status === "ready" && playerRole) {
			console.log("sending initializer data");
			socket?.send(
				JSON.stringify({
					type: "initialize",
					game_parametres: {
						ball_diametre: 1.5,
						paddle_speed: 25,
						paddle_height: 12,
						paddle_width: 1.5,
						ball_speed: 35,
						paddle_xposition: 0.007,
						screen_width: 800,
						screen_height: 592,
						resolution: 8,
						point_goal: 10,
					},
				})
			);
		}
	}, [status, playerRole]);

	useEffect(() => {
		const sendInput = () => {
			if (socket && playerRole) {
				socket.send(
					JSON.stringify({
						type: "input",
						player: playerRole,
						direction: currentDirectionRef.current, // ✅ Always send the latest ref value
						timestamp: Date.now(),
					})
				);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			let newDirection = 0;
			if (event.key === "ArrowUp") newDirection = 1;
			if (event.key === "ArrowDown") newDirection = -1;

			if (newDirection !== 0 && currentDirectionRef.current !== newDirection) {
				currentDirectionRef.current = newDirection; // ✅ Update the ref immediately
				sendInput(); // ✅ Send an immediate input

				if (!inputInterval.current) {
					inputInterval.current = setInterval(() => sendInput(), 50); // ✅ Start interval
				}
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				currentDirectionRef.current = 0; // ✅ Reset the ref
				sendInput(); // ✅ Send stop signal

				if (inputInterval.current) {
					clearInterval(inputInterval.current);
					inputInterval.current = null;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			if (inputInterval.current) {
				clearInterval(inputInterval.current);
				inputInterval.current = null;
			}
		};
	}, [socket, playerRole]);

	useEffect(() => {
		if (status === "ending") {
			const timer = setTimeout(() => {
				router.push("/lobby");
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [status]);

	return (
		<div className="game-container">
			{status === "waiting" && <p>Waiting for opponent...</p>}
			{status === "ready" && <p>Ready! Game starting soon...</p>}
			{status === "reconnection" && (
				<p>Waiting for reconnection of the opponent...</p>
			)}
			{status === "playing" && (
				<canvas ref={canvasRef} width={800} height={592} className="canvas" />
			)}
			{status === "ending" && (
				<div className="game-over-screen">
					<p>Game is finished!</p>
					<p>{winner} is the Winner!</p>
					<p>Returning to homepage in 5 seconds...</p>
				</div>
			)}
		</div>
	);
}
