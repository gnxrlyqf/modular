# users/services.py

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