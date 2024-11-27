import json
import time
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer


class PongGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"pong_{self.room_name}"
        self.state_lock = asyncio.Lock()

        # Initialize game state for this instance
        self.game_state = {
            "player1_position": 50,
            "player2_position": 50,
            "ball_position": [50, 50],
            "ball_velocity": [1, 1],  # Ball moves 1 unit per tick in both x and y directions
            "score": [0, 0],
            "paddle_speed": 30,  # Units per second
            "last_update_time": time.time(),
        }
        self.players = set()  # Track connected players in the room

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Add the player to the room's player set
        if not len(self.players) >= 2:
            await self.accept() #if not accapted send response!
            self.players.add(self.channel_name)

        # Start game loop when 2 players are connected
        #if len(self.players) == 2:
        print("Moving on to game loop")
        self.game_task = asyncio.create_task(self.game_loop())
        

    async def disconnect(self, close_code):
        # Remove player from the room
        self.players.discard(self.channel_name)

        # Stop game loop if all players leave
        if hasattr(self, "game_task") and len(self.players) == 0:
            self.game_task.cancel()

        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Handle player input. Input must include:
        - `player`: "player1" or "player2"
        - `direction`: -1 (up) or 1 (down)
        - `timestamp`: Time input was sent from the client
        """
        try:
            data = json.loads(text_data)
            player = data["player"]  # "player1" or "player2"
            direction = data["direction"]  # +1 (down) or -1 (up)
            input_timestamp = data["timestamp"]  # Client-side timestamp

            # Validate input
            if player not in ["player1", "player2"] or direction not in [-1, 1]:
                return  # Invalid input, ignore

            # Adjust for lag using input timestamp
            server_time = time.time()
            latency = server_time - input_timestamp

            # Update paddle position based on input
            async with self.state_lock:
                paddle_speed = self.game_state["paddle_speed"]
                time_elapsed = latency + 0.05  # Assuming tick duration of 50ms (20 FPS)
                if player == "player1":
                    self.game_state["player1_position"] += direction * paddle_speed * time_elapsed
                    self.game_state["player1_position"] = max(0, min(100, self.game_state["player1_position"]))  # Clamp position
                elif player == "player2":
                    self.game_state["player2_position"] += direction * paddle_speed * time_elapsed
                    self.game_state["player2_position"] = max(0, min(100, self.game_state["player2_position"]))  # Clamp position
        except Exception as e:
            # Handle any unexpected errors
            print(f"Error processing input: {e}")

    async def game_loop(self):
        """
        The main game loop, running at a fixed tick rate (e.g., 20 FPS).
        Updates the game state and broadcasts it to all players.
        """
        try:
            while True:
                # Calculate time elapsed since the last update
                async with self.state_lock:
                    current_time = time.time()
                    time_elapsed = current_time - self.game_state["last_update_time"]
                    self.game_state["last_update_time"] = current_time

                    # Update ball position
                    self.game_state["ball_position"][0] += self.game_state["ball_velocity"][0] * time_elapsed * 50  # Ball speed multiplier
                    self.game_state["ball_position"][1] += self.game_state["ball_velocity"][1] * time_elapsed * 50

                    # Handle ball collisions with walls
                    if self.game_state["ball_position"][1] <= 0 or self.game_state["ball_position"][1] >= 100:
                        self.game_state["ball_velocity"][1] *= -1  # Reverse vertical direction

                    # Handle ball collisions with paddles
                    if self.game_state["ball_position"][0] <= 0:  # Ball reaches player1's side
                        if abs(self.game_state["player1_position"] - self.game_state["ball_position"][1]) < 10:
                            self.game_state["ball_velocity"][0] *= -1  # Reverse horizontal direction
                        else:
                            self.game_state["score"][1] += 1  # Player 2 scores
                            self.reset_ball()
                    elif self.game_state["ball_position"][0] >= 100:  # Ball reaches player2's side
                        if abs(self.game_state["player2_position"] - self.game_state["ball_position"][1]) < 10:
                            self.game_state["ball_velocity"][0] *= -1  # Reverse horizontal direction
                        else:
                            self.game_state["score"][0] += 1  # Player 1 scores
                            self.reset_ball()
                # Broadcast the updated game state to all players
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "game_state": self.game_state,
                    }
                )

                # Wait for the next tick
                await asyncio.sleep(0.05)  # 20 TPS
        except asyncio.CancelledError:
            # Gracefully exit the game loop if the task is canceled
            pass

    async def game_update(self, event):
        """
        Send the updated game state to the frontend.
        """
        await self.send(text_data=json.dumps(event["game_state"]))

    def reset_ball(self):
        """
        Reset the ball to the center with default velocity.
        """
        self.game_state["ball_position"] = [50, 50]
        self.game_state["ball_velocity"] = [1, 1]
