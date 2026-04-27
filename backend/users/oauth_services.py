import requests
from django.contrib.auth import get_user_model
from .models import Profile
User = get_user_model()

class OAuthHandler:
    @staticmethod
    def get_42_user_data(access_token):
        url = "https://api.intra.42.fr/v2/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
        except requests.RequestException:
            return None
        return response.json() if response.status_code == 200 else None

    @staticmethod
    def get_or_create_user(email, username, avatar_url=None):
        user, created = User.objects.get_or_create(email=email, defaults={'username': username})
        
        if created:
            # Our signal handles Profile creation, but we can update details here
            profile = user.profile
            profile.avatar = avatar_url
            profile.save()
            
        return user


from .models import SocialAccount

def process_42_auth(code):
    # Trade the 'code' from frontend for an 'access_token'
    try:
        token_resp = requests.post("https://api.intra.42.fr/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": "YOUR_42_UID",
            "client_secret": "YOUR_42_SECRET",
            "code": code,
            "redirect_uri": "http://localhost:3000/auth/callback" # Must match Intra
        }, timeout=10)
    except requests.RequestException:
        return None
    token_data = token_resp.json()
    access_token = token_data.get("access_token")

    # Use token to get user info from 42
    try:
        user_resp = requests.get("https://api.intra.42.fr/v2/me", headers={
            "Authorization": f"Bearer {access_token}"
        }, timeout=10)
    except requests.RequestException:
        return None
    u_data = user_resp.json()

    # Handle YOUR Custom User
    # Look for a linked account first
    social_acc = SocialAccount.objects.filter(provider='42', unique_id=u_data['id']).first()
    
    if social_acc:
        return social_acc.user

    # If no link, check email. If no user, create one.
    user, created = User.objects.get_or_create(
        email=u_data['email'],
        defaults={'username': u_data['login']}
    )

    # Link them for next time
    SocialAccount.objects.get_or_create(user=user, provider='42', unique_id=u_data['id'])
    
    return user