#ifndef MAR_FILTER_H
#define MAR_FILTER_H

// ════════════════════════════════════════════════════════════════
//  Motion Artifact Removal (MAR) Filter
//  Correlates ADXL335 motion with MAX30102 IR signal
//  and suppresses motion-caused BPM spikes
//
//  FIXES APPLIED:
//  1. motionMag now passed in gravity-compensated form
//  2. isClean() threshold raised from 0.5 → 0.8
//  3. ready flag fixed: sets after first full loop, not at idx==0
// ════════════════════════════════════════════════════════════════

#define MAR_BUFFER_SIZE 10

struct MARFilter {
  float irBuffer[MAR_BUFFER_SIZE];
  float motionBuffer[MAR_BUFFER_SIZE];
  int   idx;
  bool  ready;

  MARFilter() : idx(0), ready(false) {
    memset(irBuffer,     0, sizeof(irBuffer));
    memset(motionBuffer, 0, sizeof(motionBuffer));
  }

  // ── Static helper: gravity-compensated motion magnitude ────────
  // Call this in sensors.h BEFORE passing magnitude to update()
  // Removes the ~1g gravity component from Z-axis so that
  // a still device reads ~0g instead of ~1.5g
  static float gravityCompensated(float ax, float ay, float az) {
    // Subtract 1g from Z (gravity pulls down = negative Z on flat surface)
    float az_compensated = az + 1.0f;
    return sqrt(ax * ax + ay * ay + az_compensated * az_compensated);
  }

  // ── Feed new sample into ring buffers ─────────────────────────
  void update(long irValue, float motionMag) {
    irBuffer[idx]     = (float)irValue;
    motionBuffer[idx] = motionMag;
    idx = (idx + 1) % MAR_BUFFER_SIZE;
    // FIX: set ready after completing first full loop
    if (idx == 0) ready = true;
  }

  // ── Pearson correlation: IR signal vs motion ───────────────────
  // High correlation → IR is tracking motion → artifact
  // Low correlation  → IR is tracking heartbeat → clean
  float correlation() {
    float sumIR = 0, sumM = 0, sumIR2 = 0, sumM2 = 0, sumIM = 0;
    int n = MAR_BUFFER_SIZE;
    for (int i = 0; i < n; i++) {
      sumIR  += irBuffer[i];
      sumM   += motionBuffer[i];
      sumIR2 += irBuffer[i]     * irBuffer[i];
      sumM2  += motionBuffer[i] * motionBuffer[i];
      sumIM  += irBuffer[i]     * motionBuffer[i];
    }
    float num = n * sumIM - sumIR * sumM;
    float den = sqrt((n * sumIR2 - sumIR * sumIR) *
                     (n * sumM2  - sumM  * sumM));
    if (den == 0) return 0;
    return num / den;
  }

  // ── Signal quality check ───────────────────────────────────────
  // Returns true if the IR signal is clean enough to extract BPM
  bool isClean(float motionMag) {
    if (!ready)              return false; // Buffer not full yet
    if (motionMag > 0.8f)   return false; // FIX: was 0.5, raised to 0.8
                                           // 0.5 was rejecting gravity-
                                           // compensated still readings
    if (abs(correlation()) > 0.7f) return false; // IR tracks motion = artifact
    return true;
  }

  // ── Complementary low-pass filter on IR signal ─────────────────
  // Smooths the raw IR to reduce high-frequency noise
  // alpha = 0.85 → mostly trust new sample, small smoothing
  float filteredIR(float rawIR, float alpha = 0.85f) {
    static float prev = rawIR;
    prev = alpha * rawIR + (1.0f - alpha) * prev;
    return prev;
  }
};

// Global MAR filter instance
MARFilter marFilter;

#endif
