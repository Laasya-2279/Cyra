"""
CyRa — Socket.io Event Handlers
======================================
Real-time push from server to all connected React clients.
Called from app.py after every sensor POST.
"""

from flask_socketio import SocketIO, emit

socketio: SocketIO = None   # injected from app.py


def init_socketio(sio: SocketIO):
    global socketio
    socketio = sio
    register_events()


def register_events():
    @socketio.on("connect")
    def on_connect():
        print("[Socket.io] Client connected")
        emit("status", {"msg": "Connected to CyRa server"})

    @socketio.on("disconnect")
    def on_disconnect():
        print("[Socket.io] Client disconnected")


# ── Push helpers — called from app.py ────────────────────────────────
def push_bbt(user_id: str, bbt: float):
    """Broadcast new BBT reading to all clients."""
    if socketio:
        socketio.emit("bbt_update", {"user_id": user_id, "bbt": bbt})


def push_heart_rate(user_id: str, bpm: int, spo2: int, mar_clean: bool):
    """Broadcast new HR reading."""
    if socketio:
        socketio.emit("heartrate_update", {
            "user_id":   user_id,
            "bpm":       bpm,
            "spo2":      spo2,
            "mar_clean": mar_clean,
        })


def push_prediction(user_id: str, prediction: dict):
    """Broadcast updated ML prediction after new BBT arrives."""
    if socketio:
        socketio.emit("prediction_update", {
            "user_id": user_id,
            **prediction,
        })
