import { ROAST_PRESETS } from '../config/presets.js';
import { PARAM_LIMITS } from '../engine/state.js';

export class ControlsManager {
  constructor(stateManager) {
    this.sm = stateManager;

    this.panel = document.getElementById('controls-panel');
    this.pullButton = document.getElementById('btn-pull-shot');
    this.resetButton = document.getElementById('btn-reset');

    this.sliders = {
      dose: document.getElementById('slider-dose'),
      grind: document.getElementById('slider-grind'),
      temperature: document.getElementById('slider-temp'),
      pressure: document.getElementById('slider-pressure'),
      targetYield: document.getElementById('slider-yield')
    };

    this.readouts = {
      dose: document.getElementById('val-dose'),
      grind: document.getElementById('val-grind'),
      temperature: document.getElementById('val-temp'),
      pressure: document.getElementById('val-pressure'),
      targetYield: document.getElementById('val-yield')
    };

    this.presetButtons = document.querySelectorAll('.preset-btn');

    this.bindEvents();
    this.syncFromState();
  }

  bindEvents() {
    // 1. Slider inputs
    for (const [param, slider] of Object.entries(this.sliders)) {
      if (!slider) continue;

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateReadout(param, val);
      });

      slider.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        this.sm.setParameters({ [param]: val, preset: 'custom' });
        this.updateActivePresetHighlight('custom');
      });
    }

    // 2. Stepper buttons (+ and -)
    document.querySelectorAll('.stepper-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const param = btn.dataset.param;
        const dir = parseInt(btn.dataset.dir, 10);
        if (!param || !this.sliders[param]) return;

        const limits = PARAM_LIMITS[param];
        const currentVal = parseFloat(this.sliders[param].value);
        const nextVal = Math.min(limits.max, Math.max(limits.min, currentVal + dir * limits.step));

        this.sliders[param].value = nextVal;
        this.updateReadout(param, nextVal);
        this.sm.setParameters({ [param]: nextVal, preset: 'custom' });
        this.updateActivePresetHighlight('custom');
      });
    });

    // 3. Preset selectors
    this.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        if (ROAST_PRESETS[presetKey]) {
          this.applyPreset(presetKey);
        }
      });
    });

    // 4. Pull Shot button
    if (this.pullButton) {
      this.pullButton.addEventListener('click', () => {
        this.handlePullAction();
      });
    }

    // 5. Reset button
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.sm.reset();
      });
    }

    // 6. Listen for state changes from StateManager
    this.sm.subscribe('stateChange', (data) => {
      if (data.currentState === 'PRE_INFUSION' || data.currentState === 'EXTRACTING') {
        this.lockControls(true);
        this.setPullButtonMode('STOP_SHOT');
      } else {
        this.lockControls(false);
        this.setPullButtonMode('PULL_SHOT');
      }
    });

    this.sm.subscribe('parameterChange', () => {
      this.syncFromState();
    });
  }

  updateReadout(param, val) {
    if (!this.readouts[param]) return;
    if (param === 'grind') {
      this.readouts[param].textContent = `${Math.round(val)} µm`;
    } else if (param === 'temperature') {
      this.readouts[param].textContent = `${val.toFixed(1)} °C`;
    } else if (param === 'pressure') {
      this.readouts[param].textContent = `${val.toFixed(1)} bar`;
    } else {
      this.readouts[param].textContent = `${val.toFixed(1)} g`;
    }
  }

  syncFromState() {
    const params = this.sm.getParameters();
    for (const [key, slider] of Object.entries(this.sliders)) {
      if (slider && params[key] !== undefined) {
        slider.value = params[key];
        this.updateReadout(key, params[key]);
      }
    }
    this.updateActivePresetHighlight(params.preset || 'custom');
  }

  applyPreset(presetKey) {
    const preset = ROAST_PRESETS[presetKey];
    if (!preset) return;

    this.sm.setParameters({
      dose: preset.dose,
      grind: preset.grind,
      temperature: preset.temperature,
      pressure: preset.pressure,
      targetYield: preset.targetYield,
      dwellMultiplier: preset.dwellMultiplier,
      preset: presetKey
    });

    this.syncFromState();
  }

  updateActivePresetHighlight(presetKey) {
    this.presetButtons.forEach((btn) => {
      if (btn.dataset.preset === presetKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  lockControls(isLocked) {
    if (!this.panel) return;

    if (isLocked) {
      this.panel.classList.add('controls-locked');
      // Disable inputs inside panel except pull button
      this.panel.querySelectorAll('input, button:not(#btn-pull-shot)').forEach((el) => {
        el.disabled = true;
      });
    } else {
      this.panel.classList.remove('controls-locked');
      this.panel.querySelectorAll('input, button').forEach((el) => {
        el.disabled = false;
      });
    }
  }

  setPullButtonMode(mode) {
    if (!this.pullButton) return;

    if (mode === 'STOP_SHOT') {
      this.pullButton.classList.remove('btn-primary');
      this.pullButton.classList.add('btn-danger');
      this.pullButton.innerHTML = '&#9632; STOP SHOT';
    } else {
      this.pullButton.classList.remove('btn-danger');
      this.pullButton.classList.add('btn-primary');
      this.pullButton.innerHTML = '&#9654; PULL SHOT (SPACE)';
    }
  }

  handlePullAction() {
    if (this.sm.isRunning()) {
      // Trigger stop shot -> transitions to EVALUATING
      this.sm.transitionTo('EVALUATING', { manualStop: true });
    } else {
      // Trigger pull shot -> transitions to PRE_INFUSION
      this.sm.transitionTo('PRE_INFUSION');
    }
  }
}
