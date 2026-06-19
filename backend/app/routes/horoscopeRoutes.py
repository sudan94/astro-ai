import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/horoscope", tags=["horoscope"])

BASE_URL = "https://freehoroscopeapi.com/api/v1/get-horoscope"

VALID_SIGNS = {
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
}


def _fetch(url: str, params: dict) -> dict:
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Horoscope service timed out")
    except Exception:
        raise HTTPException(status_code=502, detail="Horoscope service unavailable")


@router.get("/western")
def get_western_horoscope(sign: str = Query(...)):
    sign = sign.lower()
    if sign not in VALID_SIGNS:
        raise HTTPException(status_code=400, detail="Invalid zodiac sign")
    return _fetch(f"{BASE_URL}/daily", {"sign": sign, "day": "today"})


@router.get("/vedic")
def get_vedic_horoscope(sign: str = Query(...)):
    sign = sign.lower()
    if sign not in VALID_SIGNS:
        raise HTTPException(status_code=400, detail="Invalid zodiac sign")
    return _fetch(f"{BASE_URL}/weekly", {"sign": sign})
