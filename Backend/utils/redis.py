import aioredis
import json

class RedisManager:
    _redis_pool = None

    @classmethod
    async def get_redis(cls):
        if not cls._redis_pool:
            try:
                cls._redis_pool = await aioredis.create_redis_pool("redis://127.0.0.1:6379")
            except Exception as e:
                print(f"Error while initializing redis: {e}", flush=True)
        return cls._redis_pool
    
    @classmethod
    async def close_redis(cls):
        if cls._redis_pool:
            cls._redis_pool.close()
            await cls._redis_pool.wait_closed()
            print(f"Redis Closed", flush=True)
            cls._redis_pool = None

    @classmethod
    async def delete_keys(cls, pattern: str):
        redis = await cls.get_redis()

        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)

    @classmethod
    async def delete_user_data_list(cls,consumer_type: str ,room_name: str, key_id: str, value: str):
        redis = await cls.get_redis()
        key = f"{consumer_type}:{room_name}:{key_id}"

        removed_count = await redis.lrem(key, 1, value)

        if removed_count > 0:
            print(f"deleted {value} from {key}", flush=True)
        
        remaining = await redis.llen(key)
        if remaining == 0:
            await redis.delete(key)

    @classmethod
    async def append_to_list(cls, key: str, value: str):
        try:
            redis = await cls.get_redis()
            if redis is None:
                print("🚨 Redis connection is None!", flush=True)
                return -1  
            result = await redis.execute("RPUSH", key, value)

            return result  # Return the new length of the list

        except Exception as e:
            print(f"🚨 Error in Redis RPUSH: {e}", flush=True)
            return -1  

    @classmethod
    async def delete_room_data(cls, room_name: str):
        redis = await cls.get_redis()
        pattern = f"room:{room_name}:*"

        cursor = b'0'

        while cursor:
            cursor, keys = await redis.scan(cursor, match=pattern, count=100)
            if keys:
                await redis.delete(*keys)
            
            if cursor == b'0':
                break
        
        print(f"deleted room: {room_name}", flush=True)
    
    @classmethod
    async def delete_tournament_data(cls, room_name: str):
        redis = await cls.get_redis()
        pattern = f"tournament:{room_name}:*"

        cursor = b'0'

        while cursor:
            cursor, keys = await redis.scan(cursor, match=pattern, count=100)
            if keys:
                await redis.delete(*keys)
            
            if cursor == b'0':
                break
        
        print(f"deleted room: {room_name}", flush=True)
    
    @classmethod
    async def store_user_data_map(cls, tournament_key, user_id, user_data):
        redis = await cls.get_redis()
        user_data_json = json.dumps(user_data)
        await redis.hset(tournament_key, user_id, user_data_json)  # Store as a hash

    @classmethod
    async def get_json(cls, key):
        try:
            redis = await cls.get_redis()  
            json_data = await redis.execute("GET", key)

            if json_data is not None:
                return json.loads(json_data.decode("utf-8"))
            else:
                return {"error": "Data not found"}

        except Exception as e:
            print(f"Error retrieving JSON from Redis: {e}", flush=True)
            return {"message": "Error retrieving data"}
    
    @classmethod
    async def add_json(cls, key, new_data):
        try:
            redis = await cls.get_redis()

            json_data = await redis.execute("GET", key)

            if json_data is not None:
                existing_data = json.loads(json_data.decode("utf-8"))
            else:
                existing_data = {}  

            if isinstance(existing_data, dict) and isinstance(new_data, dict):
                existing_data.update(new_data)  
            else:
                print("error :Invalid data format. Expected a JSON object.", flush=True)

            await redis.execute("SET", key, json.dumps(existing_data))

            return print("message : Data added successfully")

        except Exception as e:
            print(f"Error adding JSON to Redis: {e}", flush=True)
    
    @classmethod
    async def remove_last_and_set_list(cls, key: str):
        redis = await cls.get_redis()

        users = await redis.lrange(key, 0, -1)

        if not users:
            print(f"No users found at key {key}. Nothing to remove.")
            return False

        decoded_users = [user.decode("utf-8") for user in users]

        decoded_users.pop()

        await redis.delete(key)

        if decoded_users:
            await redis.rpush(key, *decoded_users)

        return True

    @classmethod
    async def get_all_users_list_map(cls, key):
        redis = await cls.get_redis()
        users = await redis.hgetall(key, encoding="utf-8")
        return list(users.keys())  

    @classmethod
    async def get_list_of_list(cls, key):
        redis = await cls.get_redis()

        users = await redis.lrange(key, 0, -1)

        return [user.decode("utf-8") for user in users]

    @classmethod
    async def get_all_users_json(cls, key):
        redis = await cls.get_redis()
        users = await redis.hgetall(key, encoding="utf-8")  

        return {user_id: json.loads(user_data) for user_id, user_data in users.items()}
    
    @classmethod
    async def delete_user_data_map(cls, key: str, user_id: str):
        redis = await cls.get_redis()
        removed_count = await redis.hdel(key, user_id)  

        return removed_count > 0

    @classmethod
    async def update_user_data_map(cls, key: str, user_id: str, field: str, new_value):
        redis = await cls.get_redis()

        user_data_json = await redis.hget(key, user_id, encoding="utf-8")

        if user_data_json is None:
            return False  
        user_data = json.loads(user_data_json)

        user_data[field] = new_value

        await redis.hset(key, user_id, json.dumps(user_data))

        return True 
    
    @classmethod
    async def set_expiry_key(cls, key: str, time: int):
        redis = await cls.get_redis()
        await redis.set(key, "true")
        await redis.expire(key, time)

    @classmethod
    async def give_expiry_time(cls, key: str, seconds: int) -> bool:
        try:
            redis = await cls.get_redis()
            result = await redis.expire(key, seconds)
            if result == 1:
                return True
            else:
                return False
        except Exception as e:
            print(f"❌ Error setting expiry for key '{key}': {e}", flush=True)
            return False
    
    @classmethod
    async def set_expiry_json(cls, key: str, time: int, json_data):
        redis = await cls.get_redis()
        await cls.add_json(key, json_data)
        await redis.expire(key, time)

    @classmethod
    async def set_state(cls, key: str, state: str):
        redis = await cls.get_redis()
        await redis.set(key, state)

    @classmethod
    async def get_state(cls, key: str):
        redis = await cls.get_redis()
        value = await redis.get(key, encoding="utf-8")
        return value if value is not None else "unknown"