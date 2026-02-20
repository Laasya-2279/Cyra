"""
CycleAura — ML Training Script
================================
Dataset:  backend/data/Period_Log.csv  +  backend/data/User_Profile.csv
Output:   backend/models/*.pkl

Run from backend/ directory:
    python training/train_model.py

Accuracy achieved on real dataset:
    Phase prediction  : 89.6%
    Ovulation         : 74.4%
    Health score R2   : 99.06%
    Cycle length MAE  : 1.71 days
"""

import os
import sys
import pickle
import warnings

import numpy  as np
import pandas as pd
from sklearn.ensemble         import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection  import train_test_split
from sklearn.preprocessing    import LabelEncoder
from sklearn.metrics          import (accuracy_score, classification_report,
                                      mean_absolute_error, r2_score)
from imblearn.over_sampling   import SMOTE

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────
BASE     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, "data")
MDL_DIR  = os.path.join(BASE, "models")
os.makedirs(MDL_DIR, exist_ok=True)

PL_PATH  = os.path.join(DATA_DIR, "Period_Log.csv")
UP_PATH  = os.path.join(DATA_DIR, "User_Profile.csv")

# ── 1. Load & Merge ───────────────────────────────────────────────────
print("Loading datasets...")
pl = pd.read_csv(PL_PATH)
up = pd.read_csv(UP_PATH)
df = pl.merge(up, on="user_id", how="left")
print(f"  Period_Log   : {pl.shape[0]:,} rows x {pl.shape[1]} cols")
print(f"  User_Profile : {up.shape[0]:,} rows x {up.shape[1]} cols")
print(f"  Merged       : {df.shape[0]:,} rows x {df.shape[1]} cols")

# ── 2. BBT Rolling Features ───────────────────────────────────────────
print("\nEngineering BBT features...")
df = df.sort_values(["user_id", "cycle_number"])

# Map progesterone to BBT proxy (36.1–37.0°C range)
# In production this IS the DS18B20 reading
df["bbt_proxy"] = 36.1 + (
    df["progesterone_ngml"] / df["progesterone_ngml"].max()
) * 0.9

# Per-user rolling stats (7-day window)
grp = df.groupby("user_id")["bbt_proxy"]
df["bbt_mean_7d"] = grp.transform(lambda x: x.rolling(7, min_periods=1).mean())
df["bbt_diff"]    = grp.diff().fillna(0)
df["bbt_std_7d"]  = grp.transform(
    lambda x: x.rolling(7, min_periods=1).std().fillna(0)
)

# ── 3. Encode Categoricals ────────────────────────────────────────────
print("Encoding categorical columns...")
le_flow     = LabelEncoder()
le_pms      = LabelEncoder()
le_diet     = LabelEncoder()
le_exercise = LabelEncoder()
le_phase    = LabelEncoder()

df["flow_enc"]     = le_flow.fit_transform(df["flow_level"])
df["pms_enc"]      = le_pms.fit_transform(df["pms_symptoms"])
df["diet_enc"]     = le_diet.fit_transform(df["diet_quality"].fillna("Average"))
df["exercise_enc"] = le_exercise.fit_transform(
    df["exercise_frequency"].fillna("3-4 days/week")
)
df["phase_enc"] = le_phase.fit_transform(df["cycle_phase"])

# ── 4. Feature List ───────────────────────────────────────────────────
FEATURES = [
    # BBT-derived (from DS18B20 sensor)
    "bbt_proxy", "bbt_mean_7d", "bbt_diff", "bbt_std_7d",
    # Sensor-derived (from MAX30102 + ADXL335)
    "stress_score_cycle",    # HR proxy
    "sleep_hours_cycle",     # motion proxy
    # Journal inputs
    "energy_level", "pain_level", "mood_score",
    "flow_enc", "pms_enc",
    # History
    "prev_cycle_length",
    # User profile
    "age", "bmi", "pcos_diagnosed", "birth_control_use",
    "stress_score_baseline", "diet_enc", "exercise_enc",
]

TARGETS = ["phase_enc", "ovulation_result", "cycle_length_days", "overall_health_score"]
df_clean = df[FEATURES + TARGETS].dropna()
print(f"  Clean rows for training: {len(df_clean):,}")

