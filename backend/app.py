import warnings
import os
import time
from datetime import datetime

# Aggressive warning suppression at the very top
warnings.simplefilter('ignore', DeprecationWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="Eventlet is deprecated")

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Removed eventlet monkey_patch for Windows stability
# import eventlet
# eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime
import uuid
import jwt as pyjwt
from werkzeug.security import generate_password_hash, check_password_hash

from ml_model import CyclePredictor
from mongo_client import MongoDBClient

app = Flask(__name__)
# Allow CORS for all routes under /api/
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- Verbose Request Logging ---
@app.before_request
def log_request_info():
    if not request.path.startswith('/static'):
        print(f"  📥 [{datetime.now().strftime('%H:%M:%S')}] {request.method} {request.path} from {request.remote_addr}")
        if request.args:
            print(f"      Params: {dict(request.args)}")
        if request.is_json and request.method == "POST":
            # Don't log full passwords
            data = request.get_json()
            if 'password' in data:
                 data = {k:v for k,v in data.items() if k != 'password'}
            print(f"      JSON Body: {data}")

# Using 'threading' for Windows stability. 'eventlet' is faster but can be unstable on Windows sockets.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', logger=False, engineio_logger=False)

JWT_SECRET = os.getenv("JWT_SECRET", "cyra_dev_secret_change_me")

# ── Init ML model and MongoDB ─────────────────────────────────────
predictor = CyclePredictor()
db        = MongoDBClient()


