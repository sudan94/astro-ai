from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional


class AstroResponse(BaseModel):
    id: int
    person_id: int
    ascendent_sign: Optional[str]
    vedic_chart: Optional[Any]
    summary: Optional[str]
    ai_analysis: Optional[Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

