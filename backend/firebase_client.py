"""
CycleAura — Firebase Firestore Client
=======================================
All read/write operations to Firestore.
Falls back to in-memory storage if Firebase is not available.
"""

import os
from datetime import datetime

# ── In-Memory Storage (fallback when Firebase is unavailable) ────────
_mock_db = {
    "bbt_readings": [],
    "hr_readings": [],
    "journal_entries": [],
    "predictions": [],
    "user_profiles": {},
}
_use_mock = False
db = None

# ── Init ─────────────────────────────────────────────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    _SA_PATH = os.path.join(os.path.dirname(__file__), "serviceAccount.json")
    
    if os.path.exists(_SA_PATH):
        if not firebase_admin._apps:
            cred = credentials.Certificate(_SA_PATH)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        # Test connection
        db.collection("_test").limit(1).get()
        print("[Firebase] Connected successfully")
    else:
        print("[Firebase] No serviceAccount.json found, using mock storage")
        _use_mock = True
except Exception as e:
    print(f"[Firebase] Connection failed: {e}")
    print("[Firebase] Using in-memory mock storage")
    _use_mock = True


# ── BBT ──────────────────────────────────────────────────────────────
def save_bbt(user_id: str, bbt: float) -> str:
    """Save a BBT reading. Returns document ID."""
    doc_id = f"bbt_{datetime.utcnow().timestamp()}"
    record = {
        "user_id":   user_id,
        "bbt":       bbt,
        "timestamp": datetime.utcnow(),
    }
    
    if _use_mock:
        _mock_db["bbt_readings"].insert(0, record)
        return doc_id
    
    doc_ref = db.collection("bbt_readings").document()
    doc_ref.set(record)
    return doc_ref.id


def get_bbt_history(user_id: str, limit: int = 30) -> list:
    """Return last `limit` BBT readings for a user (newest first)."""
    if _use_mock:
        user_readings = [r for r in _mock_db["bbt_readings"] if r["user_id"] == user_id]
        return [{"bbt": r["bbt"], "timestamp": str(r["timestamp"])} for r in user_readings[:limit]]
    
    from firebase_admin import firestore
    docs = (
        db.collection("bbt_readings")
        .where("user_id", "==", user_id)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"bbt": d.get("bbt"), "timestamp": str(d.get("timestamp"))}
            for d in docs]


def get_recent_bbt_values(user_id: str, n: int = 7) -> list:
    """Return last n BBT float values — used by ML model."""
    history = get_bbt_history(user_id, limit=n)
    return [r["bbt"] for r in history]


# ── Heart Rate ────────────────────────────────────────────────────────
def save_heart_rate(user_id: str, bpm: int, spo2: int,
                    motion_mag: float, mar_clean: bool) -> str:
    record = {
        "user_id":    user_id,
        "bpm":        bpm,
        "spo2":       spo2,
        "motion_mag": motion_mag,
        "mar_clean":  mar_clean,
        "timestamp":  datetime.utcnow(),
    }
    
    if _use_mock:
        _mock_db["hr_readings"].insert(0, record)
        return f"hr_{datetime.utcnow().timestamp()}"
    
    doc_ref = db.collection("hr_readings").document()
    doc_ref.set(record)
    return doc_ref.id


def get_hr_history(user_id: str, limit: int = 50) -> list:
    if _use_mock:
        user_readings = [r for r in _mock_db["hr_readings"] if r["user_id"] == user_id]
        return [{"bpm": r["bpm"], "spo2": r["spo2"], "timestamp": str(r["timestamp"])} 
                for r in user_readings[:limit]]
    
    from firebase_admin import firestore
    docs = (
        db.collection("hr_readings")
        .where("user_id", "==", user_id)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"bpm": d.get("bpm"), "spo2": d.get("spo2"),
             "timestamp": str(d.get("timestamp"))} for d in docs]


# ── Journal ───────────────────────────────────────────────────────────
def save_journal_entry(user_id: str, entry: dict) -> str:
    record = {
        "user_id":      user_id,
        "mood_score":   entry.get("mood_score", 7),
        "pain_level":   entry.get("pain_level", 3),
        "energy_level": entry.get("energy_level", 6),
        "flow_level":   entry.get("flow_level", "Moderate"),
        "pms_symptoms": entry.get("pms_symptoms", "No"),
        "notes":        entry.get("notes", ""),
        "timestamp":    datetime.utcnow(),
    }
    
    if _use_mock:
        _mock_db["journal_entries"].insert(0, record)
        return f"journal_{datetime.utcnow().timestamp()}"
    
    doc_ref = db.collection("journal_entries").document()
    doc_ref.set(record)
    return doc_ref.id


def get_journal_entries(user_id: str, limit: int = 30) -> list:
    if _use_mock:
        user_entries = [e for e in _mock_db["journal_entries"] if e["user_id"] == user_id]
        return user_entries[:limit]
    
    from firebase_admin import firestore
    docs = (
        db.collection("journal_entries")
        .where("user_id", "==", user_id)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [d.to_dict() for d in docs]


def get_latest_journal(user_id: str) -> dict:
    entries = get_journal_entries(user_id, limit=1)
    return entries[0] if entries else {}


# ── Predictions ───────────────────────────────────────────────────────
def save_prediction(user_id: str, prediction: dict) -> str:
    record = {
        "user_id":   user_id,
        "timestamp": datetime.utcnow(),
        **prediction,
    }
    
    if _use_mock:
        _mock_db["predictions"].insert(0, record)
        return f"pred_{datetime.utcnow().timestamp()}"
    
    doc_ref = db.collection("predictions").document()
    doc_ref.set(record)
    return doc_ref.id


def get_latest_prediction(user_id: str) -> dict:
    if _use_mock:
        user_preds = [p for p in _mock_db["predictions"] if p["user_id"] == user_id]
        return user_preds[0] if user_preds else {}
    
    from firebase_admin import firestore
    docs = (
        db.collection("predictions")
        .where("user_id", "==", user_id)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(1)
        .stream()
    )
    results = list(docs)
    return results[0].to_dict() if results else {}


# ── User Profile ──────────────────────────────────────────────────────
def save_user_profile(user_id: str, profile: dict) -> None:
    if _use_mock:
        if user_id in _mock_db["user_profiles"]:
            _mock_db["user_profiles"][user_id].update(profile)
        else:
            _mock_db["user_profiles"][user_id] = profile
        return
    
    db.collection("user_profiles").document(user_id).set(profile, merge=True)


def get_user_profile(user_id: str) -> dict:
    if _use_mock:
        return _mock_db["user_profiles"].get(user_id, {})
    
    doc = db.collection("user_profiles").document(user_id).get()
    return doc.to_dict() if doc.exists else {}
