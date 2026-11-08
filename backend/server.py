from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import sys
import os
import logging
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from database import close_db_connection

# Import all routers
from routes import (
    auth_router,
    pages_router,
    services_router,
    projects_router,
    contacts_router,
    settings_router,
    admins_router,
    storage_router,
    skills_router,
    content_router,
    notes_router,
    about_router,
    chat_router,
    blogs_router,
    newsletter_router,
    analytics_router
)
from routes.contact_page import router as contact_page_router
from routes.testimonials import router as testimonials_router
from routes.pricing import router as pricing_router

# Client Portal Routers
from routes.client_auth import router as client_auth_router
from routes.admin_clients import router as admin_clients_router
from routes.admin_client_projects import router as admin_client_projects_router
from routes.client_projects import router as client_projects_router

# Booking Routers
from routes.bookings import router as bookings_router
from routes.booking_settings import router as booking_settings_router

from config import validate_config, get_allowed_origins, PORT, TRUST_PROXY, INIT_SUPERADMIN_PASSWORD, INIT_SUPERADMIN_USERNAME, IS_PRODUCTION

ROOT_DIR = Path(__file__).parent

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="METECHQ API",
    description="Backend API for METECHQ website and admin panel",
    version="1.0.0",
    root_path="/api" if TRUST_PROXY else ""
)

# -------------------------------------------------------------------
# Proxy Header Middleware (Active only when TRUST_PROXY is enabled)
# -------------------------------------------------------------------
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class ProxyHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if TRUST_PROXY:
            forwarded_proto = request.headers.get("X-Forwarded-Proto")
            if forwarded_proto and forwarded_proto.lower() in ("http", "https"):
                request.scope["scheme"] = forwarded_proto.lower()

        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ProxyHeaderMiddleware)

ALLOWED_ORIGINS = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Routers
# -------------------------------------------------------------------
api_router = APIRouter(prefix="/api")

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "METECHQ API"}

@api_router.get("/")
async def root():
    return {"message": "METECHQ API is running"}

api_router.include_router(auth_router)
api_router.include_router(pages_router)
api_router.include_router(services_router)
api_router.include_router(projects_router)
api_router.include_router(contacts_router)
api_router.include_router(settings_router)
api_router.include_router(admins_router)
api_router.include_router(storage_router)
api_router.include_router(skills_router)
api_router.include_router(content_router)
api_router.include_router(notes_router)
api_router.include_router(about_router)
api_router.include_router(contact_page_router)
api_router.include_router(chat_router)
api_router.include_router(blogs_router)
api_router.include_router(testimonials_router, prefix="/testimonials")
api_router.include_router(newsletter_router)
api_router.include_router(pricing_router)
api_router.include_router(analytics_router)

api_router.include_router(client_auth_router)
api_router.include_router(admin_clients_router)
api_router.include_router(admin_client_projects_router)
api_router.include_router(client_projects_router)

api_router.include_router(bookings_router)
api_router.include_router(booking_settings_router)

app.include_router(api_router)

# -------------------------------------------------------------------
# Startup Initialization
# -------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    try:
        # Validate critical environment configuration
        validate_config()

        from auto_init import auto_initialize_database
        await auto_initialize_database()

        from database import admins_collection, init_db_indexes
        await init_db_indexes()
        from auth.password import hash_password
        import uuid
        from datetime import datetime
        import secrets

        logger.info("Checking for administrative bootstrap...")

        existing_admin = await admins_collection.find_one({"role": "super_admin"})

        if not existing_admin:
            bootstrap_user = INIT_SUPERADMIN_USERNAME or "admin"
            if INIT_SUPERADMIN_PASSWORD:
                bootstrap_password = INIT_SUPERADMIN_PASSWORD
            elif IS_PRODUCTION:
                raise ValueError("CRITICAL: INIT_SUPERADMIN_PASSWORD is required in production to bootstrap the initial super admin!")
            else:
                bootstrap_password = secrets.token_urlsafe(16)
                logger.warning("⚠️ No INIT_SUPERADMIN_PASSWORD set. Generated temporary secure admin password.")

            from models.admin import AdminPermissions
            full_permissions = {k: True for k in AdminPermissions.model_fields.keys()}

            admin_user = {
                "id": str(uuid.uuid4()),
                "username": bootstrap_user,
                "password_hash": hash_password(bootstrap_password),
                "role": "super_admin",
                "permissions": full_permissions,
                "created_at": datetime.utcnow().isoformat(),
                "created_by": "system"
            }

            await admins_collection.insert_one(admin_user)
            logger.info(f"✅ Initial super admin registered (username: {bootstrap_user}).")
        else:
            logger.info("✅ Super admin account confirmed.")

    except Exception as e:
        logger.error(f"Startup initialization failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db_connection()
