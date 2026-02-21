"""
CycleAura — CyclePredictor
============================
Loads trained .pkl models and serves predictions.
Called from app.py on every /api/cycle/prediction request.
"""

import os
import pickle
from typing import Optional
import numpy as np
import pandas as pd


MDL_DIR = os.path.join(os.path.dirname(__file__), "models")


class CyclePredictor:
    def __init__(self):
        def load(fname):
            with open(os.path.join(MDL_DIR, fname), "rb") as f:
                return pickle.load(f)

        self.phase_model  = load("rf_phase.pkl")
        self.ovul_model   = load("rf_ovul.pkl")
        self.length_model = load("rf_length.pkl")
        self.health_model = load("rf_health.pkl")
        self.encoders     = load("encoders.pkl")
        self.features     = load("features.pkl")

        print("[ML] CyclePredictor loaded all models OK")

    # ── Safe categorical encoding ─────────────────────────────────────
    def _safe_encode(self, name, value, default="Moderate"):
        """Encodes a categorical value, falling back to a default if unknown."""
        try:
            return int(self.encoders[name].transform([value or default])[0])
        except Exception:
            # Fallback to the most common index if value is totally unknown
            return 0

    # ── Build feature row from incoming data ──────────────────────────
    def _build_row(self, sensor_data: dict, user_profile: dict, bbt_history: list):
        """Builds feature row for prediction."""
        # Ensure bbt_history is a list of floats
        history = [float(x) for x in bbt_history] if bbt_history else []
        bbt_val = float(sensor_data.get("bbt", 36.3))
        bbt_arr = np.array(history + [bbt_val])

        bbt_proxy   = bbt_val
        bbt_mean_7d = float(bbt_arr.mean())
        bbt_diff    = float(bbt_arr[-1] - bbt_arr[-2]) if len(bbt_arr) > 1 else 0.0
        bbt_std_7d  = float(bbt_arr.std()) if len(bbt_arr) > 1 else 0.0

        # Safe encoding for categories
        flow_enc = self._safe_encode("flow", sensor_data.get("flow"), "Moderate")
        pms_enc  = self._safe_encode("pms", sensor_data.get("pms"), "No")
        diet_enc = self._safe_encode("diet", user_profile.get("diet"), "Good")
        ex_enc   = self._safe_encode("exercise", user_profile.get("exercise"), "3-4 days/week")

        row = [[
            bbt_proxy, bbt_mean_7d, bbt_diff, bbt_std_7d,
            float(sensor_data.get("stress_score", 5)),
            float(sensor_data.get("sleep_hours", 7)),
            float(sensor_data.get("energy_level", 6)),
            float(sensor_data.get("pain_level", 3)),
            float(sensor_data.get("mood_score", 7)),
            flow_enc, pms_enc,
            float(sensor_data.get("prev_cycle_length", 28)),
            float(user_profile.get("age", 25) if user_profile else 25),
            float(user_profile.get("bmi", 22.0) if user_profile else 22.0),
            int(user_profile.get("pcos", 0) if user_profile else 0),
            int(user_profile.get("birth_control", 0) if user_profile else 0),
            float(user_profile.get("stress_baseline", 5) if user_profile else 5),
            diet_enc, ex_enc,
        ]]
        return row

    # ── Main predict method ───────────────────────────────────────────
    def predict(self, *, bbt_celsius: float = 36.3, bpm: int = 0,
                bbt_history: list, user_profile: dict,
                journal_data: Optional[dict] = None,
                # Legacy positional support  ↓
                sensor_data: Optional[dict] = None) -> dict:
        """
        Accepts the kwargs sent by app.py:
            bbt_celsius, bpm, bbt_history, user_profile, journal_data
        Builds the sensor_data dict that _build_row() expects.
        """
        if sensor_data is None:
            jd = journal_data or {}
            sensor_data = {
                "bbt":              bbt_celsius,
                "stress_score":     jd.get("stress_score",  5),
                "sleep_hours":      jd.get("sleep_hours",   7),
                "energy_level":     jd.get("energy_level",  6),
                "pain_level":       jd.get("pain_level",    3),
                "mood_score":       jd.get("mood_score",    7),
                "flow":             jd.get("flow_level",    "Moderate"),
                "pms":              "Yes" if jd.get("pms_symptoms") else "No",
                "prev_cycle_length": jd.get("prev_cycle_length", 28),
            }

        row = self._build_row(sensor_data, user_profile, bbt_history)
        
        # Convert to DataFrame to include feature names (fixes scikit-learn warning)
        df = pd.DataFrame(row, columns=self.features)

        phase_probs = self.phase_model.predict_proba(df)[0]
        phase_enc   = int(self.phase_model.predict(df)[0])
        phase       = str(self.encoders["phase"].inverse_transform([phase_enc])[0])
        confidence  = float(phase_probs.max()) # 0.0 to 1.0 probability

        ovulation     = bool(self.ovul_model.predict(df)[0])
        next_cycle    = round(float(self.length_model.predict(df)[0]), 1)
        health_score  = round(float(self.health_model.predict(df)[0]), 1)

        # Descriptive Fallback (Anti-Unknown)
        # If confidence is low or phase is 'Unknown' or BBT is room-temp (sensor error)
        if phase == "Unknown" or confidence < 0.1 or bbt_celsius < 34.0:
            if bbt_celsius < 36.4:
                phase = "Menstrual" # Default for missing/invalid data
            elif bbt_celsius > 36.6:
                phase = "Luteal"
            else:
                phase = "Follicular"
            confidence = max(0.5, confidence) 



        # Days until next period (approximation)
        days_until_period = max(0, int(next_cycle - len(bbt_history)))

        return {
            "phase":               phase,
            "confidence":          round(confidence, 3), # 0.0 - 1.0 range (firmware scales this)
            "ovulation_positive":  ovulation,
            "cycle_length_est":    next_cycle,
            "next_period_in_days": days_until_period,
            "health_score":        health_score,
        }
