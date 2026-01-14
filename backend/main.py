from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.routes.personRoutes import router as person_router
from app.routes.locationRoutes import router as location_router


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
app.include_router(person_router)
app.include_router(location_router)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Astrology API",
        "version": "1.0.0",
        "docs": "/docs"
    }
