# Cyra MVP
## Smart Menstrual Cycle Tracking with IoT & Machine Learning

---

## 🎯 Executive Summary

**Cyra** is a comprehensive menstrual health monitoring system that combines IoT hardware, machine learning, and a modern web interface to provide real-time cycle phase prediction, health insights, and personalized recommendations.

### Key Value Proposition
- **Real-time BBT monitoring** via DS18B20 temperature sensor
- **Motion-artifact-corrected heart rate** via MAX30102 + ADXL335
- **ML-powered cycle phase prediction** with 89.6% accuracy
- **Personalized health tips** based on current phase
- **Privacy-first** with local data processing option

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CYRA SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐      HTTP POST      ┌──────────────────────────┐  │
│  │   ESP32 Device   │ ─────────────────► │     Flask Backend        │  │
│  │                  │                     │                          │  │
│  │  • DS18B20 (BBT) │      WebSocket     │  • REST API (10 routes)  │  │
│  │  • MAX30102 (HR) │ ◄─────────────────► │  • Socket.io realtime   │  │
│  │  • ADXL335 (MAR) │                     │  • ML Inference Engine  │  │
│  │  • OLED Display  │                     │  • MongoDB / Mock Store │  │
│  └──────────────────┘                     └──────────────────────────┘  │
│                                                      │                  │
│                                                      │ API + WebSocket  │
│                                                      ▼                  │
│                                           ┌──────────────────────────┐  │
│                                           │   React + Vite Frontend  │  │
│                                           │                          │  │
│                                           │  • Dashboard (Wheel/BBT) │  │
│                                           │  • Insights (Graphs)     │  │
│                                           │  • Journal (Mood/Sx)     │  │
│                                           │  • Tips (Phase-specific) │  │
│                                           │  • Settings              │  │
│                                           └──────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. Hardware (ESP32 IoT Device)

| Component | Purpose | Specifications |
|-----------|---------|----------------|
| **ESP32 DevKit** | MCU + WiFi | Dual-core 240MHz, 4MB Flash |
| **DS18B20** | Basal Body Temperature | ±0.5°C accuracy, 36-37°C range |
| **MAX30102** | Heart Rate + SpO2 | PPG sensor, I2C interface |
| **ADXL335** | Motion Artifact Removal | 3-axis accelerometer, analog |
| **SSD1306 OLED** | Local Display | 128x64 pixels, I2C |

**Key Features:**
- Motion Artifact Removal (MAR) filter correlates accelerometer with HR
- Sends BBT every 30s, HR every 60s to backend
- Displays current phase, BBT, HR, SpO2 on OLED
- Works offline with local display fallback

### 2. Backend (Flask + ML)

**Tech Stack:**
- Python 3.10+ with Flask 2.3
- Socket.io for real-time updates
- scikit-learn Random Forest models
- MongoDB (with in-memory fallback)

**ML Models (4 trained):**

| Model | Type | Metric | Performance |
|-------|------|--------|-------------|
| Phase Classifier | RandomForest | Accuracy | **89.6%** |
| Ovulation Detector | RandomForest | Accuracy | **74.4%** |
| Cycle Length Predictor | RandomForest | MAE | **1.71 days** |
| Health Score Regressor | RandomForest | R² | **99.06%** |

**API Endpoints (10 total):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/sensor/bbt` | Receive BBT from ESP32 |
| POST | `/api/sensor/heartrate` | Receive HR from ESP32 |
| GET | `/api/cycle/prediction` | Get latest ML prediction |
| GET | `/api/cycle/history` | Get BBT history for graphs |
| GET | `/api/cycle/heartrate` | Get HR history for graphs |
| POST | `/api/journal/entry` | Save mood/symptom entry |
| GET | `/api/journal/entries` | Get journal entries |
| POST | `/api/user/profile` | Save user profile |
| GET | `/api/user/profile` | Get user profile |
| GET | `/api/tips/today` | Get phase-specific tips |

### 3. Frontend (React + Vite)

**Tech Stack:**
- React 18 with Vite 5
- Recharts for data visualization
- Socket.io-client for real-time updates
- React Router for navigation

**Pages:**

| Page | Features |
|------|----------|
| **Dashboard** | Cycle wheel, current phase, live sensor cards, phase timeline |
| **Insights** | BBT trend graph, HR graph, cycle statistics, pattern analysis |
| **Journal** | Mood selection (6 options), 8 symptom toggles, notes |
| **Tips** | Phase-specific nutrition, exercise, wellness recommendations |
| **Settings** | Cycle length, device connection, notifications, data export |

---

## 🔬 ML Pipeline

### Training Data
- **2,000+ BBT samples** with 7-day windows
- **Period Log + User Profile** datasets (merged)
- Features: BBT trends, sleep, stress, pain, mood, flow, PMS, age, BMI, PCOS

### Feature Engineering
```
BBT Features:
├── bbt_proxy      (current reading)
├── bbt_mean_7d    (7-day rolling mean)
├── bbt_diff       (day-over-day change)
└── bbt_std_7d     (7-day variability)

