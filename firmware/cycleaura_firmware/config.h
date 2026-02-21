#ifndef CONFIG_H
#define CONFIG_H

// ── WiFi Credentials ──────────────────────────────────────────────
#define WIFI_SSID     "Laasyy"
#define WIFI_PASSWORD "123456789"

// ── Flask Backend URL ─────────────────────────────────────────────
// Replace with your laptop IP when testing locally
// Example: "http://192.168.1.100:5000"
#define FLASK_SERVER  "https://noncondimental-superpatiently-susana.ngrok-free.dev"

// ── User ID ───────────────────────────────────────────────────────
// Set this to match the logged-in user in Firebase
#define USER_ID "U00001"

// ── Timing ───────────────────────────────────────────────────────
#define HEARTRATE_SEND_INTERVAL_MS  60000   // Send HR every 60 seconds
#define BBT_STABILIZE_DELAY_MS      30000   // Wait 30s for BBT to stabilize
#define DISPLAY_REFRESH_MS          1000    // OLED refresh rate

// ── Thresholds ────────────────────────────────────────────────────
#define FINGER_DETECTED_THRESHOLD   50000   // IR > this = finger on sensor
#define MOTION_STILL_THRESHOLD      0.3     // g < this = device is still
#define BBT_VALID_MIN               30.0    // Below this = bad reading
#define BBT_VALID_MAX               42.0    // Above this = bad reading

#endif
