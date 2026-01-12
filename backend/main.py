from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.models.User import User
from app.routes.userRoutes import router as user_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Astrology API",
    description="API for Vedic astrology calculations and AI-powered chat",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Astrology API",
        "version": "1.0.0",
        "docs": "/docs"
    }
