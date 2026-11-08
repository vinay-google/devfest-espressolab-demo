import test from 'node:test';
import assert from 'node:assert/strict';
import { PhysicsEngine } from '../js/engine/physics.js';

test('PhysicsEngine - Pre-infusion dwell delay exhibits zero flow', () => {
  const engine = new PhysicsEngine({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    pressure: 9.0,
    dwellMultiplier: 1.0
  });

  const dt = 1 / 60;
  const tDwell = engine.t_dwell;
  assert.ok(tDwell >= 4.0 && tDwell <= 5.5, `t_dwell should be ~4.5s, got ${tDwell}`);

  // Step up to dwell time - dt
  while (engine.time < tDwell - dt) {
    engine.step(dt);
    assert.equal(engine.flowRate, 0.0, `Flow rate must be 0 before dwell, at t=${engine.time}`);
    assert.equal(engine.yieldMass, 0.0, `Yield mass must be 0 before dwell, at t=${engine.time}`);
  }

  // Step past dwell time
  engine.step(dt);
  engine.step(dt);
  assert.ok(engine.flowRate > 0.0, `Flow rate must be positive after dwell, at t=${engine.time}`);
  assert.ok(engine.yieldMass > 0.0, `Yield mass must accumulate after dwell, at t=${engine.time}`);
});

test('PhysicsEngine - Mass conservation strictly equals flow integration', () => {
  const engine = new PhysicsEngine({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    pressure: 9.0
  });

  const dt = 1 / 60;
  let manualIntegral = 0;

  for (let i = 0; i < 60 * 27; i++) { // 27 seconds (nominal shot duration)
    const prevYield = engine.yieldMass;
    engine.step(dt);
    const flow = engine.flowRate;
    manualIntegral += flow * dt;
  }

  assert.ok(Math.abs(engine.yieldMass - manualIntegral) < 1e-4, 'Cup yield must equal integral of flow rate');
  assert.ok(engine.yieldMass >= 30.0 && engine.yieldMass <= 40.0, `Expected ~36g yield at 27s, got ${engine.yieldMass}`);
});

test('PhysicsEngine - Hydraulic bed resistance erosion floor clamp prevents singularity', () => {
  const engine = new PhysicsEngine({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    pressure: 9.0
  });

  const dt = 1 / 60;
  // Run for 120 seconds to force extreme high yield ratio (> 4.0)
  for (let i = 0; i < 60 * 120; i++) {
    engine.step(dt);
  }

  assert.ok(engine.yieldMass / engine.params.dose > 4.0, 'Yield ratio should exceed 4.0');
  assert.ok(Number.isFinite(engine.flowRate), 'Flow rate must remain finite');
  assert.ok(!Number.isNaN(engine.flowRate), 'Flow rate must not be NaN');
  assert.ok(engine.flowRate > 0.0, 'Flow rate must remain positive');
});

test('PhysicsEngine - Viscosity scaling with water temperature', () => {
  const engineCold = new PhysicsEngine({ temperature: 88.0 });
  const engineHot = new PhysicsEngine({ temperature: 96.0 });

  assert.ok(engineCold.mu > engineHot.mu, 'Viscosity at 88C must be higher than at 96C');

  const dt = 1 / 60;
  // Run both past dwell
  for (let i = 0; i < 60 * 15; i++) {
    engineCold.step(dt);
    engineHot.step(dt);
  }

  assert.ok(engineHot.flowRate > engineCold.flowRate, 'Hot extraction flow rate must be faster than cold');
});

test('PhysicsEngine - Solubles washout kinetics and Extraction Yield (EY%)', () => {
  const engine = new PhysicsEngine({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    pressure: 9.0
  });

  const dt = 1 / 60;
  for (let i = 0; i < 60 * 28; i++) {
    engine.step(dt);
  }

  assert.ok(engine.ey >= 18.0 && engine.ey <= 23.0, `Extraction yield should be ~20%, got ${engine.ey}%`);
  assert.ok(engine.tds >= 8.0 && engine.tds <= 13.0, `TDS should be ~9-11%, got ${engine.tds}%`);
  assert.ok(engine.blondingFraction > 0.5 && engine.blondingFraction <= 1.0, `Blonding fraction should be >0.5, got ${engine.blondingFraction}`);
});
