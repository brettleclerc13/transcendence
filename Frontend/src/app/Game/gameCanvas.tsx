"use client"

import { useState, useEffect, useRef } from "react";

type GameState = {
    player1_position: [number, number];
    player2_position: [number, number];
    ball_speed: number;
    ball_position: [number, number];
    ball_direction: [number, number];
    score: [number, number];
    paddle_speed: number;
    resolution: number;
    last_update_time: number;
}

function drawGame(state: GameState, canvas: HTMLCanvasElement) {
    console.log("Drawing game state:", state);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);

    // Convert paddle dimensions from "units" to pixels temporarry hard coded.
    const paddleWidth = 2 * state.resolution;  // Convert from 0-100 to pixels
    const paddleHeight = 8 * state.resolution; // Convert from 0-100 to pixels

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
        state.ball_position[0]  * state.resolution, // X-center
        state.ball_position[1]  * state.resolution, // Y-center
        1 * state.resolution, // Radius (10 pixels)
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw the score
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "30px Arial";
    ctx.fillText(`Player 1: ${state.score[0]}`, 20, 30); // Player 1 score at the top
    ctx.fillText(`Player 2: ${state.score[1]}`, canvas.width - 180, 30); // Player 2 score at the top
    ctx.restore();
}


export default function GameCanvas () {
	const [status, setStatus] = useState<"waiting" | "ready" | "playing">("waiting");
    const [playerRole, setPlayerRole] = useState<"player_1" | "player_2" | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [currentDirection, setCurrentDirection] = useState(0); // 1 for up, -1 for down, 0 for no movement

    useEffect(() => {
        const roomName = "defaultRoom"; // Example room name
        const ws = new WebSocket(`wss://transcendence.fr/game/${roomName}/`);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            console.log('data type sent in:', data.type)

            if (data.type === "initializer_pack") {
                console.log('player name:', data.player_role)
                setPlayerRole(data.player_role); // Assign "player_1" or "player_2"
                setStatus("ready");
            }

            if (data.type === "start_game") {
                console.log("recived start game")
                setStatus("playing");
            }

            if (data.type === "game_update") {
                setGameState(data.game_state);
            }
        };

        ws.onclose = (event) => {
            console.log("WebSocket disconnected")
            if (event.code === 4000){
                console.log("Room is Full");
            }
        };
        setSocket(ws);

        return () => ws.close();
    }, []);

    useEffect(() => {
        if (!gameState || !canvasRef.current)
            return;
        console.log("Drawing game state: ", gameState);
        drawGame(gameState, canvasRef.current as HTMLCanvasElement);

    }, [gameState])

    useEffect(() => {
        if (status === "ready" && playerRole) {
            console.log("sending initializer data");
            socket?.send(JSON.stringify({ type: "initialize", game_parametres: {
                "ball_diametre": 1,
                "paddle_speed": 10,
                "paddle_height": 8,
                "paddle_width": 2,
                "ball_speed": 5,
                "paddle_xposition": 0.2,
                "screen_width": 800,
                "screen_height": 400,
                "resolution": 8,
                "point_goal": 10
             }}));
        }
    }, [status, playerRole]);

    /* Send directional input every 50ms
    useEffect(() => {
        let interval: number | null = null;

        if (status === "playing") {
            interval = window.setInterval(() => {
                const timestamp = Date.now();
                socket?.send(
                    JSON.stringify({
                        type: "input",
                        player: playerRole,
                        direction: currentDirection,
                        timestamp,// -1 for down, 1 for up
                        
                    })
                );
                //console.log("Sent input:", { player: playerRole, direction: currentDirection, timestamp });
            }, 50);
        }

        return () => {
            if (interval !== null) {
                window.clearInterval(interval); // Use `window.clearInterval` with a `number`
            }
        };
    }, [status, playerRole, socket, currentDirection]);*/

    useEffect(() => {
        let inputInterval: number = 0; // Default to 0 (no active interval)
    
        const handleKeyDown = (event: KeyboardEvent) => {
            let newDirection = 0;
            if (event.key === "ArrowUp") newDirection = 1;
            if (event.key === "ArrowDown") newDirection = -1;
    
            if (newDirection !== 0 && currentDirection !== newDirection) {
                setCurrentDirection(newDirection); // Update direction state
            }
    
            if (!inputInterval && newDirection !== 0) {
                inputInterval = window.setInterval(() => {
                    socket?.send(
                        JSON.stringify({
                            type: "input",
                            player: playerRole,
                            direction: newDirection,
                            timestamp: Date.now(),
                        })
                    );
                }, 50); // Send every 50ms
            }
        };
    
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                setCurrentDirection(0); // Reset direction
                if (inputInterval) {
                    clearInterval(inputInterval); // Stop sending
                    inputInterval = 0; // Reset interval ID
                    socket?.send(
                        JSON.stringify({
                            type: "input",
                            player: playerRole,
                            direction: 0,
                            timestamp: Date.now(),
                        })
                    ); // Send "stop" message
                }
            }
        };
    
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
    
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            if (inputInterval) clearInterval(inputInterval); // Clear the interval when unmounting
        };
    }, [socket, playerRole, currentDirection]);

    return (
        <div>
            {status === "waiting" && <p>Waiting for opponent...</p>}
            {status === "ready" && <p>Ready! Game starting soon...</p>}
            {status === "playing" && (
                <canvas ref={canvasRef} width={800} height={400} style={{ backgroundColor: "black", display: "block"}}/>
            )}
        </div>
    );
}

