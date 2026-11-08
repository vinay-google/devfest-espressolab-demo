import { PhysicsEngine } from './engine/physics.js';
import { StateManager, STATES } from './engine/state.js';
import { evaluateShot } from './engine/coach.js';
import { CanvasStreamRenderer } from './ui/canvasStream.js';
import { SVGGaugeManager } from './ui/svgGauges.js';
import { ShotGraphRenderer } from './ui/shotGraph.js';
import { FlavorRadarRenderer } from './ui/flavorRadar.js';
import { ControlsManager } from './ui/controls.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State & Physics
  const stateManager = new StateManager();
  const physicsEngine = new PhysicsEngine(stateManager.getParameters());

  // 2. Initialize Visual Renderers
  const canvasElement = document.getElementById('canvas-stream');
  const canvasStream = new CanvasStreamRenderer(canvasElement);

  const svgGauges = new SVGGaugeManager();

  const graphSvg = document.getElementById('shot-graph-svg');
  const shotGraph = new ShotGraphRenderer(graphSvg);

  const flavorRadar = new FlavorRadarRenderer();

  // 3. Initialize Controls
  const controlsManager = new ControlsManager(stateManager);

  // 4. Fixed-Delta Animation & Physics Accumulator Loop
  const PHYSICS_DT = 1 / 60; // 60Hz (16.667ms)
  let accumulator = 0;
  let lastTime = performance.now();
  let animationFrameId = null;

  function runLoop(currentTime) {
    // Spiral of death mitigation: cap frameDelta to max 100ms
    const frameDelta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    accumulator += frameDelta;

    const isRunning = stateManager.isRunning();

    if (isRunning) {
      while (accumulator >= PHYSICS_DT) {
        physicsEngine.step(PHYSICS_DT);
        accumulator -= PHYSICS_DT;

        const telemetry = physicsEngine.getTelemetry();
        const params = stateManager.getParameters();

        // Check for extraction transition
        if (stateManager.getState() === STATES.PRE_INFUSION && telemetry.time >= physicsEngine.t_dwell) {
          stateManager.transitionTo(STATES.EXTRACTING);
        }

        // Check termination conditions: Target Yield reached or 45s safety timeout
        if (telemetry.yield >= params.targetYield || telemetry.time >= 45.0) {
          stateManager.transitionTo(STATES.EVALUATING, {
            timeout: telemetry.time >= 45.0,
            targetReached: telemetry.yield >= params.targetYield
          });
          break;
        }
      }
    } else {
      // Drain accumulator when not running
      accumulator = 0;
    }

    // Render 60 FPS graphics
    canvasStream.render(physicsEngine.getRenderSnapshot());
    svgGauges.update(physicsEngine.getTelemetrySnapshot());
    shotGraph.update(physicsEngine.getHistory());

    if (stateManager.isRunning()) {
      animationFrameId = requestAnimationFrame(runLoop);
    }
  }

  // 5. Connect State Event Handlers
  stateManager.subscribe('stateChange', (data) => {
    if (data.currentState === STATES.PRE_INFUSION) {
      physicsEngine.reset(stateManager.getParameters());
      shotGraph.reset();
      flavorRadar.reset();
      lastTime = performance.now();
      accumulator = 0;
      if (!animationFrameId || !stateManager.isRunning()) {
        animationFrameId = requestAnimationFrame(runLoop);
      }
    } else if (data.currentState === STATES.EVALUATING) {
      // Evaluate post-shot diagnostics
      const telemetry = physicsEngine.getTelemetry();
      const params = stateManager.getParameters();
      const ratio = params.dose > 0 ? telemetry.yield / params.dose : 2.0;

      const coachResult = evaluateShot({
        dose: params.dose,
        grind: params.grind,
        temperature: params.temperature,
        pressure: params.pressure,
        yield: telemetry.yield,
        shotTime: telemetry.time,
        ey: telemetry.ey,
        ratio: ratio,
        targetYield: params.targetYield
      });

      renderCoachCard(coachResult, telemetry, ratio);
      flavorRadar.update({
        ey: telemetry.ey,
        temperature: params.temperature,
        dose: params.dose,
        ratio: ratio
      });
    } else if (data.isReset) {
      physicsEngine.reset(stateManager.getParameters());
      canvasStream.reset();
      svgGauges.reset();
      shotGraph.reset();
      flavorRadar.reset();
      resetCoachCard();
    }
  });

  // 6. Barista Coach Card Renderer
  function renderCoachCard(coachResult, telemetry, ratio) {
    const badge = document.getElementById('coach-badge');
    const title = document.getElementById('coach-title');
    const diagnosis = document.getElementById('coach-diagnosis');
    const action = document.getElementById('coach-action');
    const notesList = document.getElementById('coach-notes');
    const metricsSummary = document.getElementById('coach-metrics');

    if (badge) {
      badge.className = `badge ${coachResult.badgeClass}`;
      badge.textContent = coachResult.badgeText;
    }

    if (title) title.textContent = coachResult.title;
    if (diagnosis) diagnosis.textContent = coachResult.diagnosis;
    if (action) action.textContent = coachResult.action;

    if (metricsSummary) {
      metricsSummary.textContent = `Yield: ${telemetry.yield.toFixed(1)}g | Ratio: 1:${ratio.toFixed(2)} | Time: ${telemetry.time.toFixed(1)}s | EY: ${telemetry.ey.toFixed(1)}% | TDS: ${telemetry.tds.toFixed(1)}%`;
    }

    if (notesList && coachResult.tasteNotes) {
      notesList.innerHTML = coachResult.tasteNotes.map((note) => `<li>${note}</li>`).join('');
    }
  }

  function resetCoachCard() {
    const badge = document.getElementById('coach-badge');
    const title = document.getElementById('coach-title');
    const diagnosis = document.getElementById('coach-diagnosis');
    const action = document.getElementById('coach-action');
    const notesList = document.getElementById('coach-notes');
    const metricsSummary = document.getElementById('coach-metrics');

    if (badge) {
      badge.className = 'badge badge-idle';
      badge.textContent = 'READY TO BREW';
    }
    if (title) title.textContent = 'Simulator Ready';
    if (diagnosis) diagnosis.textContent = 'Adjust input parameters or select a preset, then pull the shot.';
    if (action) action.textContent = 'Press Spacebar or click "Pull Shot" to start extraction.';
    if (metricsSummary) metricsSummary.textContent = 'Yield: 0.0g | Ratio: 1:0.00 | Time: 0.0s | EY: 0.0%';
    if (notesList) notesList.innerHTML = '';
  }

  // 7. Global Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    // Spacebar toggles shot
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      controlsManager.handlePullAction();
    }
    // R triggers reset
    if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      stateManager.reset();
    }
    // Presets 1, 2, 3
    if (e.key === '1' && e.target.tagName !== 'INPUT') controlsManager.applyPreset('light');
    if (e.key === '2' && e.target.tagName !== 'INPUT') controlsManager.applyPreset('medium');
    if (e.key === '3' && e.target.tagName !== 'INPUT') controlsManager.applyPreset('dark');
  });

  // 8. Responsive Viewport Scaling (Keep 1280x850 aspect ratio without scroll)
  function handleResize() {
    const viewport = document.getElementById('app-viewport');
    if (!viewport) return;

    const targetW = 1280;
    const targetH = 850;
    const scale = Math.min(window.innerWidth / targetW, window.innerHeight / targetH);

    viewport.style.transform = `scale(${scale})`;
    viewport.style.transformOrigin = 'top center';
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // Initial render tick
  canvasStream.render(physicsEngine.getRenderSnapshot());
  svgGauges.reset();
  resetCoachCard();
});