User Features:
├── age, bmi, pcos_diagnosed, birth_control_use
├── stress_baseline, diet_quality, exercise_frequency
└── Previous cycle length
```

### Model Outputs
```json
{
  "phase": "Follicular|Ovulatory|Luteal|Menstrual",
  "confidence": 86.3,
  "ovulation_positive": true,
  "next_cycle_days": 27.9,
  "days_until_period": 24,
  "health_score": 9.7
}
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- ESP32 with sensors (optional for testing)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python training/train_model.py  # Train ML models
python app.py                    # Start server on :5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev    # Start on :3000
```

### Firmware Setup (Arduino IDE)
1. Install ESP32 board support
2. Install libraries: OneWire, DallasTemperature, MAX30105, Adafruit_SSD1306
3. Update `config.h` with WiFi credentials and server IP
4. Upload `cyra_firmware.ino`

---

## 📊 Data Flow

```
     ESP32                Backend                Frontend
       │                    │                      │
       │  POST /bbt         │                      │
       │ ──────────────────►│                      │
       │                    │ save_bbt()           │
       │                    │ run_prediction()     │
       │                    │ push_prediction()    │
       │                    │ ─────────────────────┼──► Socket.io
       │                    │                      │    "prediction_update"
       │                    │                      │
       │  GET /prediction   │                      │
       │ ◄──────────────────│                      │
       │  {phase, conf...}  │                      │
       │                    │                      │
       │  Display on OLED   │                      │
       │                    │                      │
```

---

## 🔒 Privacy & Security

- **Local-first**: App works offline with mock storage
- **No cloud dependency**: MongoDB is optional
- **Encrypted transport**: HTTPS/WSS in production
- **User-controlled data**: Export/delete via Settings

---

## 📈 Future Roadmap

### Phase 2 (v1.1)
- [ ] Mobile app (React Native)
- [ ] Cloud sync with MongoDB Atlas
- [ ] Push notifications for predictions
- [ ] Partner sharing mode

### Phase 3 (v1.2)
- [ ] Fertility window prediction
- [ ] Integration with wearables (Fitbit, Apple Watch)
- [ ] Telemedicine appointment booking
- [ ] Period product recommendations

### Phase 4 (v2.0)
- [ ] Multi-user household support
- [ ] Menopause transition tracking
- [ ] Research data contribution (opt-in anonymized)

---

## 📁 Project Structure

```
Cyra/
├── backend/
│   ├── app.py                 # Flask server + routes
│   ├── mongo_client.py        # DB operations (MongoDB/mock)
│   ├── ml_model.py            # CyclePredictor class
│   ├── socket_events.py       # Real-time push handlers
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Trained .pkl files
│   │   ├── rf_phase.pkl
│   │   ├── rf_ovul.pkl
│   │   ├── rf_length.pkl
│   │   ├── rf_health.pkl
│   │   └── encoders.pkl
│   └── training/
│       ├── train_model.py     # ML training script
│       └── bbt_dataset.csv    # Training data
│
├── frontend/
│   ├── index.html             # Vite entry
│   ├── vite.config.js         # Vite config + proxy
│   ├── package.json           # NPM dependencies
│   └── src/
│       ├── main.jsx           # React entry
│       ├── App.jsx            # Router setup
│       ├── components/        # Reusable UI components
│       ├── pages/             # Route pages
│       ├── context/           # CycleContext (global state)
│       ├── services/          # API + Socket clients
│       └── utils/             # Helpers (date, colors)
│
├── firmware/
│   ├── cyra_firmware.ino      # Main ESP32 sketch
│   ├── config.h               # WiFi + server config
│   ├── sensors.h              # DS18B20, MAX30102, ADXL335
│   ├── mar_filter.h           # Motion artifact removal
│   ├── oled_display.h         # OLED rendering
│   └── wifi_client.h          # HTTP requests to Flask
│
└── MVP.md                     # This document
```

---

## 🧪 Testing

### Backend API Tests
```bash
# Create user profile
curl -X POST http://localhost:5000/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","age":25,"bmi":22}'

# Send BBT reading (triggers ML prediction)
curl -X POST http://localhost:5000/api/sensor/bbt \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","bbt":36.5}'

# Get prediction
curl http://localhost:5000/api/cycle/prediction?user_id=test

# Get phase tips
curl http://localhost:5000/api/tips/today?user_id=test
```

### Expected Response (POST /api/sensor/bbt)
```json
{
  "bbt": 36.5,
  "prediction": {
    "phase": "Follicular",
    "confidence": 86.3,
    "ovulation_positive": true,
    "next_cycle_days": 27.9,
    "days_until_period": 24,
    "health_score": 9.7
  },
  "status": "ok"
}
```

---

## 👥 Team & Contact

**Project:** Cyra - Smart Menstrual Health Monitoring  
**Version:** 1.0.0 MVP  
**Date:** February 2026

---

## 📜 License

MIT License - Free for personal and commercial use.

---

*Built with ❤️ for women's health*
