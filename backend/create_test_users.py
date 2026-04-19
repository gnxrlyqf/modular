import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def run():
    users_to_create = [
        {"username": "test1", "email": "test1@school.com"},
        {"username": "test2", "email": "test2@school.com"},
        {"username": "test3", "email": "test3@school.com"},
        {"username": "test3", "email": "test3@school.com"},
        {"username": "test4", "email": "test4@school.com"},
    ]

    for data in users_to_create:
        if not User.objects.filter(username=data['username']).exists():
            # Creating with a common password for easy testing
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password="password123"
            )
            print(f"✅ Created {data['username']}")
        else:
            print(f"🟡 {data['username']} already exists.")

if __name__ == "__main__":
    run()