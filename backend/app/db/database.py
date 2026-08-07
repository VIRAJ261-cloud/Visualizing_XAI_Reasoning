from app.core.config import settings

_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    try:
        from supabase import create_client, Client
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if url and key and "placeholder" not in key:
            _supabase_client = create_client(url, key)
            return _supabase_client
    except Exception as e:
        print(f"Supabase client connection warning: {e}")
    return None
