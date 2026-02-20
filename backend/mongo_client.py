"""
backend/mongo_client.py
MongoDB client for CycleAura — replaces firebase_client.py
Uses pymongo to store all sensor data, journal entries, and user profiles

HOW TO INSTALL:
    pip install pymongo

HOW TO RUN MONGODB:
    Option 1 - Local (free):
        Download from mongodb.com/try/download/community
        Run: mongod --dbpath /data/db
        Connection: mongodb://localhost:27017

    Option 2 - MongoDB Atlas (free cloud, recommended):
        1. Go to cloud.mongodb.com
        2. Create free cluster
        3. Click Connect → Drivers → Copy connection string
        4. Replace MONGO_URI below with your string
        Example: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/
"""

from pymongo import MongoClient, DESCENDING
from datetime import datetime
from bson import ObjectId
import os

# ── Connection URI ────────────────────────────────────────────────
# Local MongoDB:
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# MongoDB Atlas (cloud) — replace with your connection string:
# MONGO_URI = "mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/"

DATABASE_NAME = "cycleaura"


class MongoDBClient:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db     = self.client[DATABASE_NAME]

        # ── Collections (like Firestore subcollections) ────────────
        self.bbt_col     = self.db["bbt_readings"]
        self.hr_col      = self.db["hr_readings"]
        self.journal_col = self.db["journal"]
        self.users_col   = self.db["users"]

        # ── Indexes for fast queries ───────────────────────────────
        self.bbt_col.create_index([("user_id", 1), ("timestamp", DESCENDING)])
        self.hr_col.create_index([("user_id", 1),  ("timestamp", DESCENDING)])
        self.journal_col.create_index([("user_id", 1), ("timestamp", DESCENDING)])
        self.users_col.create_index("user_id", unique=True)

        print(f"[MongoDB] Connected to {MONGO_URI} → database: {DATABASE_NAME}")

    # ── BBT ───────────────────────────────────────────────────────
    def save_bbt(self, user_id: str, reading: dict):
        reading["user_id"]   = user_id
        reading["timestamp"] = reading.get("timestamp", datetime.utcnow().isoformat())
        self.bbt_col.insert_one(reading)

    def get_latest_bbt(self, user_id: str) -> dict | None:
        doc = self.bbt_col.find_one(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        )
        return self._clean(doc)

    def get_bbt_history(self, user_id: str, limit: int = 30) -> list:
        docs = self.bbt_col.find(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        ).limit(limit)
        return [self._clean(d) for d in docs]

    # ── Heart Rate ────────────────────────────────────────────────
    def save_heartrate(self, user_id: str, reading: dict):
        reading["user_id"]   = user_id
        reading["timestamp"] = reading.get("timestamp", datetime.utcnow().isoformat())
        self.hr_col.insert_one(reading)

    def get_latest_heartrate(self, user_id: str) -> dict | None:
        doc = self.hr_col.find_one(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        )
        return self._clean(doc)

    def get_hr_history(self, user_id: str, limit: int = 30) -> list:
        docs = self.hr_col.find(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        ).limit(limit)
        return [self._clean(d) for d in docs]

    # ── Journal ───────────────────────────────────────────────────
    def save_journal(self, user_id: str, entry: dict):
        entry["user_id"]   = user_id
        entry["timestamp"] = entry.get("timestamp", datetime.utcnow().isoformat())
        self.journal_col.insert_one(entry)

    def get_latest_journal(self, user_id: str) -> dict | None:
        doc = self.journal_col.find_one(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        )
        return self._clean(doc)

    def get_journal_entries(self, user_id: str, limit: int = 30) -> list:
        docs = self.journal_col.find(
            {"user_id": user_id},
            sort=[("timestamp", DESCENDING)]
        ).limit(limit)
        return [self._clean(d) for d in docs]

    # ── User Profile ──────────────────────────────────────────────
    def get_user_profile(self, user_id: str) -> dict | None:
        doc = self.users_col.find_one({"user_id": user_id})
        return self._clean(doc)

    def save_user_profile(self, user_id: str, profile: dict):
        profile["user_id"] = user_id
        self.users_col.update_one(
            {"user_id": user_id},
            {"$set": profile},
            upsert=True   # Create if doesn't exist
        )

    # ── Helper: remove MongoDB _id (not JSON serializable) ────────
    def _clean(self, doc: dict | None) -> dict | None:
        if doc is None:
            return None
        doc.pop("_id", None)
        return doc

    # ── Health check ──────────────────────────────────────────────
    def ping(self) -> bool:
        try:
            self.client.admin.command("ping")
            return True
        except Exception:
            return False
