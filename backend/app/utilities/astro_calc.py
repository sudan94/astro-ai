from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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

PLANETS = {}
if SWISSEPH_AVAILABLE:
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
def to_utc(dt: datetime, timezone_name: Optional[str]) -> datetime:
    """
    Convert a birth datetime to UTC.

    Notes:
    - If `dt` already has tzinfo, it will be converted to UTC.
    - If `dt` is naive and `timezone_name` is provided, `dt` is treated as local time in that timezone.
    - If `dt` is naive and timezone is unknown, it is treated as UTC (best-effort fallback).
    """
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc)

    if timezone_name:
        try:
            dt = dt.replace(tzinfo=ZoneInfo(timezone_name))
            return dt.astimezone(timezone.utc)
        except ZoneInfoNotFoundError:
            # If tzdata isn't available on the host (common on Windows),
            # fall back to assuming the input was already UTC to avoid crashing.
            return dt.replace(tzinfo=timezone.utc)

    # Fallback: assume input is already UTC
    return dt.replace(tzinfo=timezone.utc)


def approximate_timezone_offset_hours(longitude: float) -> float:
    """
    Best-effort fallback when an IANA timezone is unavailable.

    Uses longitude to approximate the UTC offset in 15-minute steps:
      offset_hours ≈ round((longitude / 15) * 4) / 4
    """
    return round((longitude / 15.0) * 4.0) / 4.0


def to_utc_with_offset(dt: datetime, offset_hours: float) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc)
    tz = timezone(timedelta(hours=offset_hours))
    return dt.replace(tzinfo=tz).astimezone(timezone.utc)


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
def calculate_ascendant(jd_ut: float, latitude: float, longitude: float) -> Dict:
    """
    Calculate Sidereal Ascendant (Lagna) for Vedic astrology.

    IMPORTANT: Ascendant depends on BOTH time (UT) and location (lat/lon).
    Swiss Ephemeris computes it via house calculation, not `calc_ut`.
    """
    # Prefer sidereal house calculation if available
    try:
        flags = swe.FLG_SIDEREAL
        # House system doesn't matter for the Asc itself; 'P' is a safe default.
        _cusps, ascmc = swe.houses_ex(jd_ut, flags, latitude, longitude, b'P')
        asc = float(ascmc[0]) % 360.0
    except Exception:
        # Fallback if houses_ex isn't available or errors out:
        # compute tropical Asc then subtract ayanamsa to get sidereal.
        _cusps, ascmc = swe.houses(jd_ut, latitude, longitude, b'P')
        trop_asc = float(ascmc[0]) % 360.0
        ayan = float(swe.get_ayanamsa_ut(jd_ut)) % 360.0
        asc = (trop_asc - ayan) % 360.0

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

    # Convert local birth time to UTC.
    # If timezone isn't provided, try best-effort approximation from longitude.
    if timezone:
        dob_utc = to_utc(date_of_birth, timezone)
    else:
        offset = approximate_timezone_offset_hours(longitude)
        dob_utc = to_utc_with_offset(date_of_birth, offset)
    jd = julian_day(dob_utc)

    ascendant = calculate_ascendant(jd, latitude, longitude)
    houses = calculate_whole_sign_houses(ascendant["sign"])
    planets = calculate_planets(jd)

    return {
        "ascendant": ascendant,
        "ascendant_sign": ascendant["sign"],
        "houses": houses,
        "planets": planets,
        "calculated_at": datetime.utcnow().isoformat()
    }
