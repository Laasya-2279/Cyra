"""
backend/mongo_client.py
CyRa MongoDB Client — now with In-Memory Mode
=============================================
Provides a unified interface for storing sensor data, journal entries, 
and user profiles. If MongoDB Atlas or Local Mongo is unreachable, 
automatically falls back to an IN-MEMORY store (Python list/dict).

Features:
- Primary: MongoDB Atlas (Cloud)
- Secondary: MongoDB Local (mongodb://localhost:27017)
- Final Fallback: IN-MEMORY (RAM) - lost on restart
"""

from pymongo import MongoClient, DESCENDING
from datetime import datetime
import os

# ── Connection URI ────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "cycleaura"

class MongoDBClient:
    def __init__(self):
        self._connected = False
        self.mode = 'memory' # Default until proven otherwise
        self.client = None
        self.db = None
        
        # In-memory collections (Fallbacks)
        self._mem_store = {
            "bbt_readings": [],
            "hr_readings":  [],
            "journal":      [],
            "users":        [],
        }

        # Try connection candidates
        uris = [MONGO_URI]
        if MONGO_URI != "mongodb://localhost:27017":
            uris.append("mongodb://localhost:27017")
            
        for uri in uris:
            try:
                print(f"[MongoDB] Attempting to connect: {uri[:60]}...")
                # Strict 3-second timeout for connection
                temp_client = MongoClient(
                    uri, 
                    serverSelectionTimeoutMS=3000,
                    connectTimeoutMS=3000,
                    socketTimeoutMS=3000
                )
                temp_client.admin.command("ping")
                
                # If ping works, we are in business
                self.mode = 'mongo'
                self.client = temp_client
                self.db = self.client[DATABASE_NAME]
                self._setup_mongo_collections()
                self._connected = True
                print(f"[MongoDB] Connected successfully via {uri[:20]}...")
                break
            except Exception:
                print(f"[MongoDB] Connection failed for {uri[:20]}...")

        if not self._connected:
            print("[MongoDB] ⚠️  ALL CONNECTION ATTEMPTS FAILED.")
            print("[MongoDB] 🚀 SERVER STARTING IN IN-MEMORY MODE.")
            print("[MongoDB] 💡 Note: Data will be lost when you stop the server.")

    def _setup_mongo_collections(self):
        self.bbt_col     = self.db["bbt_readings"]
        self.hr_col      = self.db["hr_readings"]
        self.journal_col = self.db["journal"]
        self.users_col   = self.db["users"]
        try:
            self.bbt_col.create_index([("user_id", 1), ("timestamp", DESCENDING)])
            self.hr_col.create_index([("user_id", 1),  ("timestamp", DESCENDING)])
            self.journal_col.create_index([("user_id", 1), ("timestamp", DESCENDING)])
            self.users_col.create_index("user_id", unique=True)
        except: pass

    # ── BBT ───────────────────────────────────────────────────────
    def save_bbt(self, user_id: str, reading: dict):
        reading["user_id"]   = user_id
        reading["timestamp"] = reading.get("timestamp", datetime.utcnow().isoformat())
        if self.mode == 'mongo':
            self.bbt_col.insert_one(reading)
        else:
            self._mem_store["bbt_readings"].append(reading)

    def get_latest_bbt(self, user_id: str) -> dict | None:
        if self.mode == 'mongo':
            doc = self.bbt_col.find_one({"user_id": user_id}, sort=[("timestamp", DESCENDING)])
            return self._clean(doc)
        else:
            user_data = [d for d in self._mem_store["bbt_readings"] if d["user_id"] == user_id]
            if not user_data: return None
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[0]

    def get_bbt_history(self, user_id: str, limit: int = 30) -> list:
        if self.mode == 'mongo':
            docs = self.bbt_col.find({"user_id": user_id}, sort=[("timestamp", DESCENDING)]).limit(limit)
            return [self._clean(d) for d in docs]
        else:
            user_data = [d for d in self._mem_store["bbt_readings"] if d["user_id"] == user_id]
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[:limit]

    # ── Heart Rate ────────────────────────────────────────────────
    def save_heartrate(self, user_id: str, reading: dict):
        reading["user_id"]   = user_id
        reading["timestamp"] = reading.get("timestamp", datetime.utcnow().isoformat())
        if self.mode == 'mongo':
            self.hr_col.insert_one(reading)
        else:
            self._mem_store["hr_readings"].append(reading)

    def get_latest_heartrate(self, user_id: str) -> dict | None:
        if self.mode == 'mongo':
            doc = self.hr_col.find_one({"user_id": user_id}, sort=[("timestamp", DESCENDING)])
            return self._clean(doc)
        else:
            user_data = [d for d in self._mem_store["hr_readings"] if d["user_id"] == user_id]
            if not user_data: return None
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[0]

    def get_hr_history(self, user_id: str, limit: int = 30) -> list:
        if self.mode == 'mongo':
            docs = self.hr_col.find({"user_id": user_id}, sort=[("timestamp", DESCENDING)]).limit(limit)
            return [self._clean(d) for d in docs]
        else:
            user_data = [d for d in self._mem_store["hr_readings"] if d["user_id"] == user_id]
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[:limit]

    # ── Journal ───────────────────────────────────────────────────
    def save_journal(self, user_id: str, entry: dict):
        entry["user_id"]   = user_id
        entry["timestamp"] = entry.get("timestamp", datetime.utcnow().isoformat())
        if self.mode == 'mongo':
            self.journal_col.insert_one(entry)
        else:
            self._mem_store["journal"].append(entry)

    def get_latest_journal(self, user_id: str) -> dict | None:
        if self.mode == 'mongo':
            doc = self.journal_col.find_one({"user_id": user_id}, sort=[("timestamp", DESCENDING)])
            return self._clean(doc)
        else:
            user_data = [d for d in self._mem_store["journal"] if d["user_id"] == user_id]
            if not user_data: return None
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[0]

    def get_journal_entries(self, user_id: str, limit: int = 30) -> list:
        if self.mode == 'mongo':
            docs = self.journal_col.find({"user_id": user_id}, sort=[("timestamp", DESCENDING)]).limit(limit)
            return [self._clean(d) for d in docs]
        else:
            user_data = [d for d in self._mem_store["journal"] if d["user_id"] == user_id]
            return sorted(user_data, key=lambda x: x["timestamp"], reverse=True)[:limit]

    # ── User Profile ──────────────────────────────────────────────
    def get_user_profile(self, user_id: str) -> dict | None:
        if self.mode == 'mongo':
            doc = self.users_col.find_one({"user_id": user_id})
            return self._clean(doc)
        else:
            for u in self._mem_store["users"]:
                if u["user_id"] == user_id: return u
            return None

    def save_user_profile(self, user_id: str, profile: dict):
        profile["user_id"] = user_id
        if self.mode == 'mongo':
            self.users_col.update_one({"user_id": user_id}, {"$set": profile}, upsert=True)
        else:
            # Upsert in memory
            for i, u in enumerate(self._mem_store["users"]):
                if u["user_id"] == user_id:
                    self._mem_store["users"][i].update(profile)
                    return
            self._mem_store["users"].append(profile)

    # ── Auth helpers ──────────────────────────────────────────────
    def find_user_by_email(self, email: str) -> dict | None:
        if self.mode == 'mongo':
            doc = self.users_col.find_one({"email": email})
            return self._clean(doc)
        else:
            for u in self._mem_store["users"]:
                if u.get("email") == email: return u
            return None

    def create_user(self, user_doc: dict) -> dict:
        if self.mode == 'mongo':
            self.users_col.insert_one(user_doc)
            return self._clean(user_doc)
        else:
            self._mem_store["users"].append(user_doc)
            return user_doc

    def _clean(self, doc: dict | None) -> dict | None:
        if doc is None: return None
        doc.pop("_id", None)
        return doc

    def ping(self) -> bool:
        if self.mode == 'memory': return True
        if not self.client: return False
        try:
            self.client.admin.command("ping")
            return True
        except: return False
