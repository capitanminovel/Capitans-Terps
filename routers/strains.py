import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter(prefix="/api/strains", tags=["strains"])


class NewStrain(BaseModel):
    name:     str
    breeder:  str
    status:   str = "Vault"
    notes:    str = ""
    lineage:  str = ""
    type:     str = "Hybrid"
    best_for: str = ""


class StrainUpdate(BaseModel):
    status:   str
    notes:    str | None = None
    type:     str | None = None
    best_for: str | None = None


@router.get("")
def list_strains():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM strains ORDER BY added DESC").fetchall()
    return {"strains": [dict(r) for r in rows]}


@router.post("")
def add_strain(strain: NewStrain):
    slug     = strain.name.lower().replace(" ", "-")[:24]
    new_id   = f"{slug}-{str(uuid.uuid4())[:4]}"
    added    = datetime.now().strftime("%Y-%m-%d")
    with get_db() as conn:
        conn.execute(
            "INSERT INTO strains (id, name, breeder, status, notes, lineage, type, best_for, added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (new_id, strain.name, strain.breeder, strain.status, strain.notes, strain.lineage, strain.type, strain.best_for, added),
        )
    return {"id": new_id, "name": strain.name, "breeder": strain.breeder,
            "status": strain.status, "notes": strain.notes, "lineage": strain.lineage,
            "type": strain.type, "best_for": strain.best_for, "added": added}


@router.patch("/{strain_id}")
def update_strain(strain_id: str, update: StrainUpdate):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM strains WHERE id = ?", (strain_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Strain not found")
        notes    = update.notes    if update.notes    is not None else row["notes"]
        type_    = update.type     if update.type     is not None else row["type"]
        best_for = update.best_for if update.best_for is not None else row["best_for"]
        conn.execute(
            "UPDATE strains SET status = ?, notes = ?, type = ?, best_for = ? WHERE id = ?",
            (update.status, notes, type_, best_for, strain_id),
        )
        updated = conn.execute("SELECT * FROM strains WHERE id = ?", (strain_id,)).fetchone()
    return dict(updated)


@router.delete("/{strain_id}")
def delete_strain(strain_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT id FROM strains WHERE id = ?", (strain_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Strain not found")
        conn.execute("DELETE FROM strains WHERE id = ?", (strain_id,))
    return {"deleted": strain_id}
