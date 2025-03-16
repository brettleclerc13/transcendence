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

def notify_block_status(user, status):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"contacts_{user.id}",
        {
            "type": "notify_update",
            "update_type": f"user_{status}",
            "data": {
                "user_id": user.id,
                "username": user.username,
                "profile_picture": user.profile.profile_picture.url if user.profile.profile_picture else None,
            },
        },
    )
