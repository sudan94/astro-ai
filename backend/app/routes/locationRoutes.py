from fastapi import Query, APIRouter
import json

with open("app/data/locations.json", encoding="utf-8") as f:
    cities = json.load(f)

router = APIRouter(prefix="/location", tags=["location"])

@router.get("/cities")
def search_cities(q: str = Query(..., min_length=1)):
    q = q.lower()

    results = [
        {
            "city": city["city"],
            "country": city["country"],
            "lat": float(city["lat"]),
            "lng": float(city["lng"])
        }
        for city in cities
        if city["city"].lower().startswith(q)
    ]

    return results[:10]
