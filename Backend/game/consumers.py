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
            "ball_direction": [0.707, 0.707],  # Unit Vector for ball direction
            "ball_speed": 12,
            "score": [0, 0],
            "last_update_time": time.time(),
        }
        self.game_parametres = {
            "ball_diametre": 1,
            "paddle_speed": 10, #units per second
            "paddle_height": 8,
            "paddle_width": 2,
            "ball_speed": 12, #units per second
            "paddle_xposition": 0.2, #as a fraction of total width where X is fraction distance from the edge
            "field_width": 100,
            "field_height": 100
        }
        self.players = set()  # Track connected players in the room
        self.input_queue = Queue()
        self.has_initialize = False
        self.time_per_tick = 0.05 #50 ms
        self.reflection_bias = 0.2

    async def connect(self):
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

#starting game needs upgrading
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "initialize":
            self.update_game_parametres(data["game_parametres"])
            self.has_initialize = True
        elif data["type"] == "start_game" and len(self.players) == 2:
            self.game_task = asyncio.create_task(self.game_loop())
        else:
            await self.input_queue.put(data)

    
       

    async def game_loop(self):

        try:
            while True:
                
                #handle player inputs (note there is no safe guard agaisnt spam requests or delayed requests)
                while not self.input_queue.empty():
                    input_event = await self.input_queue.get()
                    player = input_event["player"]
                    direction = input_event["direction"]
                    if self.has_initialize:
                        self.update_paddles(player, direction)

                #handle the game, move the ball handle collisions and scoring
                self.update_ball_position(self.game_state["ball_position"], self.game_state["ball_direction"], self.game_state["ball_speed"])
                has_collided, normal, collision_point, paddle = self.detect_collisions()
                if has_collided:
                    self.handle_collision(normal, collision_point, paddle)
                self.game_state["last_update_time"] = time.time()
                
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
    
    def update_ball_position(self, ball_position, ball_direction, ball_speed):
        deltaX = ball_speed * self.time_per_tick * ball_direction[0]
        deltaY = ball_speed * self.time_per_tick * ball_direction[1]
        field_height = self.game_parametres["field_height"] 
        field_width = self.game_parametres["field_width"]
        ball_diametre = self.game_parametres["ball_diametre"]

        new_x = self.clamp(ball_position[0] + deltaX, field_width - (ball_diametre / 2), ball_diametre / 2)
        new_y = self.clamp(ball_position[1] + deltaY, field_height - (ball_diametre / 2), ball_diametre / 2)

        self.game_state["ball_position"][0] = new_x
        self.game_state["ball_position"][1] = new_y

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
        speed = self.game_parametres["paddle_speed"] #for 20 TPS
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
        
    def detect_collisions(self):
        ball_radius = self.game_parametres["ball_diametre"] / 2
        half_width = self.game_parametres["paddle_width"] / 2
        half_height = self.game_parametres["paddle_height"] / 2
        ball_pos = self.game_state["ball_position"]
        paddle1 = self.game_state["player1_position"]
        paddle2 = self.game_state["player2_position"]
        field_width = self.game_parametres["field_width"]
        field_height = self.game_parametres["field_height"]

        closest_x = max(paddle1[0] - half_width, min(ball_pos[0], paddle1[0] + half_width))
        closest_y = max(paddle1[1] - half_height, min(ball_pos[1], paddle1[1] + half_height))

        distance_x = ball_pos[0] - closest_x
        distance_y = ball_pos[1] - closest_y
        distance = math.sqrt(distance_x**2 + distance_y**2)

        if distance <= ball_radius:
            collision_point = (closest_x, closest_y)
            if distance == 0:
                normal_vector = (0, 0)
            else:
                normal_vector = (distance_x / distance, distance_y / distance)
            return True, normal_vector, collision_point, "paddle1"
        
        closest_x = max(paddle2[0] - half_width, min(ball_pos[0], paddle2[0] + half_width))
        closest_y = max(paddle2[1] - half_height, min(ball_pos[1], paddle2[1] + half_height))

        distance_x = ball_pos[0] - closest_x
        distance_y = ball_pos[1] - closest_y
        distance = math.sqrt(distance_x**2 + distance_y**2)

        if distance <= ball_radius:
            collision_point = (closest_x, closest_y)
            if distance == 0:
                normal_vector = (0, 0)
            else:
                normal_vector = (distance_x / distance, distance_y / distance)
            return True, normal_vector, collision_point, "paddle2"
        
        if ball_pos[0] == ball_radius or ball_pos[0] == field_width - ball_radius:
            if ball_pos[0] == ball_radius:
                collision_point = (0, ball_pos[1])
                normal_vector = (1, 0)
            else:
                collision_point = (field_width, ball_pos[1])
                normal_vector = (-1, 0)
            return True, normal_vector, collision_point, None
        
        if ball_pos[1] == ball_radius or ball_pos[1] == field_height - ball_radius:
            if ball_pos[1] == ball_radius:
                collision_point = (ball_pos[0], 0)
                normal_vector = (0, 1)
            else:
                collision_point = (ball_pos[0], field_height)
                normal_vector = (0, -1)
            return True, normal_vector, collision_point, None

        return False, None, None, None

    def handle_collision(self, normal, collision_point, player):
        paddle_height_half = self.game_parametres["paddle_height"] / 2
        paddle_width_half = self.game_parametres["paddle_width"] / 2
        player1_pos = self.game_state["player1_position"]
        player2_pos = self.game_state["player2_position"]

        #handle collisions on the left and right walls
        if collision_point[0] == 0 or collision_point[0] == self.game_parametres["field_width"]:
            self.init_starting_positions()
            if collision_point[0] == 0:
                self.game_state["score"][0] += 1
                self.game_state["ball_direction"] = [-0.707, 0.707]
            else:
                self.game_state["ball_direction"] = [0.707, 0.707]
                self.game_state["score"][1] += 1
            return
        #handle collisions on the top and bottom walls
        if collision_point[1] == 0 or collision_point[1] == self.game_parametres["field_height"]:
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
        
        #handle collisions on the top and bottom of the paddle
        if collision_point[0] > player1_pos[0] - paddle_width_half and collision_point < player1_pos[0] + paddle_width_half:
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
        if collision_point[0] > player2_pos[0] - paddle_width_half and collision_point < player2_pos[0] + paddle_width_half:
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
        
        #handle collisions on the sides of the paddles with introduced bias based on where the ball hit the paddle
        if player == "paddle1":
            relative_pos = (collision_point[1] - player1_pos[1]) / paddle_height_half
        else:
            relative_pos = (collision_point[1] - player2_pos[1]) / paddle_height_half

        reflected = self.reflect(self.game_state["ball_direction"], normal)

        if self.game_state["ball_direction"][1] == 0:
            if relative_pos == 0:
                relative_pos == 0.01
            reflected[1] += self.reflection_bias * relative_pos
            reflected = self.normalize(reflected)
        elif self.game_state["ball_direction"][1] > 0:
            bias_x = max(0, relative_pos)
            bias_y = max(0, -relative_pos)
            reflected[0] = reflected[0] + (reflected[0] * bias_x * self.reflection_bias)
            reflected[1] = reflected[1] + (reflected[1] * bias_y * self.reflection_bias)
            reflected = self.normalize(reflected)
        elif self.game_state["ball_direction"][1] < 0:
            bias_x = max(0, -relative_pos)
            bias_y = max(0, relative_pos)
            reflected[0] = reflected[0] + (reflected[0] * bias_x * self.reflection_bias)
            reflected[1] = reflected[1] + (reflected[1] * bias_y * self.reflection_bias)
            reflected = self.normalize(reflected)
        
        self.game_state["ball_direction"] = reflected

    def reflect(direction, normal):
        dx, dy = direction
        nx, ny = normal

        dot_product = dx * nx + dy * ny

        rx = dx - 2 * dot_product * nx
        ry = dy - 2 * dot_product * ny

        reflection = [rx, ry]

        return reflection  

    async def game_update(self, event):
        """
        Send the updated game state to the frontend.
        """
        await self.send(text_data=json.dumps(event["game_state"]))
    
    def clamp(value, min_value, max_value):
        return max(min_value, min(value, max_value))
    
    def normalize(vector):
        x, y = vector
        magnitude = math.sqrt(x**2 + y**2)
        if magnitude == 0:
            raise ValueError("Zero Vector")
        return (x / magnitude, y / magnitude)
