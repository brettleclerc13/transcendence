import json
import math
import time
import asyncio
from asyncio import Queue
from channels.generic.websocket import AsyncWebsocketConsumer


class PongGameConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(self, *args, **kwargs)
        self.game_state = {
            "player1_position": [],
            "player2_position": [],
            "ball_position": [],
            "ball_direction": [0.7, 0.7],  # Unit Vector for ball direction
            "ball_speed": 15,
            "score": [0, 0],
            "last_update_time": time.time(),
        }
        self.game_parametres = {
            "ball_diametre": 1,
            "paddle_speed": 10, #units per second
            "paddle_height": 8,
            "paddle_width": 2,
            "ball_speed": 15, #units per second
            "paddle_xposition": 0.2, #as a fraction of total width where X is fraction distance from the edge
            "field_width": 100,
            "field_height": 100

        }
        self.players = set()  # Track connected players in the room
        self.input_queue = Queue()
        self.has_initialize = False
        self.time_per_tick = 0.05 #50 ms

    async def connect(self):
        # Extract room name from URL
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"pong_{self.room_name}"

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
        if len(self.players) == 2:
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
        data = json.loads(text_data)
        if data["type"] == "initialize":
            self.update_game_parametres(data["game_parametres"])
            self.has_initialize = True
        await self.input_queue.put(data)

    
       

    async def game_loop(self):

        try:
            while True:
                while not self.input_queue.empty():
                    input_event = await self.input_queue.get()
                    player = input_event["player"]
                    direction = input_event["direction"]

                if self.has_initialize:
                    self.update_paddles(player, direction)
                #!!!update ball position, handle collisions with walls and paddles! handle scoring.


                    

                
                
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
    
    #def update_ball_position(self, ball_position, ball_direction, ball_speed):


    def update_game_parametres(self, new_parametres):
        self.game_parametres.update(new_parametres)
        self.init_starting_positions()

    def init_starting_positions(self):
        field_width = self.game_parametres["field_width"]
        field_heigth = self.game_parametres["field_height"]
        x_fraction = self.game_parametres["paddle_xposition"]

        player1_x = field_width * x_fraction
        player1_y = field_heigth / 2
        self.game_state["player1_position"] = [player1_x, player1_y]

        player2_x = field_width - (field_width * x_fraction)
        player2_y = field_heigth / 2
        self.game_state["player2_position"] = [player2_x, player2_y]

        self.game_state["ball_position"] = [field_width / 2, field_heigth / 2]

    def update_paddles(self, player, direction):
        speed = self.game_parametres["paddle_speed"]
        paddle_height = self.game_parametres["paddle_height"]
        feild_height = self.game_parametres["field_height"]
        if player == "player1":
            old_position = self.game_state["player1_position"][1]
            new_position = self.clamp(old_position + (direction * speed * self.time_per_tick), paddle_height / 2, feild_height - (paddle_height / 2))
            self.game_state["player1_position"][1] = new_position
        elif player =="player2":
            old_position = self.game_state["player2_position"][1]
            new_position = self.clamp(old_position + (direction * speed * self.time_per_tick), paddle_height / 2, feild_height - (paddle_height / 2))
            self.game_state["player2_position"][1] = new_position
        







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
    
    def clamp(value, min_value, max_value):
        return max(min_value, min(value, max_value))
    
    def normalize(vector):
        x, y = vector
        magnitude = math.sqrt(x**2 + y**2)
        if magnitude == 0:
            raise ValueError("Zero Vector")
        return (x / magnitude, y / magnitude)
