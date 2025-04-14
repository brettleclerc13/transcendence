export type GameState = {
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

export function drawGame(state: GameState, canvas: HTMLCanvasElement) {

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
		Math.PI * 2,
	);
	ctx.fill();

	// Draw the score
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.font = "30px Arial";
	ctx.fillText(`Player 1: ${state.score[0]}`, 20, 30); // Player 1 score at the top
	ctx.fillText(`Player 2: ${state.score[1]}`, canvas.width - 180, 30); // Player 2 score at the top
	ctx.restore();
}
