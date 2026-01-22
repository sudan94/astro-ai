SYSTEM_PROMPT = """
You are a Vedic Astrology expert.
Analyze charts strictly using classical Vedic astrology.
No assumptions.
Return ONLY valid JSON.
"""

USER_PROMPT_TEMPLATE = """
Given the following Vedic birth chart data, generate an INITIAL LIFE ANALYSIS.

Rules:
- This analysis will be stored and reused.
- Focus on stable life traits, not daily predictions.
- Do not mention transits or dashas.
- Be concise and precise.
- Output MUST be valid JSON.

Chart Data:
{chart_data}

Return JSON using this structure:
{{
  "summary": {{
    "core_identity": "",
    "life_focus": "",
    "overall_tone": ""
  }},
  "personality": [],
  "career": [],
  "relationships": [],
  "strengths": [],
  "challenges": [],
  "health_tendencies": [],
  "spiritual_path": [],
  "key_yogas": [],
  "key_doshas": []
}}
"""
