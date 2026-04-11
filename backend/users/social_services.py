from .models import Friendship
from .services import add_experience  # Import the XP service we already made

def send_friend_request(from_user, to_user_id: int):
    """
    Creates a pending friendship request.
    """
    return Friendship.objects.get_or_create(from_user=from_user, to_user_id=to_user_id)

def accept_friend_request(friendship_id: int):
    """
    Accepts a request and awards XP to both parties.
    """
    friendship = Friendship.objects.get(id=friendship_id)
    if friendship.status == 'pending':
        friendship.status = 'accepted'
        friendship.save()
        
        # Award XP to both users for making a connection
        add_experience(friendship.from_user.profile, amount=50)
        add_experience(friendship.to_user.profile, amount=50)
        
    return friendship