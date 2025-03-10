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
    async def delete_user_data(cls,consumer_type: str ,room_name: str, key_id: str, value: str):
        redis = await cls.get_redis()
        key = f"{consumer_type}:{room_name}:{key_id}"

        removed_count = await redis.lrem(key, 1, value)

        if removed_count > 0:
            print(f"deleted {value} from {key}", flush=True)
        
        remaining = await redis.llen(key)
        if remaining == 0:
            await redis.delete(key)

    @classmethod
    async def delete_room_data(cls, room_name: str):
        redis = await cls.get_redis()
        pattern = f"room:{room_name}:*"

        cursor = b'0'

        while cursor:
            cursor, keys = await redis.scan(cursor, match=pattern, count=100)
            if keys:
                await redis.delete(*keys)
        
        print(f"deleted room: {room_name}", flush=True)
    
    @classmethod
    async def store_user_data(cls, tournament_key, user_id, user_data):
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
    async def set_tournament_state(cls, room_id, state):
        redis = await cls.get_redis()
        state_key = f"tournament:{room_id}:state"

        current_state = await redis.get(state_key, encoding="utf-8")
        if current_state != state:
            await redis.set(state_key, state)  # ✅ Set new state only if different

    @classmethod
    async def get_tournament_state(cls, room_id):
        redis = await cls.get_redis()
        state_key = f"tournament:{room_id}:state"
        return await redis.get(state_key, encoding="utf-8")
    
    @classmethod
    async def get_all_users(cls, key):
        redis = await cls.get_redis()
        users = await redis.hgetall(key, encoding="utf-8")
        return list(users.keys())  # ✅ Return list of player IDs
