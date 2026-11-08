export class FlavorRadarRenderer {
  constructor(activePolygon, ghostPolygon) {
    this.activePoly = activePolygon || document.getElementById('radar-polygon-active');
    this.ghostPoly = ghostPolygon || document.getElementById('radar-polygon-ghost');

    this.cx = 140;
    this.cy = 140;
    this.radius = 95;

    // Angles for the 5 vertices in radians
    // 0: Sour (Top, 90 deg)
    // 1: Sweet (Upper Right, 18 deg)
    // 2: Body (Lower Right, 306 deg / -54 deg)
    // 3: Bitter (Lower Left, 234 deg / -126 deg)
    // 4: Clarity (Upper Left, 162 deg)
    const degToRad = Math.PI / 180;
    this.angles = [
      90 * degToRad,
      18 * degToRad,
      -54 * degToRad,
      -126 * degToRad,
      162 * degToRad
    ];

    this.renderGhostTarget();
  }

  computeCoordinates(values) {
    return values.map((val, i) => {
      const vClamped = Math.min(1.0, Math.max(0.05, val));
      const r = vClamped * this.radius;
      const angle = this.angles[i];
      const x = this.cx + r * Math.cos(angle);
      const y = this.cy - r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  renderGhostTarget() {
    if (!this.ghostPoly) return;
    // Ideal target polygon: [Sour=0.35, Sweet=0.90, Body=0.65, Bitter=0.30, Clarity=0.70]
    const targetValues = [0.35, 0.90, 0.65, 0.30, 0.70];
    this.ghostPoly.setAttribute('points', this.computeCoordinates(targetValues));
  }

  evaluateSensoryAxes(metrics = {}) {
    const ey = metrics.ey !== undefined ? metrics.ey : 20.0;
    const temp = metrics.temperature || 93.0;
    const dose = metrics.dose || 18.0;
    const ratio = metrics.ratio !== undefined ? metrics.ratio : 2.0;

    const clamp = (val, min = 0.05, max = 1.0) => Math.min(max, Math.max(min, val));

    const sour = clamp(0.35 + 0.08 * (20.0 - ey) + 0.03 * (93.0 - temp));
    const sweet = clamp(0.90 - 0.12 * Math.abs(ey - 20.0) - 0.04 * Math.abs(temp - 93.0));
    const body = clamp(0.65 + 0.05 * (dose - 18.0) - 0.25 * (ratio - 2.0));
    const bitter = clamp(0.30 + 0.09 * (ey - 20.0) + 0.04 * (temp - 93.0) + 0.12 * (ratio - 2.0));
    const clarity = clamp(0.70 - 0.04 * (dose - 18.0) + 0.20 * (ratio - 2.0) - 0.05 * Math.abs(ey - 20.0));

    return [sour, sweet, body, bitter, clarity];
  }

  update(metrics = {}) {
    if (!this.activePoly) return;
    const scores = this.evaluateSensoryAxes(metrics);
    this.activePoly.setAttribute('points', this.computeCoordinates(scores));
  }

  reset() {
    if (!this.activePoly) return;
    // Reset to small center origin
    const origin = [0.05, 0.05, 0.05, 0.05, 0.05];
    this.activePoly.setAttribute('points', this.computeCoordinates(origin));
  }
}