# ════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ════════════════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name     = data.get('name', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = db.find_user_by_email(email)
    if existing:
        return jsonify({'error': 'An account with this email already exists.'}), 409

    user_id = str(uuid.uuid4())
    user_doc = {
        'user_id':      user_id,
        'email':        email,
        'password_hash': generate_password_hash(password),
        'name':         name,
        'createdAt':    datetime.utcnow().isoformat(),
        'cycleProfile': data.get('cycleProfile', {}),
    }
    db.create_user(user_doc)

    # Build safe user object (no password hash)
    user = {k: v for k, v in user_doc.items() if k != 'password_hash'}
    token = pyjwt.encode({'user_id': user_id, 'email': email}, JWT_SECRET, algorithm='HS256')
    return jsonify({'token': token, 'user': user}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    record = db.find_user_by_email(email)
    if not record:
        return jsonify({'error': 'No account found with this email address.'}), 401

    if not check_password_hash(record.get('password_hash', ''), password):
        return jsonify({'error': 'Incorrect password. Please try again.'}), 401

    user = {k: v for k, v in record.items() if k != 'password_hash'}
    token = pyjwt.encode({'user_id': user['user_id'], 'email': email}, JWT_SECRET, algorithm='HS256')
    return jsonify({'token': token, 'user': user}), 200


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email required'}), 400
    record = db.find_user_by_email(email)
    if not record:
        return jsonify({'error': 'No account found with this email address.'}), 404
    # In production: send a real reset email
    return jsonify({'success': True, 'message': 'Password reset link sent (demo).'}), 200


# ════════════════════════════════════════════════════════════════
#  SENSOR ENDPOINTS  (called by ESP32 firmware)
# ════════════════════════════════════════════════════════════════

@app.route('/api/sensor/bbt', methods=['POST'])
def receive_bbt():
    data = request.json
    if not data:
        return jsonify({'error': 'No data'}), 400

    user_id = data.get('user_id')
    bbt     = data.get('bbt')

    if not user_id or bbt is None:
        return jsonify({'error': 'Missing user_id or bbt'}), 400
    if bbt < 20.0 or bbt > 42.0:
        return jsonify({'error': f'BBT {bbt} out of valid range (30–42C)'}), 400

    reading = {
        'bbt_celsius': bbt,
        'timestamp':   datetime.utcnow().isoformat(),
        'source':      'DS18B20_ESP32',
    }
    db.save_bbt(user_id, reading)
    prediction = _run_prediction(user_id, bbt=bbt)
    socketio.emit('bbt_update', {'user_id': user_id, 'bbt': bbt, 'prediction': prediction})
    return jsonify({'status': 'saved', 'bbt': bbt, 'prediction': prediction}), 201


@app.route('/api/sensor/heartrate', methods=['POST'])
def receive_heartrate():
    data = request.json
    if not data:
        return jsonify({'error': 'No data'}), 400

    user_id = data.get('user_id')
    reading = {
        'bpm':              data.get('bpm', 0),
        'ir_value':         data.get('ir_value', 0),
        'red_value':        data.get('red_value', 0),
        'spo2':             data.get('spo2', 0),
        'motion_magnitude': data.get('motion_magnitude', 0),
        'accel_x':          data.get('accel_x', 0),
        'accel_y':          data.get('accel_y', 0),
        'accel_z':          data.get('accel_z', 0),
        'finger_detected':  data.get('finger_detected', False),
        'timestamp':        datetime.utcnow().isoformat(),
        'source':           'MAX30102_ADXL335_ESP32',
    }
    db.save_heartrate(user_id, reading)
    socketio.emit('heartrate_update', {'user_id': user_id, **reading})
    return jsonify({'status': 'saved', **reading}), 201


# ════════════════════════════════════════════════════════════════
#  ML PREDICTION
# ════════════════════════════════════════════════════════════════

@app.route('/api/cycle/prediction', methods=['GET'])
def get_prediction():
    import time
    start = time.time()
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    latest_bbt = db.get_latest_bbt(user_id)
    bbt        = latest_bbt.get('bbt_celsius', 36.3) if latest_bbt else 36.3
    latest_hr  = db.get_latest_heartrate(user_id)
    bpm        = latest_hr.get('bpm', 0) if latest_hr else 0
    
    pred = _run_prediction(user_id, bbt=bbt, bpm=bpm)
    elapsed = (time.time() - start) * 1000
    print(f"      📤 Response: Phase={pred.get('phase')} ({pred.get('confidence')}%) | Took {elapsed:.1f}ms")
    return jsonify(pred), 200


# ════════════════════════════════════════════════════════════════
#  HISTORY
# ════════════════════════════════════════════════════════════════

@app.route('/api/cycle/history', methods=['GET'])
def get_bbt_history():
    user_id = request.args.get('user_id')
    limit   = int(request.args.get('limit', 30))
    return jsonify({'user_id': user_id, 'history': db.get_bbt_history(user_id, limit)}), 200

@app.route('/api/cycle/heartrate-history', methods=['GET'])
def get_hr_history():
    user_id = request.args.get('user_id')
    limit   = int(request.args.get('limit', 30))
    return jsonify({'user_id': user_id, 'history': db.get_hr_history(user_id, limit)}), 200


# ════════════════════════════════════════════════════════════════
#  JOURNAL
# ════════════════════════════════════════════════════════════════

@app.route('/api/journal/entry', methods=['POST'])
def save_journal():
    data    = request.json
    user_id = data.get('user_id')
    entry   = {
        'pain_level':   data.get('pain_level',   5),
        'mood_score':   data.get('mood_score',   7),
        'flow_level':   data.get('flow_level',   'Moderate'),
        'pms_symptoms': data.get('pms_symptoms', False),
        'energy_level': data.get('energy_level', 7),
        'notes':        data.get('notes',        ''),
        'timestamp':    datetime.utcnow().isoformat(),
    }
    db.save_journal(user_id, entry)
    latest_bbt = db.get_latest_bbt(user_id)
    bbt        = latest_bbt.get('bbt_celsius', 36.3) if latest_bbt else 36.3
    latest_hr  = db.get_latest_heartrate(user_id)
    bpm        = latest_hr.get('bpm', 0) if latest_hr else 0
    prediction = _run_prediction(user_id, bbt=bbt, bpm=bpm, journal_data=entry)
    return jsonify({'status': 'saved', 'prediction': prediction}), 201

@app.route('/api/journal/entries', methods=['GET'])
def get_journal():
    user_id = request.args.get('user_id')
    return jsonify({'user_id': user_id, 'entries': db.get_journal_entries(user_id)}), 200


# ════════════════════════════════════════════════════════════════
#  TIPS
# ════════════════════════════════════════════════════════════════

PHASE_TIPS = {
    'Menstrual':  {'diet': 'Iron-rich foods: lentils, spinach, tofu. Avoid caffeine.',
                   'exercise': 'Light yoga or walking. Rest is okay.',
                   'wellness': 'Apply heat to cramps. Prioritize sleep.'},
    'Follicular': {'diet': 'Fresh vegetables and lean protein fuel rising estrogen.',
                   'exercise': 'Great time for cardio and strength training.',
                   'wellness': 'Social energy is high. Good time for creative work.'},
    'Ovulatory':  {'diet': 'Fibre-rich foods help clear estrogen. Stay hydrated.',
                   'exercise': 'Peak performance window - HIIT, runs, challenges.',
                   'wellness': 'Ovulation window. Communicate, connect, collaborate.'},
    'Luteal':     {'diet': 'Magnesium-rich foods (dark chocolate, nuts) reduce PMS.',
                   'exercise': 'Pilates, swimming, or moderate gym sessions.',
                   'wellness': 'Energy dips later. Journaling and calm activities help.'},
}

@app.route('/api/tips/today', methods=['GET'])
def get_tips():
    user_id = request.args.get('user_id')
    pred    = _run_prediction(user_id) if user_id else {}
    phase   = pred.get('phase', 'Follicular')
    return jsonify({'phase': phase, 'tips': PHASE_TIPS.get(phase, PHASE_TIPS['Follicular'])}), 200


# ════════════════════════════════════════════════════════════════
#  USER PROFILE
# ════════════════════════════════════════════════════════════════

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id')
    profile = db.get_user_profile(user_id)
    if not profile:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(profile), 200

@app.route('/api/user/profile', methods=['POST'])
def save_profile():
    data = request.json
    db.save_user_profile(data.get('user_id'), data)
    return jsonify({'status': 'saved'}), 201

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status':  'ok' if db.ping() else 'degraded',
        'mongodb': 'connected' if db.ping() else 'disconnected',
        'ml':      'loaded',
    }), 200


