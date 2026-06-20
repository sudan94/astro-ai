"""
Ashtakoota (Guna Milan) compatibility engine.

Calculates all 8 Kutas plus Mangal Dosha for two persons
based on their Moon nakshatra and Moon rashi (derived from
the stored or freshly-generated Vedic chart).
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.Person import Person
from app.models.Astro import Astro
from app.utilities.astro_calc import calculate_vedic_chart, SIGNS

# ─────────────────────────────────────────────────────────────
# Reference tables  (all 1-indexed except where noted)
# ─────────────────────────────────────────────────────────────

# Moon rashi (1=Aries … 12=Pisces) → Varna
RASHI_VARNA = {
    1: "Kshatriya", 2: "Vaishya",   3: "Shudra",    4: "Brahmin",
    5: "Kshatriya", 6: "Vaishya",   7: "Shudra",    8: "Brahmin",
    9: "Kshatriya", 10: "Vaishya",  11: "Shudra",   12: "Brahmin",
}
VARNA_RANK = {"Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1}

# Moon rashi → Vasya group
RASHI_VASYA = {
    1: "Vanchar", 2: "Vanchar", 3: "Manav",   4: "Jalchar",
    5: "Vanchar", 6: "Manav",   7: "Manav",   8: "Keeta",
    9: "Vanchar", 10: "Manav",  11: "Manav",  12: "Jalchar",
}

# Vasya compatibility  boy→girl : points
# Manav controls Jalchar (2), same group (2), Manav-Vanchar (1), else 0
def vasya_score(boy_rashi: int, girl_rashi: int) -> float:
    bv = RASHI_VASYA[boy_rashi]
    gv = RASHI_VASYA[girl_rashi]
    if bv == gv:
        return 2
    if bv == "Manav" and gv == "Jalchar":
        return 2
    if bv == "Manav" and gv == "Vanchar":
        return 1
    if bv == "Jalchar" and gv == "Manav":
        return 1
    return 0

# Moon rashi → ruling planet
RASHI_LORD = {
    1: "Mars",    2: "Venus",   3: "Mercury", 4: "Moon",
    5: "Sun",     6: "Mercury", 7: "Venus",   8: "Mars",
    9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
}

# Planetary natural friendship  (F=Friend, N=Neutral, E=Enemy)
PLANET_FRIEND = {
    "Sun":     {"Sun":"F","Moon":"F","Mars":"F","Mercury":"N","Jupiter":"F","Venus":"E","Saturn":"E"},
    "Moon":    {"Sun":"F","Moon":"F","Mars":"N","Mercury":"F","Jupiter":"N","Venus":"N","Saturn":"N"},
    "Mars":    {"Sun":"F","Moon":"F","Mars":"F","Mercury":"E","Jupiter":"F","Venus":"N","Saturn":"N"},
    "Mercury": {"Sun":"F","Moon":"E","Mars":"N","Mercury":"F","Jupiter":"N","Venus":"F","Saturn":"N"},
    "Jupiter": {"Sun":"F","Moon":"F","Mars":"F","Mercury":"E","Jupiter":"F","Venus":"E","Saturn":"N"},
    "Venus":   {"Sun":"E","Moon":"E","Mars":"N","Mercury":"F","Jupiter":"N","Venus":"F","Saturn":"F"},
    "Saturn":  {"Sun":"E","Moon":"E","Mars":"E","Mercury":"F","Jupiter":"N","Venus":"F","Saturn":"F"},
}

def maitri_score(boy_rashi: int, girl_rashi: int) -> float:
    bl = RASHI_LORD[boy_rashi]
    gl = RASHI_LORD[girl_rashi]
    b_view = PLANET_FRIEND[bl][gl]   # how boy's lord sees girl's lord
    g_view = PLANET_FRIEND[gl][bl]   # how girl's lord sees boy's lord
    combo = frozenset([b_view, g_view])
    if combo == frozenset(["F"]):           return 5  # F-F
    if combo == frozenset(["F", "N"]):      return 4  # F-N
    if combo == frozenset(["N"]):           return 3  # N-N
    if combo == frozenset(["F", "E"]):      return 2  # F-E
    if combo == frozenset(["N", "E"]):      return 1  # N-E
    return 0                                          # E-E

# Nakshatra (1-27) → Gana  (0-indexed list, index = nakshatra - 1)
NAKSHATRA_GANA = [
    "Deva",     # 1  Ashwini
    "Manav",    # 2  Bharani
    "Rakshasa", # 3  Krittika
    "Manav",    # 4  Rohini
    "Deva",     # 5  Mrigashira
    "Manav",    # 6  Ardra
    "Deva",     # 7  Punarvasu
    "Deva",     # 8  Pushya
    "Rakshasa", # 9  Ashlesha
    "Rakshasa", # 10 Magha
    "Manav",    # 11 Purva Phalguni
    "Manav",    # 12 Uttara Phalguni
    "Deva",     # 13 Hasta
    "Rakshasa", # 14 Chitra
    "Deva",     # 15 Swati
    "Rakshasa", # 16 Vishakha
    "Deva",     # 17 Anuradha
    "Rakshasa", # 18 Jyeshtha
    "Rakshasa", # 19 Mula
    "Manav",    # 20 Purva Ashadha
    "Manav",    # 21 Uttara Ashadha
    "Deva",     # 22 Shravana
    "Rakshasa", # 23 Dhanishtha
    "Rakshasa", # 24 Shatabhisha
    "Manav",    # 25 Purva Bhadrapada
    "Manav",    # 26 Uttara Bhadrapada
    "Deva",     # 27 Revati
]

def gana_score(boy_nak: int, girl_nak: int) -> float:
    bg = NAKSHATRA_GANA[boy_nak - 1]
    gg = NAKSHATRA_GANA[girl_nak - 1]
    if bg == gg:
        return 6
    if bg == "Deva" and gg == "Manav":
        return 5
    if bg == "Manav" and gg == "Deva":
        return 1
    return 0  # any Rakshasa mismatch

# Nakshatra (1-27) → Nadi
NAKSHATRA_NADI = [
    "Adi",    "Madhya", "Antya",  "Antya",  "Madhya",  # 1-5
    "Adi",    "Adi",    "Madhya", "Antya",  "Antya",   # 6-10
    "Madhya", "Adi",    "Madhya", "Antya",  "Adi",     # 11-15
    "Madhya", "Antya",  "Adi",    "Antya",  "Madhya",  # 16-20
    "Adi",    "Antya",  "Madhya", "Adi",    "Adi",     # 21-25
    "Madhya", "Antya",                                  # 26-27
]

def nadi_score(boy_nak: int, girl_nak: int) -> float:
    bn = NAKSHATRA_NADI[boy_nak - 1]
    gn = NAKSHATRA_NADI[girl_nak - 1]
    return 0 if bn == gn else 8

# Nakshatra (1-27) → Yoni animal
NAKSHATRA_YONI = [
    "Ashwa",   # 1  Ashwini
    "Gaj",     # 2  Bharani
    "Mesha",   # 3  Krittika
    "Sarpa",   # 4  Rohini
    "Sarpa",   # 5  Mrigashira
    "Shwan",   # 6  Ardra
    "Marjara", # 7  Punarvasu
    "Mesha",   # 8  Pushya
    "Marjara", # 9  Ashlesha
    "Mushak",  # 10 Magha
    "Mushak",  # 11 Purva Phalguni
    "Gau",     # 12 Uttara Phalguni
    "Mahisha", # 13 Hasta
    "Vyaghra", # 14 Chitra
    "Mahisha", # 15 Swati
    "Vyaghra", # 16 Vishakha
    "Mriga",   # 17 Anuradha
    "Mriga",   # 18 Jyeshtha
    "Shwan",   # 19 Mula
    "Vanar",   # 20 Purva Ashadha
    "Nakula",  # 21 Uttara Ashadha
    "Vanar",   # 22 Shravana
    "Simha",   # 23 Dhanishtha
    "Ashwa",   # 24 Shatabhisha
    "Simha",   # 25 Purva Bhadrapada
    "Gau",     # 26 Uttara Bhadrapada
    "Gaj",     # 27 Revati
]

YONI_ENEMY_PAIRS = {
    frozenset(["Gau",     "Vyaghra"]),
    frozenset(["Gaj",     "Simha"]),
    frozenset(["Mesha",   "Shwan"]),
    frozenset(["Mriga",   "Shwan"]),
    frozenset(["Sarpa",   "Nakula"]),
    frozenset(["Marjara", "Mushak"]),
    frozenset(["Ashwa",   "Mahisha"]),
    frozenset(["Vanar",   "Nakula"]),
}

def yoni_score(boy_nak: int, girl_nak: int) -> float:
    by = NAKSHATRA_YONI[boy_nak - 1]
    gy = NAKSHATRA_YONI[girl_nak - 1]
    if by == gy:
        return 4
    if frozenset([by, gy]) in YONI_ENEMY_PAIRS:
        return 0
    return 3

# Tara (nakshatra-based destiny compatibility)
FAVORABLE_TARA = {0, 2, 4, 6, 8}  # remainders after % 9 (0 = 9 = Ati-mitra)

TARA_NAME = {
    1: "Janma", 2: "Sampat", 3: "Vipat", 4: "Kshema",
    5: "Pratyari", 6: "Sadhaka", 7: "Vadha", 8: "Mitra", 0: "Ati-mitra",
}

def _tara_remainder(from_nak: int, to_nak: int) -> int:
    count = (to_nak - from_nak) % 27
    return count % 9

def tara_score(boy_nak: int, girl_nak: int) -> float:
    boy_rem = _tara_remainder(boy_nak, girl_nak)
    girl_rem = _tara_remainder(girl_nak, boy_nak)
    boy_ok = boy_rem in FAVORABLE_TARA
    girl_ok = girl_rem in FAVORABLE_TARA
    if boy_ok and girl_ok:
        return 3
    if boy_ok or girl_ok:
        return 1.5
    return 0

def tara_names(boy_nak: int, girl_nak: int):
    return (
        TARA_NAME[_tara_remainder(boy_nak, girl_nak)],
        TARA_NAME[_tara_remainder(girl_nak, boy_nak)],
    )

# Bhakoot (rashi-based love & prosperity)
BHAKOOT_BAD_COUNTS = {(2, 12), (12, 2), (6, 8), (8, 6), (5, 9), (9, 5)}

def bhakoot_score(boy_rashi: int, girl_rashi: int) -> float:
    bg = ((girl_rashi - boy_rashi) % 12) or 12
    gb = ((boy_rashi - girl_rashi) % 12) or 12
    return 0 if (bg, gb) in BHAKOOT_BAD_COUNTS else 7

# Mangal Dosha  — Mars in houses 1,2,4,7,8,12 from Lagna
MANGAL_DOSHA_HOUSES = {1, 2, 4, 7, 8, 12}

def mangal_dosha(chart: dict) -> str:
    try:
        lagna = chart.get("ascendant_sign") or (chart.get("ascendant") or {}).get("sign")
        mars_sign = chart["planets"]["Mars"]["sign"]
        lagna_idx = SIGNS.index(lagna)
        mars_idx = SIGNS.index(mars_sign)
        house = ((mars_idx - lagna_idx) % 12) + 1
        return "High" if house in MANGAL_DOSHA_HOUSES else "None"
    except Exception:
        return "Unknown"

# ─────────────────────────────────────────────────────────────
# Chart helpers
# ─────────────────────────────────────────────────────────────

def _get_chart(db: Session, person: Person) -> dict:
    """Return stored chart JSON or calculate fresh."""
    astro = db.query(Astro).filter(Astro.person_id == person.id).first()
    if astro and astro.vedic_chart:
        return astro.vedic_chart
    return calculate_vedic_chart(
        date_of_birth=person.date_of_birth,
        latitude=person.latitude,
        longitude=person.longitude,
    )

def _moon_data(chart: dict) -> dict:
    moon = chart["planets"]["Moon"]
    sign_str = moon["sign"]
    rashi = SIGNS.index(sign_str) + 1  # 1-12
    nak = moon["nakshatra"]
    return {
        "rashi": rashi,
        "rashi_name": sign_str,
        "nakshatra": nak["name"],
        "nakshatra_number": nak["number"],  # 1-27
        "nakshatra_pada": nak["pada"],
    }

# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

async def calculate_match(db: Session, person1_id: int, person2_id: int, current_user) -> dict:
    p1 = db.query(Person).filter(Person.id == person1_id, Person.user_id == current_user.id).first()
    p2 = db.query(Person).filter(Person.id == person2_id, Person.user_id == current_user.id).first()

    if not p1:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person 1 not found")
    if not p2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person 2 not found")

    chart1 = _get_chart(db, p1)
    chart2 = _get_chart(db, p2)

    if "error" in chart1 or "error" in chart2:
        raise HTTPException(status_code=500, detail="Could not calculate chart (Swiss Ephemeris unavailable)")

    m1 = _moon_data(chart1)
    m2 = _moon_data(chart2)

    br = m1["rashi"]; gr = m2["rashi"]
    bn = m1["nakshatra_number"]; gn = m2["nakshatra_number"]

    varna   = min(1, max(0, VARNA_RANK.get(RASHI_VARNA[br], 0) - VARNA_RANK.get(RASHI_VARNA[gr], 0) + 1))
    vasya   = vasya_score(br, gr)
    tara    = tara_score(bn, gn)
    yoni    = yoni_score(bn, gn)
    maitri  = maitri_score(br, gr)
    gana    = gana_score(bn, gn)
    bhakoot = bhakoot_score(br, gr)
    nadi    = nadi_score(bn, gn)

    total = varna + vasya + tara + yoni + maitri + gana + bhakoot + nadi
    tara_b, tara_g = tara_names(bn, gn)

    md1 = mangal_dosha(chart1)
    md2 = mangal_dosha(chart2)

    if total >= 31:
        conclusion = "Excellent match. Very high compatibility across all factors."
    elif total >= 25:
        conclusion = "Good match. Compatible in most areas with some differences to navigate."
    elif total >= 18:
        conclusion = "Average match. Compatible but will require understanding and effort."
    else:
        conclusion = "Below average match. Significant differences in compatibility factors."

    mangal_note = ""
    if md1 != "None" and md2 == "None":
        mangal_note = f"{p1.name} has Mangal Dosha while {p2.name} does not — consult an astrologer."
    elif md2 != "None" and md1 == "None":
        mangal_note = f"{p2.name} has Mangal Dosha while {p1.name} does not — consult an astrologer."

    return {
        "person1": {
            "id": p1.id,
            "name": p1.name,
            "rashi": m1["rashi_name"],
            "nakshatra": m1["nakshatra"],
            "nakshatra_pada": m1["nakshatra_pada"],
            "varna": RASHI_VARNA[br],
            "vasya": RASHI_VASYA[br],
            "gana": NAKSHATRA_GANA[bn - 1],
            "nadi": NAKSHATRA_NADI[bn - 1],
            "yoni": NAKSHATRA_YONI[bn - 1],
            "mangal_dosha": md1,
        },
        "person2": {
            "id": p2.id,
            "name": p2.name,
            "rashi": m2["rashi_name"],
            "nakshatra": m2["nakshatra"],
            "nakshatra_pada": m2["nakshatra_pada"],
            "varna": RASHI_VARNA[gr],
            "vasya": RASHI_VASYA[gr],
            "gana": NAKSHATRA_GANA[gn - 1],
            "nadi": NAKSHATRA_NADI[gn - 1],
            "yoni": NAKSHATRA_YONI[gn - 1],
            "mangal_dosha": md2,
        },
        "scores": {
            "varna":   {"name": "Varna",   "area": "Spiritual / Work",  "max": 1,  "obtained": varna,
                        "detail": f"{RASHI_VARNA[br]} × {RASHI_VARNA[gr]}"},
            "vasya":   {"name": "Vasya",   "area": "Dominance",         "max": 2,  "obtained": vasya,
                        "detail": f"{RASHI_VASYA[br]} × {RASHI_VASYA[gr]}"},
            "tara":    {"name": "Tara",    "area": "Destiny",            "max": 3,  "obtained": tara,
                        "detail": f"{tara_b} × {tara_g}"},
            "yoni":    {"name": "Yoni",    "area": "Mentality",          "max": 4,  "obtained": yoni,
                        "detail": f"{NAKSHATRA_YONI[bn-1]} × {NAKSHATRA_YONI[gn-1]}"},
            "maitri":  {"name": "Maitri",  "area": "Compatibility",      "max": 5,  "obtained": maitri,
                        "detail": f"{RASHI_LORD[br]} × {RASHI_LORD[gr]}"},
            "gana":    {"name": "Gana",    "area": "Nature",             "max": 6,  "obtained": gana,
                        "detail": f"{NAKSHATRA_GANA[bn-1]} × {NAKSHATRA_GANA[gn-1]}"},
            "bhakoot": {"name": "Bhakoot", "area": "Love & Prosperity",  "max": 7,  "obtained": bhakoot,
                        "detail": f"{m1['rashi_name']} × {m2['rashi_name']}"},
            "nadi":    {"name": "Nadi",    "area": "Health & Progeny",   "max": 8,  "obtained": nadi,
                        "detail": f"{NAKSHATRA_NADI[bn-1]} × {NAKSHATRA_NADI[gn-1]}"},
        },
        "total": total,
        "max": 36,
        "percentage": round((total / 36) * 100, 1),
        "conclusion": conclusion,
        "mangal_note": mangal_note,
    }
