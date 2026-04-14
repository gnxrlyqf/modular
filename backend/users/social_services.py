from .models import Friendship
from .services import update_user_xp  # Import the XP service we already made

def send_friend_request(sender, receiver: int):
    """Creates a pending friendship request."""
    if sender == receiver:
        return None, "You cannot add yourself."
    rel, created = Friendship.objects.get_or_create(sender=sender, receiver=receiver)
    return rel, "Request sent" if created else "Request already exists"


def accept_friend_request(relationship_id, user_profile):
    """
    Accepts a request and awards XP to both parties.
    The receiver must be the person logged in (user_profile).
    """
    try:
        # We filter by receiver=user_profile so only the target can accept it
        rel = Friendship.objects.get(id=relationship_id, receiver=user_profile)
        
        if rel.status == 'pending':
            rel.status = 'accepted'
            rel.save()

            update_user_xp(rel.sender, amount=100)
            update_user_xp(rel.receiver, amount=100)
            
            return True, "Friendship accepted!"
        return False, "Request already processed."
        
    except Friendship.DoesNotExist:
        return False, "Relationship not found or unauthorized."