from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.config.database import engine, Base
from app.routes.personRoutes import router as person_router
from app.routes.locationRoutes import router as location_router
from app.routes.astroRoutes import router as astro_router
from app.routes.authRoutes import router as auth_router

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Astrology API",
    description="API for Vedic astrology calculations and AI-powered chat",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(person_router)
app.include_router(location_router)
app.include_router(astro_router)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Astrology API",
        "version": "1.0.0",
        "docs": "/docs"
    }