X        = df_clean[FEATURES]
y_phase  = df_clean["phase_enc"]
y_ovul   = (df_clean["ovulation_result"] == "Positive").astype(int)
y_length = df_clean["cycle_length_days"]
y_health = df_clean["overall_health_score"]

# ── 5. Train-Test Split ───────────────────────────────────────────────
print("\nSplitting data (80/20)...")
X_tr, X_te, yp_tr, yp_te = train_test_split(X, y_phase,  test_size=0.2, random_state=42)
_,    _,    yo_tr, yo_te  = train_test_split(X, y_ovul,   test_size=0.2, random_state=42)
_,    _,    yl_tr, yl_te  = train_test_split(X, y_length, test_size=0.2, random_state=42)
_,    _,    yh_tr, yh_te  = train_test_split(X, y_health, test_size=0.2, random_state=42)

# ── 6. SMOTE — fix Menstrual class imbalance ──────────────────────────
print("Applying SMOTE for class balance...")
smote = SMOTE(random_state=42)
X_res, yp_res = smote.fit_resample(X_tr, yp_tr)
print(f"  Before SMOTE: {dict(zip(*np.unique(yp_tr, return_counts=True)))}")
print(f"  After  SMOTE: {dict(zip(*np.unique(yp_res, return_counts=True)))}")

# ── 7. Train Models ───────────────────────────────────────────────────
print("\nTraining models...")

# Model 1: Cycle Phase Classifier
print("  [1/4] Phase classifier...")
rf_phase = RandomForestClassifier(
    n_estimators=150, max_depth=20,
    class_weight="balanced", random_state=42, n_jobs=-1
)
rf_phase.fit(X_res, yp_res)
phase_preds = rf_phase.predict(X_te)
phase_acc   = accuracy_score(yp_te, phase_preds)
print(f"        Accuracy: {phase_acc:.2%}")
print(classification_report(yp_te, phase_preds, target_names=le_phase.classes_))

# Model 2: Ovulation Classifier
print("  [2/4] Ovulation classifier...")
rf_ovul = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_ovul.fit(X_tr, yo_tr)
ovul_acc = accuracy_score(yo_te, rf_ovul.predict(X_te))
print(f"        Accuracy: {ovul_acc:.2%}")

# Model 3: Next Cycle Length Regressor
print("  [3/4] Cycle length regressor...")
rf_length = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
rf_length.fit(X_tr, yl_tr)
length_mae = mean_absolute_error(yl_te, rf_length.predict(X_te))
print(f"        MAE: {length_mae:.2f} days")

# Model 4: Health Score Regressor
print("  [4/4] Health score regressor...")
rf_health = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
rf_health.fit(X_tr, yh_tr)
health_r2 = r2_score(yh_te, rf_health.predict(X_te))
print(f"        R2: {health_r2:.2%}")

# ── 8. Feature Importances ────────────────────────────────────────────
print("\nTop 5 features for phase prediction:")
imp = pd.Series(rf_phase.feature_importances_, index=FEATURES).sort_values(ascending=False)
for feat, val in imp.head(5).items():
    print(f"  {feat:<25} {val:.3f}")

# ── 9. Save All Models & Encoders ─────────────────────────────────────
print("\nSaving models...")

def save(obj, fname):
    path = os.path.join(MDL_DIR, fname)
    with open(path, "wb") as f:
        pickle.dump(obj, f)
    print(f"  Saved: {fname}")

save(rf_phase,  "rf_phase.pkl")
save(rf_ovul,   "rf_ovul.pkl")
save(rf_length, "rf_length.pkl")
save(rf_health, "rf_health.pkl")
save({
    "phase":    le_phase,
    "flow":     le_flow,
    "pms":      le_pms,
    "diet":     le_diet,
    "exercise": le_exercise,
}, "encoders.pkl")
save(FEATURES, "features.pkl")

print("\n==============================================")
print("  Training complete!")
print(f"  Phase accuracy  : {phase_acc:.2%}")
print(f"  Ovulation acc   : {ovul_acc:.2%}")
print(f"  Cycle len MAE   : {length_mae:.2f} days")
print(f"  Health score R2 : {health_r2:.2%}")
print(f"  Models saved to : {MDL_DIR}")
print("==============================================")
