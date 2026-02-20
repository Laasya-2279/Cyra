"""
CycleAura — CyclePredictor
============================
Loads trained .pkl models and serves predictions.
Called from app.py on every /api/cycle/prediction request.
"""

import os
import pickle
import numpy as np


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

    # ── Build feature row from incoming data ──────────────────────────
    def _build_row(self, sensor_data: dict, user_profile: dict, bbt_history: list):
        """
        sensor_data keys:
            bbt, stress_score, sleep_hours, energy_level,
            pain_level, mood_score, flow, pms, prev_cycle_length

        user_profile keys:
            age, bmi, pcos, birth_control, stress_baseline, diet, exercise

        bbt_history: list of last ≤7 BBT readings (floats, °C)
        """
        bbt_arr = np.array(bbt_history + [sensor_data["bbt"]])

        bbt_proxy   = float(sensor_data["bbt"])
        bbt_mean_7d = float(bbt_arr.mean())
        bbt_diff    = float(bbt_arr[-1] - bbt_arr[-2]) if len(bbt_arr) > 1 else 0.0
        bbt_std_7d  = float(bbt_arr.std()) if len(bbt_arr) > 1 else 0.0

        enc = self.encoders
        flow_enc = int(enc["flow"].transform([sensor_data.get("flow", "Moderate")])[0])
        pms_enc  = int(enc["pms"].transform([sensor_data.get("pms", "No")])[0])
        diet_enc = int(enc["diet"].transform([user_profile.get("diet", "Good")])[0])
        ex_enc   = int(enc["exercise"].transform(
            [user_profile.get("exercise", "3-4 days/week")])[0])

        row = [[
            bbt_proxy, bbt_mean_7d, bbt_diff, bbt_std_7d,
            float(sensor_data.get("stress_score", 5)),
            float(sensor_data.get("sleep_hours", 7)),
            float(sensor_data.get("energy_level", 6)),
            float(sensor_data.get("pain_level", 3)),
            float(sensor_data.get("mood_score", 7)),
            flow_enc, pms_enc,
            float(sensor_data.get("prev_cycle_length", 28)),
            float(user_profile["age"]),
            float(user_profile["bmi"]),
            int(user_profile.get("pcos", 0)),
            int(user_profile.get("birth_control", 0)),
            float(user_profile.get("stress_baseline", 5)),
            diet_enc, ex_enc,
        ]]
        return row

    # ── Main predict method ───────────────────────────────────────────
    def predict(self, sensor_data: dict, user_profile: dict,
                bbt_history: list) -> dict:
        row = self._build_row(sensor_data, user_profile, bbt_history)

        phase_enc  = int(self.phase_model.predict(row)[0])
        phase      = str(self.encoders["phase"].inverse_transform([phase_enc])[0])
        confidence = float(self.phase_model.predict_proba(row)[0].max()) * 100

        ovulation     = bool(self.ovul_model.predict(row)[0])
        next_cycle    = round(float(self.length_model.predict(row)[0]), 1)
        health_score  = round(float(self.health_model.predict(row)[0]), 1)

        # Days until next period (approximation)
        days_until_period = max(0, int(next_cycle - len(bbt_history)))

        return {
            "phase":               phase,
            "confidence":          round(confidence, 1),
            "ovulation_positive":  ovulation,
            "next_cycle_days":     next_cycle,
            "days_until_period":   days_until_period,
            "health_score":        health_score,
        }
