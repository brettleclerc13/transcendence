import json
import math
import time
import asyncio
from utils.redis import RedisManager
from asyncio import Queue
from channels.generic.websocket import AsyncWebsocketConsumer


class PongGameConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(self, *args, **kwargs)
        self.game_state = {
            "player1_position": [],
            "player2_position": [],
            "ball_position": [],
            "ball_direction": [0.707, 0.707],  # Unit Vector for ball direction 0.707 0.707
            "ball_speed": 12,
            "score": [0, 0],
            "resolution": [],
            "collision_point": [],
            "last_update_time": time.time(),
        }
        self.game_parametres = {
            "ball_diametre": 1,
            "paddle_speed": 10, #units per second
            "paddle_height": 8,
            "paddle_width": 2,
            "ball_speed": 12, #units per second
            "paddle_xposition": 0.2, #as a fraction of total width where X is fraction distance from the edge
            "resolution": 8,
            "screen_width": 800,
            "screen_height": 400,
            "point_goal": 7,
            "field_width": 100,
            "field_height": 100
        }
        self.players = set()  # Track connected players in the room
        self.input_queue = Queue()
        self.has_initialize = False
        #debugging
        self.debug_collision = False
        self.debug_connections = False
        self.debug_game_stats = True
        self.debug_paddle = False
        self.debug_ball = False
        #variables to change the feel of the game
        self.time_per_tick = 0.1 
        self.sub_tick_amount = 5
        self.reflection_bias = 0.95    
        self.max_speed = 10000 # best not set too high
        self.directional_limit = 0.1
        self.dir_correction_rate = 0.12

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"pong_{self.room_name}"

        # Detect User-Agent to differentiate between CLI and browser users
        headers = dict(self.scope["headers"])
        user_agent = headers.get(b"user-agent", b"").decode("utf-8")  # Decode bytes to string

        try:
            self.redis = await RedisManager.get_redis()
            if self.debug_connections:
                print(f"Redis connected for {self.channel_name}", flush=True)
                print(f"BIG CHECK~ {user_agent} ~CHECK BIG", flush=True)

            if "Python/3.10 websockets/15.0" in user_agent:  # Browser connection
                if self.debug_connections:            
                    print(f"🖥️ CLI user connected: {self.channel_name}", flush=True)

                await self.accept()
                await self.handle_cli_request()
                await self.close()

            else:
                if self.debug_connections:
                    print(f"🌐 Web user connected: {self.channel_name}", flush=True)

                players_key = f"room:{self.room_name}:players"
                current_players = await self.redis.lrange(players_key, 0, -1)

                if len(current_players) >= 2:
                    print("Room Full", flush=True)
                    await self.close(code=4000)
                    return

                await self.accept()
                await self.redis.rpush(players_key, self.channel_name)

                player_number = f"player_{len(current_players) + 1}"
                self.temp_player = player_number
                await self.send(text_data=json.dumps({
                    "type": "initializer_pack",
                    "player_role": player_number
                }))

                # Join the room group
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                

        except Exception as e:
            print(f"Error connecting to redis: {e}", flush=True)
            await self.close()

        
    async def disconnect(self, close_code):
        try:    
            # Remove player from the room
            players_key = f"room:{self.room_name}:players"

           
            await RedisManager.delete_user_data_list("room", self.room_name, "players", self.channel_name)
            await RedisManager.delete_user_data_list("room", self.room_name, "initialized_players", self.channel_name)
            current_players = await self.redis.lrange(players_key, 0, -1)

            # Stop game loop if all players leave
            if self.debug_connections:
                print(f"in disconect: len of players {len(current_players)}", flush=True)
            if len(current_players) < 2:
                await self.handle_game_end("No Winner", "Game ended due to a disconnection")
        except Exception as e:
            print(f"Error during disconnect: {e}", flush=True)

