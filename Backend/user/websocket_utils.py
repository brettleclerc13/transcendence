from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_user_update(user_id, update_type, data):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'contacts_{user_id}',
        {
            "type": "notify_update",
            "update_type": update_type,
            "data": data
        }
    )
    
def notify_block_status(user, action):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user.id}",
        {
            "type": "block_status",
            "action": action,
            "user_id": user.id,
        },
    )