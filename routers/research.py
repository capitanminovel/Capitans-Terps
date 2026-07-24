from datetime import datetime
from fastapi import APIRouter, HTTPException
from anthropic import Anthropic
from db import get_db

router = APIRouter(prefix="/api/research", tags=["research"])
client = Anthropic()

PROMPT_TEMPLATE = """You are a cannabis genetics expert and master craft cultivator specializing in solventless extraction — ice water hash, rosin, and living resin. You have deep knowledge of seed breeders, plant genetics, terpene chemistry, and pressing technique.

Generate a detailed research profile for the cannabis strain "{name}" by {breeder}.{lineage_line}

Return ONLY valid JSON with exactly these six keys:

{{
  "genetics_lineage": "3-4 sentences: parent strains, full genetic lineage, breeder background and philosophy, phenotype notes, what makes this cultivar sought after",
  "terpene_profile": "3-4 sentences: dominant and secondary terpenes expected from this cultivar, their aromas and synergistic interactions, how the terpene expression develops through flower and into cure",
  "effects": "3-4 sentences: onset character, intensity level, balance of cerebral vs body, duration, mood profile, best use cases and time of day",
  "flavor_aroma": "3-4 sentences: detailed flavor notes on inhale and exhale, aroma at different grow stages (late flower, harvest, fresh cure, long cure), palate profile and mouthfeel",
  "grow_notes": "3-4 sentences: growth structure and stretch behavior, flowering time, yield potential, training method recommendations (topping, LST, ScrOG), environmental preferences (VPD, temp, humidity), and harvest window indicators",
  "rosin_extraction": "3-4 sentences: suitability for ice water hash and rosin pressing, expected solventless yield percentage, recommended press temperatures in °F, optimal wash water temps for IWHE, and what the final live rosin or hash rosin should look and smell like"
}}

Be technically precise and craft-focused. Include details a passionate home grower and solventless hash maker would value. Output only the JSON object, nothing else."""


@router.get("/{strain_id}")
def get_research(strain_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM research WHERE strain_id = ?", (strain_id,)).fetchone()
    if not row:
        return {}
    data = dict(row)
    data.pop("strain_id", None)
    return data


@router.post("/{strain_id}")
def generate_research(strain_id: str):
    with get_db() as conn:
        strain = conn.execute("SELECT * FROM strains WHERE id = ?", (strain_id,)).fetchone()
        if not strain:
            raise HTTPException(status_code=404, detail="Strain not found")
        existing = conn.execute("SELECT * FROM research WHERE strain_id = ?", (strain_id,)).fetchone()

    if existing:
        data = dict(existing)
        data.pop("strain_id", None)
        return data

    import json
    lineage      = strain["lineage"] if strain["lineage"] else None
    lineage_line = f"\nKnown lineage: {lineage}." if lineage else ""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(
            name=strain["name"], breeder=strain["breeder"], lineage_line=lineage_line
        )}],
    )

    content = response.content[0].text.strip()
    if content.startswith("```"):
        content = "\n".join(content.split("\n")[1:-1]).strip()

    result = json.loads(content)
    result["generated_at"] = datetime.now().isoformat()

    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO research "
            "(strain_id, genetics_lineage, terpene_profile, effects, "
            " flavor_aroma, grow_notes, rosin_extraction, generated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (strain_id, result.get("genetics_lineage"), result.get("terpene_profile"),
             result.get("effects"), result.get("flavor_aroma"), result.get("grow_notes"),
             result.get("rosin_extraction"), result.get("generated_at")),
        )

    return result