#starting game needs upgrading
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        players_key = f"room:{self.room_name}:players"
        initialized_key = f"room:{self.room_name}:initialized_players"
        game_started_key = f"room:{self.room_name}:game_running"
        input_queue_key = f"room:{self.room_name}:inputs"
        
        if data["type"] == "initialize":
            if self.debug_game_stats:
                print(data["game_parametres"], flush=True)
            
            self.update_game_parametres(data["game_parametres"])
            self.has_initialize = True
            
            await self.redis.rpush(initialized_key, self.channel_name)
            
            initialized_players = await self.redis.lrange(initialized_key, 0, -1)
            all_players = await self.redis.lrange(players_key, 0, -1)
            if self.debug_game_stats:
                print(f"init players: {len(initialized_players)}, all players: {len(all_players)}", flush=True)
            if len(initialized_players) == len(all_players) == 2:
                was_set = await self.redis.execute("SET", game_started_key, self.channel_name, "NX")

                if was_set:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "start_game",
                        }
                    )
                    if self.debug_game_stats:
                        print(f"Starting the game task by {self.temp_player}", flush=True)
                    self.game_task = asyncio.create_task(self.game_loop(), name=f"GameLoop-{self.room_name}")
        elif data["type"] == "input":
            await self.redis.rpush(input_queue_key, json.dumps({
                "player": data["player"],
                "direction": data["direction"]
            }))
    
    async def handle_cli_request(self):
        try:
            players_key = f"room:{self.room_name}:players"
            game_state_key = f"room:{self.room_name}:state"
            
            raw_players = await self.redis.lrange(players_key, 0, -1)
            number_of_players = [player.decode("utf-8") for player in raw_players]
            game_state = await RedisManager.get_json(game_state_key)

            response = {
                "type": "CLI_Response",
                "game_state": game_state,
                "number_of_players": number_of_players,
            }

            await self.send(text_data=json.dumps(response))
            if self.debug_connections:
                print(f"CLI request serviced, disconnecting: {self.channel_name}", flush=True)
        except Exception as e:
            print(f"Error handling CLI request: {e}", flush=True)

    async def start_game(self, event):
    # Notify the WebSocket client that the game is starting
        await self.send(text_data=json.dumps({
            "type": "start_game",
            "message": "The game is starting!",
        }))
    
    async def game_update(self, event):
        #print(f"Sending message: {json.dumps({'type': 'game_update', 'game_state': self.game_state})}", flush=True)

        await self.send(text_data=json.dumps({
            "type": "game_update",
            "game_state": event["game_state"],
        })) 

    async def game_end(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_end",
            "message": event["message"],
            "winner": event["winner"]
        }))
    ''' 
    async def dispatch(self, message):
        print(f"Dispatching message: {message}", flush=True)
        await super().dispatch(message)
    '''
    async def handle_game_end(self, winner: str, msg: str):
        try:
            print("Games Ending", flush=True)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_end",
                    "message": msg,
                    "winner": winner
                }
            )
            await RedisManager.delete_room_data(self.room_name)
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            if hasattr(self, "game_task"):
                self.game_task.cancel()
        except Exception as e:
            print(f"Error handling game end: {e}", flush=True)
     

    async def game_loop(self):
        input_queue_key = f"room:{self.room_name}:inputs"
        game_state_key = f"room:{self.room_name}:state"
        input_buffers = {"player_1": [], "player_2": []}
        buffer_size = 2

        try:
            if self.debug_game_stats:
                print("The game has begun")
            while True:
                loop_start = time.perf_counter()
                #active_tasks = asyncio.all_tasks()  # Get all running tasks
                #print(f"Active tasks: {[task.get_name() for task in active_tasks]}", flush=True)
                
                #handle player inputs (note there is no safe guard agaisnt spam requests or delayed requests)
                while True:
                    input_data = await self.redis.lpop(input_queue_key)
                    if not input_data:
                        break
                    input_event = json.loads(input_data)
                    player = input_event["player"]
                    direction = input_event["direction"]
                    
                    input_buffers[player].append(direction)

                    if len(input_buffers[player]) > buffer_size:
                        input_buffers[player].pop(0)

                
                self.game_state["collision_point"]= []

                for player in ["player_1", "player_2"]:
                    if input_buffers[player]:
                        direction = input_buffers[player].pop(0)
                        if self.has_initialize:
                            if self.debug_paddle:
                                print(f"Updating for {player} thats moving {direction}", flush=True)
                            self.update_paddles(player, direction)

                #handle the game, move the ball handle collisions and scoring
                for i in range(self.sub_tick_amount):
                    self.update_ball_position(self.game_state["ball_position"], self.game_state["ball_direction"], self.game_state["ball_speed"])
                    has_collided, normal, collision_point, paddle = self.detect_collisions()
                    if has_collided:
                        if self.debug_collision:                            
                            print(f"normal: {normal} , collision_point {collision_point} , paddle {paddle}", flush=True)
                        self.handle_collision(normal, collision_point, paddle)
                        if self.game_state["score"][0] >= self.game_parametres["point_goal"]:
                            await self.handle_game_end("player_1", "Player 1 was won")
                        elif self.game_state["score"][1] >= self.game_parametres["point_goal"]:
                            await self.handle_game_end("player_2", "Player 2 was won")
                self.game_state["last_update_time"] = time.time()
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "game_state": self.game_state,
                    }
                )

                await self.redis.execute("SET", game_state_key, json.dumps(self.game_state))

                loop_end = time.perf_counter()  # End time
                if self.debug_game_stats:
                    loop_duration = (loop_end - loop_start) * 1000  # Convert to ms
                    print(f"🕒 Game loop execution time: {loop_duration:.2f} ms", flush=True)
                # Wait for the next tick
                remaining_time = max(0, self.time_per_tick - (loop_end - loop_start))
                await asyncio.sleep(remaining_time)
        except asyncio.CancelledError:
            print("Game Loop Ended", flush=True)
            # Gracefully exit the game loop if the task is canceled
            pass
        finally:
            # Clear the game running flag in Redis
            game_running_key = f"room:{self.room_name}:game_running"
            await self.redis.delete(game_running_key)
    
    def update_ball_position(self, ball_position, ball_direction, ball_speed):
        deltaX = (ball_speed * self.time_per_tick * ball_direction[0]) / self.sub_tick_amount
        deltaY = (ball_speed * self.time_per_tick * ball_direction[1]) / self.sub_tick_amount
        field_height = self.game_parametres["field_height"] 
        field_width = self.game_parametres["field_width"]
        ball_diametre = self.game_parametres["ball_diametre"]

        new_x = self.clamp(ball_position[0] + deltaX, ball_diametre / 2, (field_width - (ball_diametre / 2)))
        new_y = self.clamp(ball_position[1] + deltaY, ball_diametre / 2, (field_height - (ball_diametre / 2)))
        if self.debug_ball:
            print(f"old(x,y) ( {ball_position[0]} , {ball_position[1]}) ~~~ delta(x,y): ( {deltaX} , {deltaY} ) ~~~ new(x,y) : ( {new_x} , {new_y})", flush=True)
        self.game_state["ball_position"][0] = new_x
        self.game_state["ball_position"][1] = new_y

    def update_game_parametres(self, new_parametres):
        self.game_parametres.update(new_parametres)
        self.game_parametres["field_width"] = self.game_parametres["screen_width"] / self.game_parametres["resolution"]
        self.game_parametres["field_height"] = self.game_parametres["screen_height"] / self.game_parametres["resolution"] 
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
        self.game_state["resolution"] = self.game_parametres["resolution"]
        self.game_state["ball_speed"] = self.game_parametres["ball_speed"]
        
        #TEMP
        #self.game_state["player2_position"] = [80, 42]
        #self.game_state["ball_position"] = [78.4, 37]
        #self.game_state["ball_position"] = [56, 25]
        #self.game_state["ball_position"] = [93, 15]

    def update_paddles(self, player, direction):
        speed = self.game_parametres["paddle_speed"]
        paddle_height = self.game_parametres["paddle_height"]
        paddle_width = self.game_parametres["paddle_width"]
        feild_height = self.game_parametres["field_height"]

        ball_x, ball_y = self.game_state["ball_position"]
        ball_vx, ball_vy = self.game_state["ball_direction"]
        ball_radius = self.game_parametres["ball_diametre"] / 2
        
        if player == "player_1":
            paddle_x, old_position = self.game_state["player1_position"]
        elif player =="player_2":
            paddle_x, old_position = self.game_state["player2_position"]

        new_position = self.clamp(old_position + (direction * speed * self.time_per_tick), paddle_height / 2, feild_height - (paddle_height / 2))
        
        closest_x = max(paddle_x - paddle_width / 2, min(ball_x, paddle_x + paddle_width / 2))
        closest_y = max(new_position - paddle_height / 2, min(ball_y, new_position + paddle_height / 2))
        
        distance_x = ball_x - closest_x
        distance_y = ball_y - closest_y
        distance = math.sqrt(distance_x**2 + distance_y**2)

        paddle_left = paddle_x - paddle_width / 2
        paddle_right = paddle_x + paddle_width / 2
        paddle_top = new_position + paddle_height / 2
        paddle_bottom = new_position - paddle_height / 2
        
        
        if distance <= ball_radius:
            if ball_x >= paddle_left and ball_x <= paddle_right:
                if self.debug_paddle:
                    print("MOVEMENT EXCEPTION top-bot", flush=-True)
                if direction > 0:
                    new_position = ball_y - ball_radius - paddle_height / 2
                    if ball_vy < 0:
                        self.game_state["ball_direction"] = self.reflect((ball_vx, ball_vy), (0, 1))
                elif direction <0:
                    new_position = ball_y + ball_radius + paddle_height / 2
                    if ball_vy > 0:
                        self.game_state["ball_direction"] = self.reflect((ball_vx, ball_vy), (0, -1))
                self.game_state["collision_point"].append([ball_x, ball_y])
            elif ball_y >= paddle_top - ball_radius or ball_y <= paddle_bottom + ball_radius:
                if self.debug_paddle:
                    print("MOVEMENT EXCEPTION corrners", flush=-True)
                corner_x = paddle_left if ball_x < paddle_left else paddle_right
            
                dx = ball_x - corner_x
                
                offset = math.sqrt(ball_radius**2 - dx**2)
                if direction > 0:
                    new_position = ball_y - offset - (paddle_height / 2)
                else:
                    new_position = ball_y + offset + (paddle_height / 2)
                
                paddle_top = new_position + paddle_height / 2
                paddle_bottom = new_position - paddle_height / 2
                
                corner_y = paddle_bottom if direction < 0 else paddle_top
                
                dy = ball_y - corner_y
                
                distance = math.sqrt(dx**2 + dy**2)

                self.game_state["ball_direction"] = self.reflect((ball_vx, ball_vy), (dx/distance, dy/distance))
                self.game_state["collision_point"].append([ball_x, ball_y])
            else:
                if self.debug_paddle:
                    print("MOVEMENT EXCEPTION Side", flush=-True)
                delta_x = (ball_radius - abs(closest_x - ball_x))
                if ball_x < paddle_x:
                    delta_x *= -1
                delta_y = delta_x * (ball_vy / ball_vx)
                new_x = ball_x + delta_x
                new_y = ball_y + delta_y
                if self.debug_ball:
                    print(f"UPDATING BALL POSITION TO: {new_x} {new_y}", flush=True)
                self.game_state["ball_position"] = [new_x, new_y]
                self.game_state["collision_point"].append([new_x, new_y])
                if ball_x < paddle_x and self.game_state["ball_direction"][0] >= 0:
                    self.game_state["ball_direction"] = self.reflect((ball_vx, ball_vy), (-1, 0))
                elif ball_x > paddle_x and self.game_state["ball_direction"][0] <= 0:
                    self.game_state["ball_direction"] = self.reflect((ball_vx, ball_vy), (1, 0))
                
        if self.debug_paddle:
            print(f"updating {player} to new Y position: {new_position}", flush=True)
        if player == "player_1":
            self.game_state["player1_position"][1] = new_position
        elif player == "player_2":
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

        if ball_pos[0] <= ball_radius or ball_pos[0] >= field_width - ball_radius:
            if ball_pos[0] == ball_radius:
                collision_point = (0, ball_pos[1])
                normal_vector = (1, 0)
            else:
                collision_point = (field_width, ball_pos[1])
                normal_vector = (-1, 0)
            self.game_state["collision_point"].append(self.game_state["ball_position"])
            if self.debug_collision:
                print(f"Hit the Vertical Wall: collision: {collision_point}", flush=True)
            return True, normal_vector, collision_point, None
        
        if ball_pos[1] <= ball_radius or ball_pos[1] >= field_height - ball_radius:
            if ball_pos[1] == ball_radius:
                collision_point = (ball_pos[0], 0)
                normal_vector = (0, 1)
            else:
                collision_point = (ball_pos[0], field_height)
                normal_vector = (0, -1)
            self.game_state["collision_point"].append(self.game_state["ball_position"])
            if self.debug_collision:
                print(f"Hit the Horizontal Wall: collision: {collision_point}", flush=True)
            return True, normal_vector, collision_point, None
        
        closest_x = max(paddle1[0] - half_width, min(ball_pos[0], paddle1[0] + half_width))
        closest_y = max(paddle1[1] - half_height, min(ball_pos[1], paddle1[1] + half_height))

        distance_x = ball_pos[0] - closest_x
        distance_y = ball_pos[1] - closest_y
        distance = math.sqrt(distance_x**2 + distance_y**2)

        if distance <= ball_radius:
            if self.debug_collision:
                print(f"closest point: {closest_x} , {closest_y} | distance vec: {distance_x} , {distance_y} | distance value: {distance}", flush=True)
            collision_point = (closest_x, closest_y)
            if distance == 0:
                normal_vector = (0, 0)
            else:
                normal_vector = (distance_x / distance, distance_y / distance)
            self.correct_ball_pos(collision_point, paddle1[0])
            self.game_state["collision_point"].append(self.game_state["ball_position"])
            return True, normal_vector, collision_point, "paddle1"
        
        closest_x = max(paddle2[0] - half_width, min(ball_pos[0], paddle2[0] + half_width))
        closest_y = max(paddle2[1] - half_height, min(ball_pos[1], paddle2[1] + half_height))

        distance_x = ball_pos[0] - closest_x
        distance_y = ball_pos[1] - closest_y
        distance = math.sqrt(distance_x**2 + distance_y**2)


        if distance <= ball_radius:
            if self.debug_collision:
                print(f"closest point: {closest_x} , {closest_y} | distance vec: {distance_x} , {distance_y} | distance value: {distance}", flush=True)
            collision_point = (closest_x, closest_y)
            if distance == 0:
                normal_vector = (0, 0)
            else:
                normal_vector = (distance_x / distance, distance_y / distance)
            self.correct_ball_pos(collision_point, paddle2[0])
            self.game_state["collision_point"].append(self.game_state["ball_position"])
            return True, normal_vector, collision_point, "paddle2"

        return False, None, None, None
    
    def handle_collision(self, normal, collision_point, player):
        paddle_height_half = self.game_parametres["paddle_height"] / 2
        paddle_width_half = self.game_parametres["paddle_width"] / 2
        player1_pos = self.game_state["player1_position"]
        player2_pos = self.game_state["player2_position"]

        if self.debug_collision:
            print(f"player: {player}, normal: {normal}, collision_point: {collision_point}", flush=True)

        #handle collisions on the left and right walls
        if collision_point[0] == 0 or collision_point[0] == self.game_parametres["field_width"]:
            self.init_starting_positions()
            if collision_point[0] == 0:
                self.game_state["score"][1] += 1
                self.game_state["ball_direction"] = [-0.707, 0.707]
                self.game_state["ball_speed"] = self.game_parametres["ball_speed"]
            else:
                self.game_state["ball_direction"] = [0.707, 0.707]
                self.game_state["score"][0] += 1
                self.game_state["ball_speed"] = self.game_parametres["ball_speed"]
            return
        #handle collisions on the top and bottom walls
        if collision_point[1] == 0 or collision_point[1] == self.game_parametres["field_height"]:
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
        
        #handle collisions on the top and bottom of the paddle

        if (collision_point[0] > (player1_pos[0] - paddle_width_half)) and (collision_point[0] < (player1_pos[0] + paddle_width_half)):
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
        if (collision_point[0] > (player2_pos[0] - paddle_width_half)) and (collision_point[0] < (player2_pos[0] + paddle_width_half)):
            self.game_state["ball_direction"] = self.reflect(self.game_state["ball_direction"], normal)
            return
       
        
        #handle collisions on the sides of the paddles with introduced bias based on where the ball hit the paddle
        if player == "paddle1":
            self.game_state["ball_speed"] += 0.1
            relative_pos = (collision_point[1] - player1_pos[1]) / paddle_height_half
        elif player == "paddle2":
            self.game_state["ball_speed"] += 0.1
            relative_pos = (collision_point[1] - player2_pos[1]) / paddle_height_half
        if self.game_state["ball_speed"] >= self.max_speed:
            self.game_state["ball_speed"] = self.max_speed
        if self.debug_collision:
            print(f"relative popsition: {relative_pos}", flush=True)
        
        reflected = self.reflect(self.game_state['ball_direction'], normal)
        

        if self.game_state["ball_direction"][1] == 0:
            if relative_pos == 0:
                relative_pos == 0.2
            reflected[1] += self.reflection_bias * relative_pos
            reflected =  self.normalize(reflected)
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
        if self.debug_collision:
            print(f"reflected direction: {reflected[0]}, {reflected[1]}", flush=True)
        self.game_state["ball_direction"] = self.correct_ball_dir(reflected)

    def correct_ball_pos(self, collision_point, paddle_x):
        ball_x, ball_y = self.game_state["ball_position"]
        ball_vx, ball_vy = self.game_state["ball_direction"]
        ball_radius = self.game_parametres["ball_diametre"] / 2

        delta_x = (ball_radius - abs(collision_point[0] - ball_x))
        if ball_x < paddle_x:
            delta_x *= -1
        delta_y = delta_x * (ball_vy / ball_vx)
        new_x = ball_x + delta_x
        new_y = ball_y + delta_y
        if self.debug_collision:
            print(f"*CORRECTION* UPDATING POSITION TO: {new_x} {new_y}", flush=True)
        self.game_state["ball_position"] = [new_x, new_y]

    def correct_ball_dir(self, direction):
        Vx, Vy = direction
        if Vx >= 0 and Vx <= self.directional_limit:
            return self.normalize([Vx + self.dir_correction_rate, Vy])
        if Vx >= (-1 * self.directional_limit) and Vx < 0:
            return self.normalize([Vx - self.dir_correction_rate, Vy])

        if Vy >= 0 and Vy <= self.directional_limit:
            return self.normalize([Vx , Vy + self.dir_correction_rate])
        if Vy >= (-1 * self.directional_limit) and Vy < 0:
            return self.normalize([Vx, Vy - self.dir_correction_rate])
        return [Vx, Vy]
        

    def reflect(self, direction, normal):
        dx, dy = direction
        nx, ny = normal


        dot_product = dx * nx + dy * ny

        rx = dx - 2 * dot_product * nx
        ry = dy - 2 * dot_product * ny

        reflection = [rx, ry]

        return reflection  
    
    def clamp(self, value, min_value, max_value):
        return max(min_value, min(value, max_value))
    
    def normalize(self, vector):
        x, y = vector
        magnitude = math.sqrt(x**2 + y**2)
        if magnitude == 0:
            raise ValueError("Zero Vector")
        return (x / magnitude, y / magnitude)

### CHAT GPT stuff ###
# from django.db import transaction
# from django.contrib.auth import get_user_model
# from .models import Match

# User = get_user_model()

# async def update_match_in_db(room_name, winner_username, looser_username, score1, score2):
#     try:
#         player1 = await database_sync_to_async(User.objects.get)(username=winner_username)
#         player2 = await database_sync_to_async(User.objects.get)(username=looser_username)
#         match = await database_sync_to_async(Match.objects.get)(id=room_name)

#         if not match.is_finished:
#             with transaction.atomic():
#                 match.score_player1 = score1
#                 match.score_player2 = score2
#                 match.is_finished = True
#                 match.is_ongoing = False
#                 match.winner = player1
#                 match.looser = player2
#                 match.save()
                
#     except Exception as e:
#         print(f"Error updating match: {e}", flush=True)

# await update_match_in_db(self.room_name, winner, looser, self.game_state["score"][0], self.game_state["score"][1])
