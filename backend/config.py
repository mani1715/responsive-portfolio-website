import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger("metechq.config")

# Load .env file
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT in ["production", "prod"]
IS_TESTING = ENVIRONMENT in ["test", "testing"]

# Insecure placeholder keys that must NEVER be used in production
INSECURE_SECRETS = {
    "your-secret-key-change-in-production",
    "your-secret-key",
    "secret",
    "change-me",
    "changeme",
    "admin123",
    "maneesh123",
    "123456",
    "replace-with-a-cryptographically-secure-random-key-at-least-32-chars",
}

# --- Database URI Resolution (Accepts MONGODB_URI or MONGO_URL) ---
MONGODB_URI = (os.getenv("MONGODB_URI") or os.getenv("MONGO_URL") or "").strip()
DB_NAME = os.getenv("DB_NAME", "metechq").strip()

# --- Admin JWT Secret Resolution (Accepts JWT_SECRET_KEY, JWT_SECRET, or SECRET_KEY) ---
JWT_SECRET_KEY = (
    os.getenv("JWT_SECRET_KEY")
    or os.getenv("JWT_SECRET")
    or os.getenv("SECRET_KEY")
    or ""
).strip()

# --- Client JWT Secret Resolution (Accepts CLIENT_JWT_SECRET or CLIENT_JWT_SECRET_KEY) ---
CLIENT_JWT_SECRET = (
    os.getenv("CLIENT_JWT_SECRET")
    or os.getenv("CLIENT_JWT_SECRET_KEY")
    or ""
).strip()

# --- Network & Server Configuration ---
PORT = int(os.getenv("PORT", 8002))
HOST = os.getenv("HOST", "127.0.0.1")
TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() == "true"
CORS_ORIGINS_RAW = (os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS") or "").strip()

# --- Base Upload Directory ---
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(ROOT_DIR / "uploads"))).resolve()

# --- Super Admin Bootstrap Credentials ---
INIT_SUPERADMIN_USERNAME = os.getenv("INIT_SUPERADMIN_USERNAME", "admin").strip()
INIT_SUPERADMIN_PASSWORD = os.getenv("INIT_SUPERADMIN_PASSWORD", "").strip()

# --- Optional Distributed Redis Rate Limiter ---
REDIS_URL = os.getenv("REDIS_URL", "").strip()

def get_jwt_secret() -> str:
    """Returns the validated Admin JWT secret key with fallback protection"""
    if JWT_SECRET_KEY:
        return JWT_SECRET_KEY
    if IS_PRODUCTION:
        raise ValueError("CRITICAL: JWT_SECRET_KEY is missing in production environment!")
    # Development-only deterministic secret
    return "metechq-development-only-jwt-secret-key-minimum-32-chars-long"

def get_client_jwt_secret() -> str:
    """Returns the validated Client JWT secret key with fallback protection"""
    if CLIENT_JWT_SECRET:
        return CLIENT_JWT_SECRET
    # In development, fall back to admin secret with dedicated domain salt
    base = get_jwt_secret()
    return f"{base}-client-domain"

def get_allowed_origins() -> list:
    """Parses and returns allowed CORS origins"""
    default_dev_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
    ]
    origins = []
    if CORS_ORIGINS_RAW:
        for orig in CORS_ORIGINS_RAW.split(","):
            orig = orig.strip()
            if orig and orig not in origins:
                origins.append(orig)
    if not IS_PRODUCTION:
        for orig in default_dev_origins:
            if orig not in origins:
                origins.append(orig)
    return origins

def validate_config():
    """Validates configuration at startup"""
    errors = []
    if not MONGODB_URI and not IS_TESTING:
        errors.append("MONGODB_URI (or MONGO_URL) is required and cannot be empty.")
    
    if not JWT_SECRET_KEY:
        if IS_PRODUCTION:
            errors.append("JWT_SECRET_KEY is required in production and cannot be empty.")
        else:
            logger.warning("⚠️  JWT_SECRET_KEY is not set in development. Using development fallback key.")
    elif len(JWT_SECRET_KEY) < 32 and IS_PRODUCTION:
        errors.append("JWT_SECRET_KEY must be at least 32 characters long in production.")
    elif JWT_SECRET_KEY.lower() in INSECURE_SECRETS:
        if IS_PRODUCTION:
            errors.append("Insecure JWT_SECRET_KEY detected in production! Please generate a strong 256-bit secret.")
        else:
            logger.warning("⚠️  Insecure JWT_SECRET_KEY in development environment.")
    
    # Check client secret in production
    if IS_PRODUCTION:
        if not CLIENT_JWT_SECRET:
            errors.append("CLIENT_JWT_SECRET is required in production.")
        elif CLIENT_JWT_SECRET == JWT_SECRET_KEY:
            errors.append("Admin and client JWT secrets must be different.")
        if not CORS_ORIGINS_RAW or '*' in CORS_ORIGINS_RAW:
            errors.append("Production CORS must list explicit trusted origins.")
        elif any("localhost" in orig.lower() or "127.0.0.1" in orig for orig in CORS_ORIGINS_RAW.split(",")):
            errors.append("Production CORS must not include localhost or development origins.")
        if CLIENT_JWT_SECRET and len(CLIENT_JWT_SECRET) < 32:
            errors.append("CLIENT_JWT_SECRET must be at least 32 characters long in production.")
        if CLIENT_JWT_SECRET and CLIENT_JWT_SECRET.lower() in INSECURE_SECRETS:
            errors.append("Insecure CLIENT_JWT_SECRET detected in production!")
            
        # Check initial admin password if provided
        if INIT_SUPERADMIN_PASSWORD and INIT_SUPERADMIN_PASSWORD.lower() in INSECURE_SECRETS:
            errors.append("INIT_SUPERADMIN_PASSWORD cannot be set to a known insecure default like 'admin123'.")
    
    if errors:
        error_msg = " | ".join(errors)
        logger.error(f"❌ Configuration Validation Failed: {error_msg}")
        raise ValueError(f"Configuration Validation Failed: {error_msg}")
    
    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"✅ Configuration validated successfully (Env: {ENVIRONMENT})")
