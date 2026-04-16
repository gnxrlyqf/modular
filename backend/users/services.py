import requests
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import SocialAccount
User = get_user_model()

def calculate_level_from_xp(xp):
    """
    Returns the level based on total XP.
    Example: Level 1 starts at 0, Level 2 at 100, Level 3 at 400, etc.
    Formula: Level = (sqrt(XP) / 10) + 1
    """
    if xp <= 0:
        return 1
    return int((xp ** 0.5) / 10) + 1

def update_user_xp(profile, amount):
    """
    Adds XP and checks for a level up.
    """
    profile.xp += amount
    new_level = calculate_level_from_xp(profile.xp)
    
    leveled_up = new_level > profile.level
    profile.level = new_level
    profile.save()
    
    return leveled_up


class OAuthService:
    @staticmethod
    def exchange_code_for_42_token(code):
        resp = requests.post("https://api.intra.42.fr/oauth/token", data={
            "grant_type": "authorization_code",
            "client_id": "YOUR_UID",
            "client_secret": "YOUR_SECRET",
            "code": code,
            "redirect_uri": "YOUR_REDIRECT_URI"
        })
        return resp.json().get("access_token") if resp.status_code == 200 else None

    @staticmethod
    def get_42_data(token):
        resp = requests.get("https://api.intra.42.fr/v2/me", 
                            headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "id": str(data.get("id")),
            "email": data.get("email"),
            "username": data.get("login"),
            "avatar": data.get("image", {}).get("link")
        }

    @staticmethod
    def get_google_data(token):
        resp = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", 
                            headers={"Authorization": f"Bearer {token}"})
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "id": data.get("sub"), # Google's unique user ID
            "email": data.get("email"),
            "username": data.get("email").split('@')[0],
            "avatar": data.get("picture")
        }

    @staticmethod
    def get_facebook_data(token):
        # We request specific fields from the Graph API
        url = f"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={token}"
        resp = requests.get(url)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "id": data.get("id"),
            "email": data.get("email"),
            "username": data.get("name").replace(" ", "").lower(),
            "avatar": data.get("picture", {}).get("data", {}).get("url")
        }
    @staticmethod
    @transaction.atomic #ensure that the database is ya2ima totally m9ada or keep it untouched in case of err
    def get_or_create_social_user(provider, data):
        social_acc = SocialAccount.objects.filter(provider=provider, provider_id=data['id']).first()
        if social_acc:
            return social_acc.user

        user = User.objects.filter(email=data['email']).first()

        if not user:
            base_username = data['username']
            unique_username = base_username
            
            # Check if username exists; if so, add a suffix
            # This prevents the integrity error while keeping the email unique
            counter = 1
            while User.objects.filter(username=unique_username).exists():
                unique_username = f"{base_username}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=unique_username,
                email=data['email'],
                password=None
        )