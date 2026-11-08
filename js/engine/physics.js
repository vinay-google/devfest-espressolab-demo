export class PhysicsEngine {
  constructor(config = {}) {
    this.A = 2.642e-3; // Standard 58mm basket cross-sectional area (m^2)
    this.beta = 0.28;  // Bed soluble erosion coefficient
    this.k_grain = 9.35e11; // Calibrated resistance scaling constant (36g yield at 27.2s)
    this.k_dwell = 85.0;   // Dwell time scaling constant (4.5s at 18g/340um)
    this.C0 = 18.0;        // Initial soluble concentration (%, yields ~20.2% EY at 1:2)
    this.gamma = 0.65;     // Solubles washout decay constant

    this.params = {
      dose: 18.0,
      grind: 340,
      temperature: 93.0,
      pressure: 9.0,
      targetYield: 36.0,
      dwellMultiplier: 1.0,
      ...config
    };

    this.reset(this.params);
  }

  computeViscosity(tempC) {
    // Water dynamic viscosity (Pa*s) via Vogel-Fulcher-Tammann equation
    const T = tempC + 273.15;
    return 2.414e-5 * Math.pow(10, 247.8 / (T - 140));
  }

  computeInitialResistance(dose, grind) {
    // R0 = k_grain * (dose^1.25 / grind^2.6)
    return this.k_grain * (Math.pow(dose, 1.25) / Math.pow(grind, 2.6));
  }

  computeDwellTime(dose, grind, pressure, dwellMultiplier = 1.0) {
    // t_dwell = k_dwell * (dose / grind) * sqrt(9.0 / pressure) * dwellMultiplier
    const pressRatio = Math.sqrt(9.0 / Math.max(pressure, 1.0));
    return this.k_dwell * (dose / grind) * pressRatio * dwellMultiplier;
  }

  reset(params = {}) {
    this.params = { ...this.params, ...params };
    this.time = 0.0;
    this.yieldMass = 0.0;
    this.flowRate = 0.0;
    this.solublesMass = 0.0;
    this.currentPressure = 0.0;
    this.ey = 0.0;
    this.tds = 0.0;
    this.blondingFraction = 0.0;
    this.phase = 'PRE_INFUSION';

    this.mu = this.computeViscosity(this.params.temperature);
    this.R0 = this.computeInitialResistance(this.params.dose, this.params.grind);
    this.t_dwell = this.computeDwellTime(
      this.params.dose,
      this.params.grind,
      this.params.pressure,
      this.params.dwellMultiplier || 1.0
    );

    this.history = [];
    this.recordHistoryPoint();
  }

  step(dt) {
    this.time += dt;

    // 1. Pump pressure ramp over 2.0s
    const rampFactor = Math.min(1.0, this.time / 2.0);
    this.currentPressure = this.params.pressure * rampFactor;
    const deltaP = this.currentPressure * 1e5; // Convert bar to Pa

    // 2. Pre-infusion saturation vs Extraction phase
    if (this.time < this.t_dwell) {
      this.phase = 'PRE_INFUSION';
      this.flowRate = 0.0;
    } else {
      this.phase = 'EXTRACTING';

      // Bed erosion with safety lower floor clamp R_bed >= 0.25 * R0
      const erosionTerm = Math.max(0.5, 1.0 - this.beta * (this.yieldMass / this.params.dose));
      const R_bed = this.R0 * (erosionTerm * erosionTerm);

      // Darcy's Law: Q = (dP * A) / (mu * R_bed) in g/s (assuming rho = 1.0 g/cm^3)
      // Note: (Pa * m^2) / (Pa*s * m^-1) = m^3/s -> * 1e6 cm^3/s = g/s
      // Our calibrated k_grain absorbs the m^3 to g conversion factor.
      this.flowRate = (deltaP * this.A) / (this.mu * R_bed);
    }

    // 3. Yield integration (mass conservation)
    const dYield = this.flowRate * dt;
    this.yieldMass += dYield;

    // 4. Solubles dissolution kinetics
    if (this.yieldMass > 0) {
      // C_sol(t) decays exponentially with extraction ratio
      const cSol = this.C0 * Math.exp(-this.gamma * (this.yieldMass / this.params.dose));
      const dSolubles = dYield * (cSol / 100.0);
      this.solublesMass += dSolubles;

      this.ey = (this.solublesMass / this.params.dose) * 100.0;
      this.tds = (this.solublesMass / this.yieldMass) * 100.0;
      this.blondingFraction = Math.min(1.0, Math.max(0.0, 1.0 - cSol / this.C0));
    } else {
      this.ey = 0.0;
      this.tds = 0.0;
      this.blondingFraction = 0.0;
    }

    this.recordHistoryPoint();
  }

  recordHistoryPoint() {
    this.history.push({
      time: Math.round(this.time * 100) / 100,
      yield: Math.round(this.yieldMass * 100) / 100,
      flowRate: Math.round(this.flowRate * 100) / 100,
      pressure: Math.round(this.currentPressure * 10) / 10,
      ey: Math.round(this.ey * 100) / 100,
      tds: Math.round(this.tds * 100) / 100
    });
  }

  getTelemetry() {
    return {
      time: this.time,
      yield: this.yieldMass,
      flowRate: this.flowRate,
      pressure: this.currentPressure,
      ey: this.ey,
      tds: this.tds,
      phase: this.phase,
      blondingFraction: this.blondingFraction
    };
  }

  getTelemetrySnapshot() {
    return {
      time: Math.round(this.time * 10) / 10,
      yield: Math.round(this.yieldMass * 10) / 10,
      flowRate: Math.round(this.flowRate * 10) / 10,
      pressure: Math.round(this.currentPressure * 10) / 10,
      ey: Math.round(this.ey * 10) / 10,
      tds: Math.round(this.tds * 10) / 10,
      phase: this.phase,
      blondingFraction: this.blondingFraction
    };
  }

  getRenderSnapshot() {
    return {
      time: this.time,
      yield: this.yieldMass,
      flowRate: this.flowRate,
      pressure: this.currentPressure,
      ey: this.ey,
      tds: this.tds,
      phase: this.phase,
      blondingFraction: this.blondingFraction,
      targetYield: this.params.targetYield,
      dose: this.params.dose
    };
  }

  getHistory() {
    return this.history;
  }
}
