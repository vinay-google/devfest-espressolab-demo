import test from 'node:test';
import assert from 'node:assert/strict';
import { StateManager, STATES } from '../js/engine/state.js';

test('StateManager - Initial state and parameters', () => {
  const sm = new StateManager();
  assert.equal(sm.getState(), STATES.IDLE);
  assert.equal(sm.isRunning(), false);

  const params = sm.getParameters();
  assert.equal(params.dose, 18.0);
  assert.equal(params.grind, 340);
  assert.equal(params.temperature, 93.0);
  assert.equal(params.pressure, 9.0);
  assert.equal(params.targetYield, 36.0);
});

test('StateManager - Valid FSM state transitions', () => {
  const sm = new StateManager();

  sm.transitionTo(STATES.PRE_INFUSION);
  assert.equal(sm.getState(), STATES.PRE_INFUSION);
  assert.equal(sm.isRunning(), true);

  sm.transitionTo(STATES.EXTRACTING);
  assert.equal(sm.getState(), STATES.EXTRACTING);
  assert.equal(sm.isRunning(), true);

  sm.transitionTo(STATES.EVALUATING);
  assert.equal(sm.getState(), STATES.EVALUATING);
  assert.equal(sm.isRunning(), false);

  sm.reset();
  assert.equal(sm.getState(), STATES.IDLE);
  assert.equal(sm.isRunning(), false);
});

test('StateManager - Clamps parameters within physical bounds', () => {
  const sm = new StateManager();

  // Test lower bounds
  sm.setParameters({
    dose: 10.0, // min 14.0
    grind: 100, // min 200
    temperature: 80.0, // min 88.0
    pressure: 2.0, // min 6.0
    targetYield: 15.0 // min 24.0
  });
  let params = sm.getParameters();
  assert.equal(params.dose, 14.0);
  assert.equal(params.grind, 200);
  assert.equal(params.temperature, 88.0);
  assert.equal(params.pressure, 6.0);
  assert.equal(params.targetYield, 24.0);

  // Test upper bounds
  sm.setParameters({
    dose: 30.0, // max 22.0
    grind: 600, // max 500
    temperature: 105.0, // max 96.0
    pressure: 18.0, // max 12.0
    targetYield: 80.0 // max 50.0
  });
  params = sm.getParameters();
  assert.equal(params.dose, 22.0);
  assert.equal(params.grind, 500);
  assert.equal(params.temperature, 96.0);
  assert.equal(params.pressure, 12.0);
  assert.equal(params.targetYield, 50.0);
});

test('StateManager - Pub/Sub event dispatching', () => {
  const sm = new StateManager();
  let stateChanged = false;
  let paramChanged = false;

  sm.subscribe('stateChange', (data) => {
    stateChanged = true;
    assert.equal(data.currentState, STATES.PRE_INFUSION);
  });

  sm.subscribe('parameterChange', (params) => {
    paramChanged = true;
    assert.equal(params.dose, 19.5);
  });

  sm.setParameters({ dose: 19.5 });
  assert.equal(paramChanged, true);

  sm.transitionTo(STATES.PRE_INFUSION);
  assert.equal(stateChanged, true);
});
