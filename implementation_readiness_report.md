# Stage 9 Implementation Readiness Review: Detailed Implementation Plan

**Target:** `docs/designs/espresso_simulator.md` (Lines 422–555)
**Standard:** `/home/vinayvyas/.gemini/config/plugins/egm/resources/document_standards/implementation-readiness-standard.md`
**Context:** `concepts_brief.md`
**Deliverable:** `implementation_readiness_report.md`

---

## Reviewer Status

| Reviewer | Status |
| :--- | :--- |
| `egm-implementation-readiness` | completed |
| `egm-codebase-details` | completed |
| `egm-style` | completed |

---

## Executive Summary & Severity Breakdown

The Detailed Implementation Plan (Section 422–555) was audited against the **Implementation Readiness Standard** (the "Zero-Decision Rule", Phasing & Checkpoints, File Boundaries, Actionable Steps, and Test Plan), alongside codebase technical depth and stylistic consistency. 

While the architectural topology and module breakdown are clean and modular, the plan currently **fails** the Zero-Decision Rule and Implementation Readiness Standard due to:
1. **Total absence of a Test Plan** (zero test cases, zero test files, zero automated verification commands).
2. **Missing Extraction Graph UI Component** (the $780\text{px}$ graph allocated in Section 6 is completely absent from the file inventory, module contracts, and execution phases).
3. **Missing Empirical Physical Calibration Constants** ($k_{\text{grain}}$, $k_{\text{dwell}}$) and dynamic mathematical equations for $EY\%(t)$ and $TDS\%(t)$.

* 🔴 **Blockers:** 3
* 🟡 **Major:** 6
* 🟢 **Nits:** 3

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Total Absence of Test Plan and Automated Verification Steps - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 422–555 (Entire Implementation Plan)
* **Discrepancy Description:** 
  The *Implementation Readiness Standard* explicitly mandates:
  > *"Test Plan: Specific test cases (happy path and edge cases) that must be implemented."*
  > *"Each phase must leave the codebase in a stable, buildable, and testable state."*
  
  Section 422–555 contains **zero** test specifications, zero test files (e.g., `tests/physics.test.js`, `tests/coach.test.js`, `tests/fsm.test.js`), zero test assertions, and zero automated verification scripts. An implementer or fresh AI agent has no guidance or tooling to verify:
  1. Darcy fluid flow integration and mass conservation invariant down to $\pm 0.01\text{g}$.
  2. Pre-infusion dwell delay timing across differing dose/grind inputs.
  3. FSM transition rules and illegal state rejection.
  4. Flavor radar 5-axis coordinate boundary math ($[0.0, 1.0]$ clamping).
  5. Barista Coach diagnostic decision tree priority order.
