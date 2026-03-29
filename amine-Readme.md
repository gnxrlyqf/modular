## What to do

amine:
    - urls/views/templates
    - backend urls too

What was done today:
    I built a JWT-based authentication system in Django REST Framework.
    - Users register via /api/users/ and passwords are securely hashed.
    - Login is handled by /api/token/ which returns access + refresh JWT tokens.
    - All protected routes use: Authorization: Bearer <access_token>.
    - /api/users/me/ returns the currently authenticated user.
    - /api/users/profile/me/ manages user profiles.
    - Auto-creates profile using get_or_create()
    - GET retrieves profile data
    - PATCH allows partial updates (display_name, bio, avatar)
    - Added account management endpoints:
    - change password
    - change username/email
    - logout (token handling)

What to do next
    Input validation + error handling standardization
    Email verification system (activate account flow)
    Password reset (forgot password flow)
    Permissions/roles (admin vs normal user)
    Rate limiting (stop API abuse)
    API documentation (Swagger/OpenAPI)
    Basic tests (pytest or DRF tests)