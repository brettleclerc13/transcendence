import asyncio
import json
import websockets
import requests
import ssl
from asgiref.sync import sync_to_async
import urllib3


ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Base URL for the backend API 
#add back 8080 IN SCHOOL
BASE_URL_DATA = "wss://127.0.0.1:8080/game"
MATCH_API_URL = "https://127.0.0.1:8080/api/match-list/"

def get_active_matches():
    try:
        params = {
            "is_ongoing": "True",
            "is_finished": "False"
        }
        response = requests.get(MATCH_API_URL, params=params, verify=False)  

        if response.status_code == 200:
            matches = response.json()
            return matches
        else:
            print(f"❌ Failed to fetch matches. Status Code: {response.status_code}")
            return None

    except requests.RequestException as e:
        print(f"❌ Network error: {e}")
        return None

def list_games():
    active_matches = get_active_matches()
    if active_matches:
        print("🎮 Active Matches:")
        for match in active_matches:
            print(f"Match: |   {match.get('id', 'Unknown ID')}   |, "
              f"Player 1: {match.get('player1_username', 'Unknown')}, "
              f"Player 2: {match.get('player2_username', 'Waiting...')}")
    else:
        print("⚠️ No active matches found.")
    
def is_valid_roomname(room_name: str):
    active_games = get_active_matches()
    if active_games:
        for match in active_games:
            if match['id'] == room_name:
                return True
        return False
    else:
        return False
    
async def get_game_state():
    room_name = input("Enter room name: ")
    is_valid = await sync_to_async(lambda: is_valid_roomname(room_name))()
    if not is_valid:
        print("⚠️ No active games with that room-name")
        return
    try:
        async with websockets.connect(f"{BASE_URL_DATA}/{room_name}/", ssl=ssl_context, origin="https://127.0.0.1") as websocket:
            response = await websocket.recv()
            game_data = json.loads(response)

            # Check if the response contains an error message
            if "error" in game_data['game_state']:
                print(f"❌ Error: {game_data['game_state']['error']}, the game has not started yet!")
                return

            print(f"\n📊 Game State for {room_name}:")
            print(f" - Score: {game_data['game_state']['score']}")
            print(f" - ball speed: {game_data['game_state']['ball_speed']}")
            print(f" - Ball Position: {game_data['game_state']['ball_position']}")
            print(f" - ball direction: {game_data['game_state']['ball_direction']}")
            print(f" - Player 1 Position: {game_data['game_state']['player1_position']}")
            print(f" - Player 2 Position: {game_data['game_state']['player2_position']}")

    except websockets.exceptions.WebSocketException as e:
        print(f"❌ Connection failed! Room '{room_name}' does not exist or is closed. | {e}")
    except OSError as e:
        print(f"❌ Network error: {e}")
    except json.JSONDecodeError:
        print("❌ Received an invalid response from the server.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    

async def get_connections():
    room_name = input("Enter room name: ")
    try:
        async with websockets.connect(f"{BASE_URL_DATA}/{room_name}/", ssl=ssl_context, origin="https://127.0.0.1") as websocket:
            response = await websocket.recv()
            game_data = json.loads(response)

            # Check if the response contains an error message
            if "error" in game_data:
                print(f"❌ Error: {game_data['error']}, the game has not started yet!")
                return

            print(f"\n📊 Connected players in {room_name}:")
            print(f" - Connected players: {game_data['number_of_players']}")
            

    except websockets.exceptions.WebSocketException as e:
        print(f"❌ Connection failed! Room '{room_name}' does not exist or is closed.")
    except OSError as e:
        print(f"❌ Network error: {e}")
    except json.JSONDecodeError:
        print("❌ Received an invalid response from the server.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

async def cli_menu():
    """Displays the CLI menu and handles user input."""
    print("\n🎮 Pong CLI Interaction 🎮")
    while True:
        print("\n1. List Active Games")
        print("2. Get Game State")
        print("3. View Connected Users")
        print("4. Exit CLI")

        choice = input("Enter choice: ")

        if choice == "1":
            list_games()
        elif choice == "2":
            await get_game_state()
        elif choice == "3":
            await get_connections()
        elif choice == "4":
            print("Exiting CLI...")
            break
        else:
            print("❌ Invalid choice. Try again.")

if __name__ == "__main__":
    asyncio.run(cli_menu())
