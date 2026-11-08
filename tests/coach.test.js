import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateShot } from '../js/engine/coach.js';

test('Coach - Tier 1 Priority: Choked shot detection', () => {
  const result = evaluateShot({
    dose: 20.0,
    grind: 220,
    temperature: 93.0,
    yield: 12.0,
    targetYield: 40.0,
    shotTime: 45.0,
    ey: 10.0,
    ratio: 0.6
  });

  assert.equal(result.type, 'CHOKED');
  assert.equal(result.badgeClass, 'badge-danger');
  assert.match(result.action, /coarser/i);
});

test('Coach - Tier 1 Priority: Gusher fast channeling detection', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 480,
    temperature: 93.0,
    yield: 36.0,
    targetYield: 36.0,
    shotTime: 14.0,
    ey: 14.0,
    ratio: 2.0
  });

  assert.equal(result.type, 'GUSHER');
  assert.equal(result.badgeClass, 'badge-warning');
  assert.match(result.action, /finer/i);
});

test('Coach - Tier 2 Priority: Short brew ratio (under-extracted ristretto)', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    yield: 28.0,
    targetYield: 28.0,
    shotTime: 26.0,
    ey: 16.5,
    ratio: 1.55
  });

  assert.equal(result.type, 'UNDER_EXTRACTED_RATIO');
  assert.equal(result.badgeClass, 'badge-warning');
  assert.match(result.action, /Increase target yield/i);
});

test('Coach - Tier 2 Priority: Long brew ratio (over-extracted lungo)', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    yield: 46.0,
    targetYield: 46.0,
    shotTime: 28.0,
    ey: 23.5,
    ratio: 2.55
  });

  assert.equal(result.type, 'OVER_EXTRACTED_RATIO');
  assert.equal(result.badgeClass, 'badge-warning');
  assert.match(result.action, /Decrease target yield/i);
});

test('Coach - Tier 3 Priority: Low brew temperature', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 340,
    temperature: 89.0,
    yield: 36.0,
    targetYield: 36.0,
    shotTime: 27.0,
    ey: 17.5,
    ratio: 2.0
  });

  assert.equal(result.type, 'TEMP_COLD');
  assert.equal(result.badgeClass, 'badge-info');
  assert.match(result.action, /Raise/i);
});

test('Coach - Tier 3 Priority: High brew temperature', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 340,
    temperature: 96.0,
    yield: 36.0,
    targetYield: 36.0,
    shotTime: 27.0,
    ey: 21.0,
    ratio: 2.0
  });

  assert.equal(result.type, 'TEMP_HOT');
  assert.equal(result.badgeClass, 'badge-info');
  assert.match(result.action, /Lower/i);
});

test('Coach - God Shot: Optimal balanced extraction', () => {
  const result = evaluateShot({
    dose: 18.0,
    grind: 340,
    temperature: 93.0,
    yield: 36.0,
    targetYield: 36.0,
    shotTime: 27.2,
    ey: 20.2,
    ratio: 2.0
  });

  assert.equal(result.type, 'GOD_SHOT');
  assert.equal(result.badgeClass, 'badge-success');
  assert.match(result.title, /Balanced/i);
  assert.ok(result.tasteNotes.length >= 3);
});
