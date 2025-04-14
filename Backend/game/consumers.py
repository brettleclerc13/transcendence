import json
import math
import time
import asyncio
from asyncio import Queue
from match.models import Match
from urllib.parse import parse_qs
from user.models import UserProfile
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.tokens import AccessToken
from utils.redis import RedisManager
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async


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
        self.is_cli = False
        #debugging
        self.debug_collision = False
        self.debug_connections = False
        self.debug_game_stats = False
        self.debug_paddle = False
        self.debug_ball = False
        self.debug_loop = False
        #variables to change the feel of the game
        self.time_per_tick = 0.1 
        self.sub_tick_amount = 5
        self.reflection_bias = 0.55    
        self.max_speed = 45 # best not set too high
        self.directional_limit = 0.1
        self.dir_correction_rate = 0.12
        self.reconnection_timer = 20

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"pong_{self.room_name}"

        # Detect User-Agent to differentiate between CLI and browser users
        headers = dict(self.scope["headers"])
        user_agent = headers.get(b"user-agent", b"").decode("utf-8")  # Decode bytes to string
        duplicate_check = f"room:{self.room_name}:duplicates"
        state_key = f"room:{self.room_name}:state"

        try:
            self.redis = await RedisManager.get_redis()
            if self.debug_connections:
                if self.redis is not None:
                    print(f"Redis connected for {self.channel_name}", flush=True)
                print(f"User-agent: {user_agent}  | | room name: {self.room_name}", flush=True)

            if "Python/3.10 websockets/15.0" in user_agent:  # Browser connection
                if self.debug_connections:            
                    print(f"🖥️ CLI user connected: {self.channel_name}", flush=True)
                self.is_cli = True
                await self.accept()
                await self.handle_cli_request()
                await self.close()

            else:
                if self.debug_connections:
                    print(f"🌐 Web user connected: {self.channel_name}", flush=True)
                self.user = await self.authenticate_user()
                if not self.user:
                    await self.close(code=4001)  
                    return
                if self.debug_connections:
                    print(f"User Authenticated!", flush=True)
                self.match = await self.get_match(self.room_name)
                if not self.match:
                    await self.close(code=4002)
                    return
                await RedisManager.append_to_list(duplicate_check, str(self.user.id))
                if await self.checkduplate():
                    await RedisManager.remove_last_and_set_list(duplicate_check)
                    await RedisManager.set_state(state_key, "duplicate refused")
                    await self.close(code=4003)
                    return
                if self.debug_connections:
                    print(f"Match Authenticated!", flush=True)

                players_key = f"room:{self.room_name}:players"
                current_players = await self.redis.lrange(players_key, 0, -1)

                if len(current_players) >= 2:
                    print("Room Full", flush=True)
                    await self.close(code=4000)
                    return

                await self.accept()
                username = await sync_to_async(lambda: self.user.user.username)()
                await self.redis.rpush(players_key, username)
                
                self.player_number =  await self.get_player_number()
                await self.send(text_data=json.dumps({
                    "type": "initializer_pack",
                    "player_role": self.player_number
                }))

                state_key = f"room:{self.room_name}:state"
                if await RedisManager.get_state(state_key) == "waiting for reconnection":
                    await self.send(text_data=json.dumps({
                        "type": "reconnected",
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        "type": "get-ready",
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
        state_key = f"room:{self.room_name}:state"
        prev_state_key = f"room:{self.room_name}:prev_state"
        game_started_key = f"room:{self.room_name}:game_running"
        players_key = f"room:{self.room_name}:players"
        username = None
        if self.is_cli:
            return
        if await RedisManager.get_state(state_key) == "duplicate refused":
            return

        if hasattr(self, "user") and self.user:
            username = await sync_to_async(lambda: self.user.user.username)()
        
        try:
            if hasattr(self, "user") and self.user:     
                await RedisManager.delete_user_data_list("room", self.room_name, "players", username)
            current_players = await RedisManager.get_list_of_list(players_key)

            if self.debug_connections:

                print(f"in disconect: len of players {len(current_players)}", flush=True)
                print(f"the game state at disconnect: {await RedisManager.get_state(state_key)}", flush=True)
            if (await RedisManager.get_state(state_key)) in ["game ongoing", "waiting for players", "waiting for reconnection"]: 
                await RedisManager.set_state(prev_state_key, f"{await RedisManager.get_state(state_key)}") 
                await RedisManager.set_state(state_key, "waiting for reconnection")
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "terminate_game", 
                            "reason": "user disconnected, waiting"
                        }
                    )
                if hasattr(self, "game_task"):
                    self.game_task.cancel()
                await self.redis.delete(game_started_key)
                asyncio.create_task(self.wait_for_reconnection(username))
        except Exception as e:
            print(f"Error during disconnect: {e}", flush=True)

#starting game needs upgrading
    async def receive(self, text_data):
        data = json.loads(text_data)


        players_key = f"room:{self.room_name}:players"
        game_started_key = f"room:{self.room_name}:game_running"
        input_queue_key = f"room:{self.room_name}:inputs"
        state_key = f"room:{self.room_name}:state"
        prev_state_key = f"room:{self.room_name}:prev_state"
        game_state_key = f"room:{self.room_name}:game_state"
        
        if data["type"] in ["initialize", "restart"]:
            if self.debug_game_stats:
                print(data["type"], flush=True)
                print(data["game_parametres"], flush=True)
            
            await RedisManager.set_state(state_key, "waiting for players")
            previous_state = await RedisManager.get_state(prev_state_key)
            
            self.update_game_parametres(data["game_parametres"])
            self.has_initialize = True
            if data["type"] == "initialize" and previous_state in ["waiting for players", "game ongoing", "unknown"]:
                if previous_state == "waiting for players":
                    await self.redis.execute("SET", game_state_key, json.dumps(self.game_state))
                elif previous_state == "game ongoing":
                    self.game_state = await RedisManager.get_json(game_state_key)    
            if data["type"] == "restart" and previous_state in ["game ongoing", "waiting for reconnection"]:
                self.game_state = await RedisManager.get_json(game_state_key)
            
            if self.debug_game_stats:
                print(f"game state: {self.game_state}", flush=True)
            all_players = await self.redis.lrange(players_key, 0, -1)
            if self.debug_game_stats:
                print(f"Trying to start the Task, all players: {len(all_players)}", flush=True)
            if len(all_players) == 2:
                was_set = await self.redis.execute("SET", game_started_key, self.channel_name, "NX")

                if was_set:
                    await asyncio.sleep(0.1)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "start_game",
                        }
                    )
                    if self.debug_game_stats:
                        print(f"Starting the game task by {self.player_number}", flush=True)
                    await RedisManager.set_state(state_key, "game ongoing")
                    self.game_task = asyncio.create_task(self.game_loop(), name=f"GameLoop-{self.room_name}")
            else:
                if previous_state in ["waiting for reconnection", "game ongoing"]:
                    await RedisManager.set_state(state_key, "waiting for reconnection")
        elif data["type"] == "input":
            await self.redis.rpush(input_queue_key, json.dumps({
                "player": self.player_number, #potentially
                "direction": data["direction"]
            }))

    async def checkduplate(self):
        duplicate_check = f"room:{self.room_name}:duplicates"

        users = await RedisManager.get_list_of_list(duplicate_check)
        if self.debug_connections:
            print(f"this user: {self.user.id}, users in total: {users}", flush=True)

        if len(users) >= 2 and users[0] == users[1]:
            return True
        return False
    
    async def handle_cli_request(self):
        try:
            players_key = f"room:{self.room_name}:players"
            game_state_key = f"room:{self.room_name}:game_state"
            
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

    
    async def authenticate_user(self):
        try:
            query_params = parse_qs(self.scope["query_string"].decode())  
            token = query_params.get("token", [None])[0]  

            if self.debug_connections:
                print(f"querry parametres: {query_params} | | the token: {token}", flush=True)

            if not token:
                return None  

            decoded_token = AccessToken(token)  
            user_id = decoded_token["user_id"] 
            if self.debug_connections:
                print(f"decoded token: {decoded_token}  | | USER ID: {user_id}", flush=True) 

            return await self.get_user(user_id)
        
        except Exception as e:
            print(f"JWT Authentication Error: {e}")
            return None  

    async def get_user(self, user_id):
        try:
            return await asyncio.get_event_loop().run_in_executor(
                None, lambda: UserProfile.objects.get(user_id=user_id)
            )
        except ObjectDoesNotExist:
            return None
    
    async def get_match(self, match_id):
        try:
            return await asyncio.get_event_loop().run_in_executor(
                None, lambda: Match.objects.get(id=match_id)
            )
        except ObjectDoesNotExist:
            return None
        
    async def save_match(self, score1, score2, winner, loser):
        try:
            self.match.score_player1 = score1
            self.match.score_player2 = score2
            self.match.winner = winner
            self.match.looser = loser
            self.match.is_ongoing = False
            self.match.is_finished = True
            await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.match.save()
            )
            return True
        except ObjectDoesNotExist:
            return False
        
    async def get_player_number(self):
        try:
            if await sync_to_async(lambda: self.match.player1.id)() == self.user.id:
                return "player_1"
            return "player_2"
        except Exception as e:
            print(f"Error in get_player_number: {e}", flush=True)
            return None

    async def start_game(self, event):
    # Notify the WebSocket client that the game is starting
        await self.send(text_data=json.dumps({
            "type": "start_game",
            "message": "The game is starting!",
        }))
    
    async def terminate_game(self, event):
        if hasattr(self, "game_task"):
            self.game_task.cancel()
        if event["reason"] == "user disconnected, waiting":
            msg_type = "pending_reconnection"
        elif event["reason"] == "a player won, game_over":
            msg_type = "game_ending"
        await self.send(text_data=json.dumps({
            "type": msg_type,
            "reason": event.get("reason", "nothing"),
            "winner": event.get("winner", "no-one")
        }))

    
    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_update",
            "game_state": event["game_state"],
        }))

    '''
    async def pending_reconnection(self, event):
        await self.send(text_data=json.dumps({
            "type": "pending_reconnection"
        }))
    '''

    async def wait_for_reconnection(self, username):
        try:
            for i in range(10):
                await asyncio.sleep(self.reconnection_timer/10)  
                current_players = await RedisManager.get_list_of_list(f"room:{self.room_name}:players")
                if username in current_players:
                    if self.debug_connections:
                        print(f"User {username} reconnected!", flush=True)
                    return
                else:
                    if self.debug_connections:
                        print(f"{username} is not back yet checking again soon!", flush=True)  

            await RedisManager.set_state(f"room:{self.room_name}:state", "game over")

            winner = "player_2" if self.player_number == "player_1" else "player_1"
            if await RedisManager.get_state(f"room:{self.room_name}:prev_state") == "waiting for players":
                print("The Game did not Happen", flush=True)
                winner = None
            await self.handle_game_end(winner, "a player won, game_over")
            return

        except Exception as e:
            print(f"Error in wait_for_reconnection: {e}", flush=True)


    ''' 
    async def dispatch(self, message):
        print(f"Dispatching message: {message}", flush=True)
        await super().dispatch(message)
    '''
    #needs refactoring.

    async def handle_game_end(self, winner: str, msg: str):
        game_state_key = f"room:{self.room_name}:game_state"
        game_ended = f"{self.room_name}:game_ended"
        try:
            
            already_ended = await RedisManager.get_state(game_ended)
            if already_ended == "true":
                await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
                )
                return
            await RedisManager.set_expiry_key(game_ended, 3600)
            
            if self.debug_game_stats:
                print(f"Games Ending, winner: {winner} the reason: {msg}", flush=True)
            
            game_state = await RedisManager.get_json(game_state_key)

            player1 = await sync_to_async(lambda: self.match.player1)()
            player2 = await sync_to_async(lambda: self.match.player2)()
            if winner == None:
                await self.save_match(0, 0, None, None)
            elif winner == "player_1":
                await self.save_match(game_state["score"][0], game_state["score"][1], player1, player2)
            elif winner == "player_2":
                await self.save_match(game_state["score"][0], game_state["score"][1], player2, player1)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "terminate_game", 
                    "reason": msg,
                    "winner": winner
                }
            )
           
            await RedisManager.delete_room_data(self.room_name)
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception as e:
            print(f"Error handling game end: {e}", flush=True)
     

    async def game_loop(self):
        input_queue_key = f"room:{self.room_name}:inputs"
        game_state_key = f"room:{self.room_name}:game_state"
        game_ended = f"{self.room_name}:game_ended"
        input_buffers = {"player_1": [], "player_2": []}
        buffer_size = 2
        winner = "none"

        try:
            if self.debug_game_stats:
                print("The game has begun")
            while True:
                loop_start = time.perf_counter()
                
                already_ended = await RedisManager.get_state(game_ended)
                if already_ended == "true":
                    if self.debug_game_stats:
                        print(f"🚪 Game already ended externally, stopping game loop for {self.room_name}", flush=True)
                    await RedisManager.delete_keys(game_ended)
                    if self.game_state["score"][0] >= self.game_parametres["point_goal"]:
                        self.game_state["score"][0] = self.game_parametres["point_goal"]
                        winner = "player_1"
                        break
                    elif self.game_state["score"][1] >= self.game_parametres["point_goal"]:
                        self.game_state["score"][1] = self.game_parametres["point_goal"]
                        winner = "player_2"
                        break
                    self.handle_game_end(winner, "a player won, game_over")
                    return
                
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
                for _ in range(self.sub_tick_amount):
                    self.update_ball_position(self.game_state["ball_position"], self.game_state["ball_direction"], self.game_state["ball_speed"])
                    has_collided, normal, collision_point, paddle = self.detect_collisions()
                    if has_collided:
                        if self.debug_collision:                            
                            print(f"normal: {normal} , collision_point {collision_point} , paddle {paddle}", flush=True)
                        self.handle_collision(normal, collision_point, paddle)
                        if self.game_state["score"][0] >= self.game_parametres["point_goal"]:
                            winner = "player_1"
                            break
                        elif self.game_state["score"][1] >= self.game_parametres["point_goal"]:
                            winner = "player_2"
                            break
                self.game_state["last_update_time"] = time.time()
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "game_state": self.game_state,
                    }
                )

                await self.redis.execute("SET", game_state_key, json.dumps(self.game_state))
                if winner in ["player_1", "player_2"]:
                    if self.debug_game_stats:
                        print(f"callint handle game end from game loop {self.player_number}", flush=True)
                    await self.handle_game_end(winner, "a player won, game_over")

                loop_end = time.perf_counter()  # End time
                if self.debug_game_stats and self.debug_loop:
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
        self.time_per_tick
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
