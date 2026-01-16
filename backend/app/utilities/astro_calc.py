from datetime import datetime
from typing import Dict, Optional
from zoneinfo import ZoneInfo

try:
    import swisseph as swe
    SWISSEPH_AVAILABLE = True
except ImportError:
    SWISSEPH_AVAILABLE = False
    swe = None


SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra",
    "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
    "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

PLANETS = {
    swe.SUN: "Sun",
    swe.MOON: "Moon",
    swe.MERCURY: "Mercury",
    swe.VENUS: "Venus",
    swe.MARS: "Mars",
    swe.JUPITER: "Jupiter",
    swe.SATURN: "Saturn"
}

# time to UTC
def to_utc(dt: datetime, timezone: Optional[str]) -> datetime:
    if timezone:
        dt = dt.replace(tzinfo=ZoneInfo(timezone))
        return dt.astimezone(ZoneInfo("UTC"))
    return dt


def julian_day(dt: datetime) -> float:
    hour = dt.hour + dt.minute / 60 + dt.second / 3600
    return swe.julday(dt.year, dt.month, dt.day, hour, swe.GREG_CAL)


# Helper function to get planet sign
def sign_from_longitude(longitude: float) -> str:
    return SIGNS[int(longitude // 30) % 12]


def nakshatra_from_longitude(longitude: float) -> Dict:
    size = 360 / 27
    pada_size = size / 4

    index = int(longitude // size)
    pada = int((longitude % size) // pada_size) + 1

    return {
        "name": NAKSHATRAS[index],
        "number": index + 1,
        "pada": pada
    }

# Ascendant (Lagna) calculation
def calculate_ascendant(jd: float) -> Dict:
    asc = swe.calc_ut(jd, swe.ASC, swe.FLG_SIDEREAL)[0][0]

    return {
        "longitude": asc,
        "sign": sign_from_longitude(asc)
    }

# Whole Sign Houses (Pure Vedic)
def calculate_whole_sign_houses(asc_sign: str) -> Dict:
    start = SIGNS.index(asc_sign)

    houses = {}
    for i in range(12):
        houses[f"house_{i + 1}"] = {
            "sign": SIGNS[(start + i) % 12]
        }

    return houses

# Planets + Rahu / Ketu
def calculate_planets(jd: float) -> Dict:
    planets = {}
    flags = swe.FLG_SIDEREAL | swe.FLG_SPEED

    for pid, name in PLANETS.items():
        pos = swe.calc_ut(jd, pid, flags)[0]
        longitude = pos[0]

        planets[name] = {
            "longitude": longitude,
            "latitude": pos[1],
            "speed": pos[3],
            "sign": sign_from_longitude(longitude),
            "nakshatra": nakshatra_from_longitude(longitude)
        }

    # Rahu & Ketu
    rahu = swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SIDEREAL)[0][0]
    ketu = (rahu + 180) % 360

    planets["Rahu"] = {
        "longitude": rahu,
        "sign": sign_from_longitude(rahu),
        "nakshatra": nakshatra_from_longitude(rahu)
    }

    planets["Ketu"] = {
        "longitude": ketu,
        "sign": sign_from_longitude(ketu),
        "nakshatra": nakshatra_from_longitude(ketu)
    }

    return planets


def calculate_vedic_chart(
    date_of_birth: datetime,
    latitude: float,
    longitude: float,
    timezone: Optional[str] = None
) -> Dict:
    if not SWISSEPH_AVAILABLE:
        return {"error": "pyswisseph not installed"}

    swe.set_sid_mode(swe.SIDM_LAHIRI)

    dob_utc = to_utc(date_of_birth, timezone)
    jd = julian_day(dob_utc)

    ascendant = calculate_ascendant(jd)
    houses = calculate_whole_sign_houses(ascendant["sign"])
    planets = calculate_planets(jd)

    return {
        "ascendant": ascendant,
        "houses": houses,
        "planets": planets,
        "calculated_at": datetime.utcnow().isoformat()
    }