# ════════════════════════════════════════════════════════════════
#  INTERNAL HELPER
# ════════════════════════════════════════════════════════════════

def _run_prediction(user_id, bbt=36.3, bpm=0, journal_data=None):
    t0 = time.time()
    
    # 1. Fetch History
    try:
        bbt_history_docs = db.get_bbt_history(user_id, limit=7)
    except Exception as e:
        print(f"      ❌ DB History Fetch Error: {e}")
        bbt_history_docs = []
    t1 = time.time()
    
    # 2. Fetch Profile
    try:
        user_profile = db.get_user_profile(user_id) or {}
    except Exception as e:
        print(f"      ❌ DB Profile Fetch Error: {e}")
        user_profile = {}
    t2 = time.time()
    
    # 3. Handle Journal
    if journal_data is None:
        try:
            journal_data = db.get_latest_journal(user_id) or {}
        except Exception:
            journal_data = {}
    t3 = time.time()
    
    bbt_history = [d.get('bbt_celsius', bbt) for d in bbt_history_docs] or [bbt]

    try:
        # 4. ML Model Inference
        prediction = predictor.predict(
            bbt_celsius=bbt, bpm=bpm,
            bbt_history=bbt_history,
            user_profile=user_profile,
            journal_data=journal_data,
        )
        t4 = time.time()
        
        # Log internal timing
        print(f"      ⚡ Timings: DB_Hist: {(t1-t0)*1000:.1f}ms | DB_Prof: {(t2-t1)*1000:.1f}ms | ML: {(t4-t3)*1000:.1f}ms")
        
        # Rule-based fallback if ML is uncertain (confidence < 0.1) or returns "Unknown"
        if prediction.get("phase") == "Unknown" or prediction.get("confidence", 0) < 0.1:
            if bbt < 36.4:
                prediction["phase"] = "Menstrual"
            elif bbt > 36.6:
                prediction["phase"] = "Luteal"
            else:
                prediction["phase"] = "Follicular"
            prediction["confidence"] = 0.50 # Override with neutral confidence for fallback
            
        return prediction

    except Exception as e:
        print(f"      ❌ ML Inference Error: {e}")
        # Final emergency fallback
        return {
            'phase': 'Menstrual' if bbt < 36.4 else ('Luteal' if bbt > 36.6 else 'Follicular'),
            'confidence': 0.30,
            'ovulation_positive': False, 
            'cycle_length_est': 28.0,
            'next_period_in_days': 14, 
            'health_score': 5.0
        }


@socketio.on('connect')
def on_connect():
    print(f"[Socket.io] Client connected: {request.sid}")

@socketio.on('disconnect')
def on_disconnect():
    print(f"[Socket.io] Client disconnected: {request.sid}")


if __name__ == '__main__':
    print("\n ✅  CyRa backend is running on http://0.0.0.0:5000\n")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
