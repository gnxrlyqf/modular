import os
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import SocialAccount, Friendship

from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

import pyotp

logger = logging.getLogger('backend')

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

@transaction.atomic
def accept_friend_request(friendship_id, receiver_profile):
    """Business logic for accepting a request."""
    try:
        friendship = Friendship.objects.get(id=friendship_id, receiver=receiver_profile)
        
        if friendship.status == 'pending':
            friendship.status = 'accepted'
            friendship.save()

            update_user_xp(friendship.sender, 50)
            update_user_xp(friendship.receiver, 50)

            return True, "Friendship accepted! Both users earned 50 XP."
        return False, "This request is not pending."
        
    except Friendship.DoesNotExist:
        return False, "Friend request not found."

class OAuthService:
    @staticmethod
    def exchange_code_for_42_token(code):
        client_id = os.environ.get("FORTYTWO_CLIENT_ID")
        client_secret = os.environ.get("FORTYTWO_CLIENT_SECRET")
        redirect_uri = os.environ.get("FORTYTWO_REDIRECT_URI")
        if not (client_id and client_secret and redirect_uri):
            return None
        try:
            resp = requests.post("https://api.intra.42.fr/oauth/token", data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            }, timeout=10)
        except requests.RequestException:
            return None
        return resp.json().get("access_token") if resp.status_code == 200 else None

    @staticmethod
    def get_42_data(token):
        try:
            resp = requests.get(
                "https://api.intra.42.fr/v2/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
        except requests.RequestException:
            return None
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
        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
        except requests.RequestException:
            return None
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
        try:
            resp = requests.get(url, timeout=10)
        except requests.RequestException:
            return None
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
                password=None,
            )

        SocialAccount.objects.get_or_create(
            provider=provider, provider_id=data['id'],
            defaults={'user': user},
        )
        return user


def send_activation_email(user, request):
    from urllib.parse import urlparse

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    frontend_base = (
        os.environ.get('FRONTEND_URL')
        or request.META.get('HTTP_REFERER', '').rstrip('/')
        or 'http://localhost:5173'
    )
    if frontend_base.startswith('http'):
        parsed = urlparse(frontend_base)
        frontend_base = f"{parsed.scheme}://{parsed.netloc}"

    activation_url = f"{frontend_base}/api/users/activate/{uid}/{token}/"

    # Always print *just* the link (one line) so dev console stays clean.
    print(f"[activation] {user.username} <{user.email}>: {activation_url}", flush=True)

    backend = getattr(settings, 'EMAIL_BACKEND', '')
    is_smtp = 'smtp' in backend.lower()

    # In console mode, the link is already on stdout — skip send_mail to avoid the
    # full RFC822 dump that the console backend emits.
    if not is_smtp:
        return

    subject = "Activate your Transcendence Account"
    message = (
        f"Hello {user.username},\n\n"
        f"Please click the link below to verify your email:\n{activation_url}\n"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@transcendence.com'

    try:
        send_mail(subject, message, from_email, [user.email], fail_silently=False)
        logger.info("Activation email sent to %s", user.email)
    except Exception as e:
        # Never break registration on a mail-server hiccup — the link is on stdout.
        logger.error("send_mail failed for %s: %s — link printed above", user.email, e)


def generate_totp_secret():
    return pyotp.random_base32()

def get_totp_uri(user_email, secret):
    # This creates the URI that the QR code will represent
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email, 
        issuer_name="Trandandan"
    )

def verify_totp_code(secret, code):
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(code)