* **Rationale & Recommendation:** 
  Add a dedicated **Test Plan & Verification Matrix** subsection to Section 422–555 detailing:
  - A lightweight, zero-dependency Node.js test runner (`node --test tests/*.test.js` using Node's native test runner `node:test` and `node:assert`).
  - Unit test cases for `physics.js` (mass conservation $\sum Q \cdot \Delta t = Y$, Darcy steady flow rate at baseline $340\mu\text{m}$, erosion resistance decay).
  - Unit test cases for `coach.js` covering all branches (Gusher $<22\text{s}$, Choked $>35\text{s}$, Ristretto $<1:1.85$, Lungo $>1:2.35$, Cold Temp $<91.5^\circ\text{C}$, God Shot balanced).
  - Explicit test commands for each implementation phase checkpoint.

---

### 2. Missing Extraction Graph UI Component in Inventory and Contracts - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-implementation-readiness` / `egm-codebase-details`
* **Affected Scope:** Lines 426–440 (File Inventory), Lines 495–508 (Module Contracts), Lines 527–548 (Execution Phases)
* **Discrepancy Description:** 
  In the Layout Budget (Lines 378–382), the lower-right dashboard dedicates a major $780\text{px} \times 260\text{px}$ panel to:
  `EXTRACTION GRAPH HUD (780px) | Yield (g) & Flow Rate (g/s) vs Time | [--- Actual Yield Curve] [... Ghost Target Zone]`.
  Furthermore, `state.js` (Line 476) specifies `recordTelemetryPoint(point): Appends data point to time-series history buffer for the extraction chart`, and Line 309 mentions resetting graph buffers.
  
  However, this component is **completely missing** from:
  1. File Inventory (Lines 426–440): No graph/chart file is declared (e.g. `js/ui/extractionChart.js`).
  2. Module Interface & Contract Specifications (Lines 444–521): Neither `svgGauges.js` nor `canvasStream.js` specifies rendering the yield/flow curves or ghost target zones.
  3. Step-by-Step Execution Sequence (Lines 527–548): Phase 4 only lists `canvasStream.js`, `svgGauges.js`, and `flavorRadar.js`.
  
  This leaves a massive architectural and design void for the implementer, violating the Zero-Decision Rule.
* **Rationale & Recommendation:** 
  Either declare `js/ui/extractionChart.js` (or explicitly assign the graph rendering responsibility to `svgGauges.js` or `canvasStream.js`):
  - Add `js/ui/extractionChart.js` to the File Inventory.
  - Define `class ExtractionChartRenderer`: `constructor(canvasOrSvgElement)`, `render(historyBuffer)`, `drawGhostTargetCurve()`, `reset()`.
  - Add `js/ui/extractionChart.js` to Phase 4 in the Mermaid diagram and phase execution steps.

---

### 3. Missing Empirical Physics Constants ($k_{\text{grain}}$, $k_{\text{dwell}}$) and Dynamic $EY\% / TDS\%$ Formulas - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 458–469 (`js/engine/physics.js`)
* **Discrepancy Description:** 
  1. Line 460 states that `PhysicsEngine` constructor initializes `grain constant kgrain` and Line 461 pre-computes $R_0$ and $t_{\text{dwell}}$. However, the **exact numerical value** of $k_{\text{grain}}$ is nowhere defined. Line 200 states it is "an empirical resistance scaling constant calibrated to yield $1.4\text{ g/s}$ at 340 µm, 18g dose, and 9 bar", but fails to provide the scalar value (approx $k_{\text{grain}} \approx 1.83 \times 10^7$).
  2. The constant $k_{\text{dwell}}$ (Line 203) is also missing its numerical value ($k_{\text{dwell}} \approx 85.0$) and its interaction with `roastPreset.dwellMultiplier` is undefined.
  3. Line 467 states that `step(dt)` "Computes instantaneous Extraction Yield $EY\%(t)$ and Total Dissolved Solids $TDS\%(t)$", but gives **no mathematical formula** for how $TDS\%(t)$ and $EY\%(t)$ evolve dynamically slice-by-slice.
  4. Line 468 includes `blondingFraction` in the telemetry snapshot, but omits the formula mapping time/yield/TDS to `blondingFraction` ($0.0 \rightarrow 1.0$).
* **Rationale & Recommendation:** 
  Provide the exact closed-form constants and formulas directly in the `physics.js` contract specification:
  - $k_{\text{grain}} = 1.83 \times 10^7\text{ Pa}\cdot\text{s}\cdot\mu\text{m}^{2.6} / (\text{g}^{1.25}\cdot\text{m})$ such that at baseline (18.0g, 340µm, 9 bar, $93^\circ\text{C}$), $R_0 = 5.28 \times 10^9\text{ m}^{-1}$ yielding $Q_0 \approx 1.40\text{ g/s}$.
  - $t_{\text{dwell}} = 85.0 \times \left(\frac{\text{Dose}}{\text{Grind}}\right) \times \left(\frac{9.0}{P_{\text{pump}}}\right)^{0.5} \times \text{dwellMultiplier}$.
  - Extraction yield formula: $EY\%(t) = \text{clamp}\left(\frac{Y(t) \cdot TDS_{\text{avg}}(t)}{\text{Dose}} \times 100, 0.0, 28.0\right)$ where instantaneous solubles concentration decays exponentially: $C_{\text{sol}}(t) = C_0 \cdot \exp\left(-\gamma \cdot \frac{Y(t)}{\text{Dose}}\right)$, with $C_0 \approx 14.0\%$ and $\gamma \approx 0.65$.
  - `blondingFraction` $= \text{clamp}\left(1.0 - \frac{C_{\text{sol}}(t)}{C_0}, 0.0, 1.0\right)$.

---

### 4. Missing In-Memory Roast Calibration Dictionaries in `presets.js` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details` / `egm-implementation-readiness`
* **Affected Scope:** Lines 446–457 (`js/config/presets.js`)
* **Discrepancy Description:** 
  The interface contract in Lines 446–457 lists the TypeScript-style types and allowed parameter ranges (e.g., `dose: number (grams, 14.0–22.0)`), but completely omits the concrete numerical preset dictionaries for `light`, `medium`, and `dark`.
  An implementer cannot execute Phase 2 without inventing arbitrary values for Light Ethiopian and Dark Italian presets, risking broken dial-in physics.
* **Rationale & Recommendation:** 
  Specify the exact baseline object literals in the contract:
  ```javascript
  export const ROAST_PRESETS = {
    light: {
      name: "Light Ethiopian (Washed)",
      dose: 19.5,
      grind: 310,
      temperature: 94.5,
      pressure: 9.0,
      targetYield: 45.0,
      dwellMultiplier: 1.25,
      description: "Dense high-altitude bean requiring finer grind, higher temp, and extended yield."
    },
    medium: {
      name: "Medium Colombia (Huila)",
      dose: 18.0,
      grind: 340,
      temperature: 93.0,
      pressure: 9.0,
      targetYield: 36.0,
      dwellMultiplier: 1.00,
      description: "Balanced baseline profile with classic caramel sweetness and stone-fruit acidity."
    },
    dark: {
      name: "Dark Italian Roast",
      dose: 16.5,
      grind: 380,
      temperature: 90.0,
      pressure: 8.5,
      targetYield: 30.0,
      dwellMultiplier: 0.80,
      description: "Porous, brittle cell structure demanding coarser grind, lower temp, and tight yield."
    }
  };
  ```

---

### 5. Canvas Rendering Coordinate System, Anchor Offsets, and Particle Pool Missing - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 484–494 (`js/ui/canvasStream.js`)
* **Discrepancy Description:** 
  `canvasStream.js` specifies high-frequency fluid rendering across a $460 \times 440\text{px}$ stage, but fails to define the spatial geometry and anchor points:
  1. Portafilter rim anchor coordinates (e.g. Center $X = 230$, Top $Y = 30$, Width $= 160\text{px}$, Basket Depth $= 35\text{px}$).
  2. Pre-infusion droplet bead coordinates (radial distribution across the basket perforated plate).
  3. Stream quadratic Bezier curve coordinates: start point $(230, 65)$, control point $(230, 180)$, cup arrival point $(230, 310)$.
  4. Collection cup bounding box: $X = 160\text{ to } 300$ ($140\text{px}$ wide), $Y = 280\text{ to } 410$, with dynamic liquid fill height and crema foam thickness ($8\text{mm} \approx 20\text{px}$).
  5. Particle pool capacity (e.g. pre-allocated array of 60 particle objects `{ x, y, vx, vy, radius, alpha, color }` to prevent GC pauses).
  Without these coordinates, any two implementers will construct completely misaligned rendering scenes.
* **Rationale & Recommendation:** 
  Document the exact Canvas coordinate budget and particle structure in the `canvasStream.js` contract specification.

---

### 6. Undefined DOM Element IDs and Selectors in `SVGGaugeManager` and `ControlsManager` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details` / `egm-implementation-readiness`
* **Affected Scope:** Lines 495–502 (`svgGauges.js`), Lines 509–514 (`controls.js`)
* **Discrepancy Description:** 
  `SVGGaugeManager` requires `constructor(domRefs)`, but does not specify the property keys or expected DOM IDs. Similarly, `ControlsManager` attaches event listeners to sliders, steppers, and preset tabs, but does not define the canonical DOM element IDs declared in `index.html`.
  If `index.html` creates `#input-grind` but `controls.js` queries `#grind-slider`, the application will crash on bootstrap.
* **Rationale & Recommendation:** 
  Specify the exact DOM ID contract table linking `index.html` markup to the UI managers:
  - Inputs: `#slider-dose`, `#slider-grind`, `#slider-temp`, `#slider-pressure`, `#val-dose`, `#val-grind`, `#val-temp`, `#val-pressure`.
  - Steppers: `[data-action="step"][data-target="dose"][data-dir="+1"]`, etc.
  - Controls: `#btn-pull-shot`, `#btn-reset`, `[data-roast-preset="light|medium|dark"]`.
  - Gauges: `#needle-pressure`, `#needle-flow`, `#readout-time`, `#readout-yield`, `#readout-ey`.
  - Radar: `#radar-active-polygon`, `#radar-ghost-polygon`.
  - Lock Overlay: `#lock-shroud`.

---

### 7. FSM State Enum and Lifecycle Discrepancy Across Sections (`RESET` State vs Method) - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details` / `egm-style`
* **Affected Scope:** Line 432 vs Line 472 vs Lines 301–303 (`js/engine/state.js`)
* **Discrepancy Description:** 
  - In Line 432: `state.js` manages transitions: `(IDLE, PRE_INFUSION, EXTRACTING, EVALUATING, RESET)`.
  - In Line 472: `STATES = { IDLE: 'IDLE', PRE_INFUSION: 'PRE_INFUSION', EXTRACTING: 'EXTRACTING', EVALUATING: 'EVALUATING' }` (omits `RESET`).
  - In Lines 301–303: The state diagram has `EVALUATING --> RESET : Click Reset` and `RESET --> IDLE : State cleared`.
  - In Line 234: `app.js` checks `stateManager.isRunning()`, a method not declared in the `StateManager` interface.
* **Rationale & Recommendation:** 
  Resolve the FSM state definition:
  - Establish whether `RESET` is a transient state or an imperative transition method `reset()`. The cleaner FSM pattern has 4 core states (`IDLE`, `PRE_INFUSION`, `EXTRACTING`, `EVALUATING`), where calling `reset()` clears telemetry and transitions from `EVALUATING` directly back to `IDLE`.
  - Add missing query methods to `StateManager`: `isRunning()` (returns `state === STATES.PRE_INFUSION || state === STATES.EXTRACTING`) and `getState()`.

---

### 8. Incomplete Return Contract and Missing Dictionaries in `coach.js` - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 478–483 (`js/engine/coach.js`), Lines 318–352
* **Discrepancy Description:** 
  Line 481 defines the return signature of `evaluateShot(metrics)` as:
  `{ badgeClass: string, badgeText: string, title: string, diagnosis: string, action: string, tasteNotes: string[] }`.
  However, Section 5 (Lines 318–352) only provides `DIAGNOSIS` and `ACTION` text. It leaves `badgeClass` (CSS class names for badge colors), `badgeText`, `title`, and the `tasteNotes` arrays completely undefined.
* **Rationale & Recommendation:** 
  Specify the exact dictionary objects for all branches in `coach.js`:
  - Gusher: `badgeClass: "badge-danger"`, `badgeText: "GUSHER"`, `title: "Fast / Channeling"`, `tasteNotes: ["Sour", "Astringent", "Watery", "Weak Crema"]`.
  - Choked: `badgeClass: "badge-danger"`, `badgeText: "CHOKED"`, `title: "Restricted Flow"`, `tasteNotes: ["Harsh Bitter", "Dry", "Burnt", "Muddy"]`.
  - Ristretto: `badgeClass: "badge-warning"`, `badgeText: "UNDER-EXTRACTED"`, `title: "Acid Dominant"`, `tasteNotes: ["Sharp Citric", "Viscous", "Undeveloped Sweetness"]`.
  - Lungo: `badgeClass: "badge-warning"`, `badgeText: "OVER-EXTRACTED"`, `title: "Hollow / Bitter"`, `tasteNotes: ["Woody", "Tannic", "Dry Aftertaste", "Thin Crema"]`.
  - Cold Temp: `badgeClass: "badge-warning"`, `badgeText: "UNDER-DEVELOPED"`, `title: "Low Extraction Energy"`, `tasteNotes: ["Sour Lemon", "Grassy", "Unbalanced"]`.
  - Scorched: `badgeClass: "badge-warning"`, `badgeText: "SCORCHED"`, `title: "Thermal Astringency"`, `tasteNotes: ["Bitter Cocoa", "Acrid", "Lingering Ash"]`.
  - God Shot: `badgeClass: "badge-success"`, `badgeText: "BALANCED"`, `title: "God Shot"`, `tasteNotes: ["Rich Milk Chocolate", "Bright Stone Fruit", "Syrupy Body", "Sweet Cane Finish"]`.

---

### 9. Unspecified Phasing Checkpoints and Concrete Verification Acceptance Criteria - Severity: 🟡 Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 524–555 (Step-by-Step Execution Sequence)
* **Discrepancy Description:** 
  The *Implementation Readiness Standard* requires:
  > *"Phasing & Checkpoints: The plan must partition the work into logical, incremental phases. Each phase must leave the codebase in a stable, buildable, and testable state."*
  
  Phases 1 through 7 currently list files to create, but provide **no verifiable checkpoint criteria** to confirm a phase is complete and healthy before starting the next:
  - Phase 1: How does the developer verify the layout works? (e.g. "Load `index.html` in browser; verify $1280 \times 850$ container centers and scales on resize without scrollbars").
  - Phase 2: How does the developer verify physics without a UI? (e.g. "Run `node tests/physics.test.js` verifying mass conservation $\pm 0.01\text{g}$ and baseline $1.4\text{ g/s}$ flow").
  - Phase 3: How does the developer test the FSM clock?
* **Rationale & Recommendation:** 
  Add a concise `Verification Checkpoint` bullet to every phase defining exact terminal commands or browser inspection steps.

---

### 10. Circular File Inventory Entry and Phase 7 Task (`docs/designs/espresso_simulator.md`) - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Line 439 (File Inventory), Line 554 (Phase 7 Execution)
* **Discrepancy Description:** 
  Line 439 lists `docs/designs/espresso_simulator.md` as a file to "Create" with rationale: "Canonical design specification and product requirements document (PRD) finalized from this design draft." Line 554 sets Phase 7 task: "Generate canonical specification at `docs/designs/espresso_simulator.md`."
  This document is the PRD itself, authored prior to implementation. Having the implementation phase generate its own design specification is an artifact leakage.
* **Rationale & Recommendation:** 
  Remove `docs/designs/espresso_simulator.md` from the Implementation Plan's File Inventory and Phase 7 steps. Phase 7 should focus exclusively on running the end-to-end test suite and writing `README.md`.

---

### 11. Module Export Syntax and Class Suffix Consistency - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style` / `egm-codebase-details`
* **Affected Scope:** Lines 444–521
* **Discrepancy Description:** 
  Filenames use camelCase (`canvasStream.js`, `svgGauges.js`, `flavorRadar.js`, `controls.js`), while their exported classes use descriptive PascalCase (`CanvasStreamRenderer`, `SVGGaugeManager`, `FlavorRadarRenderer`, `ControlsManager`). However, the contract does not explicitly state whether exports are named (`export class ...`) or default (`export default class ...`).
* **Rationale & Recommendation:** 
  Explicitly standardize on named ES6 module exports across all files (e.g. `export class CanvasStreamRenderer { ... }`, `export class PhysicsEngine { ... }`) to eliminate ambiguity in `app.js` import statements.

---

### 12. Mermaid Diagram Step Label Alignment - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 527–534
* **Discrepancy Description:** 
  In the Mermaid diagram (Line 531), Phase 5 is titled `P5["Phase 5: Controls & Presets<br/>(controls.js)"]`. However, presets are actually implemented in Phase 2 (`presets.js`). Phase 5 only wires DOM controls and keyboard shortcuts.
* **Rationale & Recommendation:** 
  Rename Phase 5 node in the Mermaid chart to: `P5["Phase 5: Controls & Keyboard Wiring<br/>(controls.js)"]`.

---

## Conclusion & Next Actions

The Detailed Implementation Plan has a strong foundational structure, but requires remediation before code execution begins.

### Recommended Resolution Checklist:
1. [ ] **Add Test Plan & Automated Harness**: Add Section 4 (Test Plan) specifying `node:test` test suites for physics, coach heuristics, and FSM lifecycle.
2. [ ] **Add Extraction Graph Component**: Add `js/ui/extractionChart.js` to inventory, contract specs, and Phase 4.
3. [ ] **Specify Physical Constants & Equations**: Add explicit numerical values for $k_{\text{grain}}$ ($1.83 \times 10^7$), $k_{\text{dwell}}$ ($85.0$), and the dynamic $C_{\text{sol}}(t)$, $TDS\%(t)$, and $EY\%(t)$ formulas.
4. [ ] **Define Roast Preset Dictionaries**: Add concrete object literals for Light, Medium, and Dark roasts in `presets.js`.
5. [ ] **Define Canvas Coordinates & Particle Pool**: Provide exact coordinate anchors and pre-allocated particle array specs for `canvasStream.js`.
6. [ ] **Define DOM ID Contracts**: Provide the ID mapping table between `index.html` and UI classes.
7. [ ] **Define Coach Return Dictionaries**: Provide complete text and CSS badge dictionaries for `coach.js`.
8. [ ] **Add Phase Verification Criteria**: Add checkpoint verification commands for Phases 1–7.
