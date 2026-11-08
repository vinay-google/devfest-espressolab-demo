export class SVGGaugeManager {
  constructor(domRefs = {}) {
    this.pressureNeedle = domRefs.pressureNeedle || document.getElementById('gauge-pressure-needle');
    this.flowNeedle = domRefs.flowNeedle || document.getElementById('gauge-flow-needle');
    this.pressureVal = domRefs.pressureVal || document.getElementById('gauge-pressure-val');
    this.flowVal = domRefs.flowVal || document.getElementById('gauge-flow-val');

    this.timerReadout = domRefs.timerReadout || document.getElementById('hud-timer');
    this.yieldReadout = domRefs.yieldReadout || document.getElementById('hud-yield');
    this.eyReadout = domRefs.eyReadout || document.getElementById('hud-ey');
  }

  update(telemetry = {}) {
    const pressure = telemetry.pressure || 0.0;
    const flowRate = telemetry.flowRate || 0.0;
    const time = telemetry.time || 0.0;
    const yieldGrams = telemetry.yield || 0.0;
    const ey = telemetry.ey || 0.0;

    // 1. Rotate Pressure Needle (-120deg to +120deg across 0-14 bar)
    if (this.pressureNeedle) {
      const pClamped = Math.min(14.0, Math.max(0.0, pressure));
      const pAngle = -120 + (pClamped / 14.0) * 240;
      this.pressureNeedle.setAttribute('transform', `rotate(${pAngle.toFixed(1)}, 80, 80)`);
    }

    if (this.pressureVal) {
      this.pressureVal.textContent = `${pressure.toFixed(1)} bar`;
    }

    // 2. Rotate Flow Needle (-120deg to +120deg across 0-5 g/s)
    if (this.flowNeedle) {
      const fClamped = Math.min(5.0, Math.max(0.0, flowRate));
      const fAngle = -120 + (fClamped / 5.0) * 240;
      this.flowNeedle.setAttribute('transform', `rotate(${fAngle.toFixed(1)}, 80, 80)`);
    }

    if (this.flowVal) {
      this.flowVal.textContent = `${flowRate.toFixed(1)} g/s`;
    }

    // 3. Digital HUD tabular readouts
    if (this.timerReadout) {
      this.timerReadout.textContent = `${time.toFixed(1)}s`;
    }

    if (this.yieldReadout) {
      this.yieldReadout.textContent = `${yieldGrams.toFixed(1)}g`;
    }

    if (this.eyReadout) {
      this.eyReadout.textContent = `${ey.toFixed(1)}%`;
    }
  }

  reset() {
    this.update({
      pressure: 0.0,
      flowRate: 0.0,
      time: 0.0,
      yield: 0.0,
      ey: 0.0
    });
  }
}
