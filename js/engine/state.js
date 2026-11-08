export const STATES = {
  IDLE: 'IDLE',
  PRE_INFUSION: 'PRE_INFUSION',
  EXTRACTING: 'EXTRACTING',
  EVALUATING: 'EVALUATING'
};

export const PARAM_LIMITS = {
  dose: { min: 14.0, max: 22.0, step: 0.5 },
  grind: { min: 200, max: 500, step: 5 },
  temperature: { min: 88.0, max: 96.0, step: 0.5 },
  pressure: { min: 6.0, max: 12.0, step: 0.5 },
  targetYield: { min: 24.0, max: 50.0, step: 1.0 }
};

export class StateManager {
  constructor(initialParams = {}) {
    this.currentState = STATES.IDLE;
    this.listeners = new Map();

    this.params = {
      dose: 18.0,
      grind: 340,
      temperature: 93.0,
      pressure: 9.0,
      targetYield: 36.0,
      dwellMultiplier: 1.0,
      preset: 'medium'
    };

    this.setParameters(initialParams);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
    }
  }

  getState() {
    return this.currentState;
  }

  isRunning() {
    return this.currentState === STATES.PRE_INFUSION || this.currentState === STATES.EXTRACTING;
  }

  setParameters(newParams = {}) {
    const updated = { ...this.params };

    for (const [key, val] of Object.entries(newParams)) {
      if (typeof val === 'number' && PARAM_LIMITS[key]) {
        const { min, max } = PARAM_LIMITS[key];
        updated[key] = Math.min(max, Math.max(min, val));
      } else if (key === 'preset' || key === 'dwellMultiplier') {
        updated[key] = val;
      }
    }

    this.params = updated;
    this.emit('parameterChange', this.params);
    return this.params;
  }

  getParameters() {
    return { ...this.params };
  }

  transitionTo(nextState, context = {}) {
    const prev = this.currentState;
    if (!Object.values(STATES).includes(nextState)) {
      throw new Error(`Invalid state transition to: ${nextState}`);
    }

    this.currentState = nextState;
    this.emit('stateChange', {
      previousState: prev,
      currentState: nextState,
      params: this.getParameters(),
      ...context
    });

    if (nextState === STATES.EVALUATING) {
      this.emit('shotComplete', context);
    }
  }

  reset() {
    const prev = this.currentState;
    this.currentState = STATES.IDLE;
    this.emit('stateChange', {
      previousState: prev,
      currentState: STATES.IDLE,
      params: this.getParameters(),
      isReset: true
    });
    this.emit('reset');
  }
}
