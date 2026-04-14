from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.config.database import engine, Base
from app.routes.personRoutes import router as person_router
from app.routes.locationRoutes import router as location_router
from app.routes.astroRoutes import router as astro_router
from app.routes.authRoutes import router as auth_router
from app.routes.chatRoutes import router as chat_router
from app.routes.userRoutes import router as user_router

load_dotenv()

# Create tables
# Base.metadata.create_all(bind=engine)

ENV = os.getenv("ENV", "development")
origins = [
    "https://vedic-astro-ai.vercel.app",  # <-- your frontend URL
    "http://localhost:5173",             # <-- local dev
]

app = FastAPI(
    title="Astrology API",
    description="API for Vedic astrology calculations and AI-powered chat",
    version="1.0.0",
    docs_url="/docs" if ENV == "development" else None,
    redoc_url="/redoc" if ENV == "development" else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(person_router)
app.include_router(location_router)
app.include_router(astro_router)
app.include_router(chat_router)
app.include_router(user_router)

@app.get("/")
def root():
    """Root endpoint."""
    if ENV == "development":
        return {
            "message": "Welcome to Astrology API",
            "version": "1.0.0",
            "docs": "/docs",
        }
    else:
        return {"message": "Astrology API is running."}

@app.get("/cleanup")
def cleanup():
    """Cleanup resources on shutdown."""
    Base.metadata.drop_all(bind=engine)
    pass

