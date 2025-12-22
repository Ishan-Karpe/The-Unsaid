# ===========================================
# THE UNSAID - Auth Middleware
# ===========================================
import os
from fastapi import HTTPException, Header
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)


async def get_current_user(authorization: str = Header(...)) -> str:
    """
    Verify JWT token and return user ID
    Token format: "Bearer <jwt_token>"
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        # Verify the JWT with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def verify_ai_consent(authorization: str = Header(...)) -> bool:
    """
    Verify that user has consented to AI processing
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # Get user ID first
    user_id = await get_current_user(authorization)

    try:
        # Check preferences table for AI consent
        result = supabase.table("preferences").select("ai_enabled").eq("user_id", user_id).single().execute()

        if not result.data or not result.data.get("ai_enabled"):
            raise HTTPException(
                status_code=403,
                detail="AI features require consent. Please enable AI in settings."
            )
        return True
    except HTTPException:
        raise
    except Exception:
        # If no preferences exist, AI is not enabled
        raise HTTPException(
            status_code=403,
            detail="AI features require consent. Please enable AI in settings."
        )
