# Goldfish Review Report: Stage 5 Initial Zoom Out Review

**Target:** `docs/designs/espresso_simulator.md` (`Lines 1-556`)
**Deliverable File:** `zoom_out_report.md`
**Document Standards:** `zoom-out-standard.md`
**Goldfish Context:** `concepts_brief.md`

---

## Reviewer Status

| Reviewer | Status |
| :--- | :--- |
| `egm-zoom-out` | completed |
| `egm-inventive-catalyst` | completed |

---

## Executive Summary & Severity Breakdown

The proposed design specification for **EspressoLab** (`docs/designs/espresso_simulator.md`) establishes a clean, zero-dependency, client-side educational architecture based on Darcy's porous bed physics, decoupled fixed-step accumulation, and dual-layer rendering (HTML5 Canvas + SVG).

The audit identified **0 Blockers**, **3 Major Findings**, and **5 Nits**:
* **🔴 Blockers:** 0
* **🟡 Majors:** 3 (Missing Graph component in module inventory, False compromise on mid-shot pressure profiling, Temporal sampling aliasing on high-refresh displays)
* **🟢 Nits:** 5 (Premature Canvas particle pool optimization, Redundant FSM `RESET` state, Altitude drop JS loop in technical plan, Meta-circular PRD file entry, Flavor radar kinetic resolution)

---

## Prioritized Findings

### 1. Missing Component Specification for 780px Extraction Graph HUD - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Section 6 Viewport Budgeting (Lines 378–383) vs Section 1 Architecture & Detailed Implementation Plan (Lines 112–132, 424–441)
* **Discrepancy Description:** The ASCII layout and Viewport Budget explicitly allocate a major lower-deck subsystem:
  ```text
  | BARISTA COACH CARD (500px) | EXTRACTION GRAPH HUD (780px) |
  |                            | Yield (g) & Flow Rate (g/s) vs Time |
  |                            | [--- Actual Yield Curve ] |
  |                            | [... Ghost Target Zone ] |
  ```
  However, in the High-Level Architecture component topology (`js/**`) and the Detailed Implementation Plan file inventory, **no module is defined to render or manage this time-series extraction graph**. Only `canvasStream.js`, `svgGauges.js`, `flavorRadar.js`, and `controls.js` are specified.
* **Rationale & Recommendation:** This creates an architectural gap between visual layout commitments and component inventory. Either:
  1. Formally add `js/ui/extractionGraph.js` to the architecture with an explicit contract (e.g. SVG path generation for real-time yield and flow curves), OR
  2. Explicitly delegate graph rendering to `svgGauges.js`, OR
  3. If a real-time extraction graph is non-essential for initial MVP dial-in pedagogy, remove it from the layout budget to adhere to YAGNI and reduce visual clutter.

---

### 2. False Compromise on Mid-Shot Pressure Profiling via Monolithic Parameter Locking - Severity: 🟡 Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Technical Plan Lines 56, 75, 146, 168, 306 (State Manager & Control Locking)
* **Discrepancy Description:** The design treats control locking during extraction as a blanket constraint: during `PRE_INFUSION` and `EXTRACTING`, all sliders (Dose, Grind, Temperature, Pump Pressure) are locked under a frosted glass overlay (`pointer-events: none`). While locking Dose and Grind mid-shot accurately reflects physical constraints (coffee cannot be re-ground or re-dosed once wet), locking **Pump Pressure** surrenders an essential dimension of modern espresso extraction: **active pressure profiling**.
  Advanced dial-in relies on tapering pump pressure (e.g., declining from 9 bar down to 6 bar as bed resistance degrades) to prevent late-shot channeling and bitterness. Locking pressure mid-shot accepts a false compromise between model simplicity and pedagogical authenticity.
* **Proposed Resolution (TRIZ Pattern: Segmentation):** Segment static puck preparation parameters from dynamic hydraulic actuators:
  * Keep Dose and Grind Size strictly locked during extraction.
  * Keep the Pump Pressure slider interactive (or provide a toggleable declining pressure profile preset) so baristas can experiment with dynamic flow modulation.
* **Secondary Liabilities:** Requires dynamic event listening on the pressure slider during the `EXTRACTING` state and passing variable $P_{\text{pump}}(t)$ into the Darcy integrator, slightly increasing UI state interaction during the pull.

---

### 3. Temporal Sampling Aliasing on High-Refresh Displays (120Hz / 144Hz) - Severity: 🟡 Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 212–238 (Decoupled Fixed-Step Integration Loop)
* **Discrepancy Description:** The integration loop executes physics at a fixed 60Hz (`PHYSICS_DT = 1 / 60`). However, on high-refresh rate client displays (e.g. 120Hz ProMotion MacBook displays or 144Hz monitors), `requestAnimationFrame` fires at 8.33ms or 6.94ms. When `accumulator < PHYSICS_DT`, the `while` loop skips physics stepping, yet the render functions (`canvasStream.render()` and `svgGauges.update()`) are executed unconditionally on every animation frame with a stale snapshot. On alternating frames, multiple physics steps trigger. This causes visual temporal micro-stutter (jitter in stream animation and gauge needle rotation).
* **Proposed Resolution (TRIZ Pattern: Dynamics / Preliminary Action):** Decouple visual rendering cadence from the physics accumulator using an interpolation alpha:
  $$\alpha = \frac{\text{accumulator}}{\text{PHYSICS\_DT}}$$
  Interpolate visual stream dimensions and gauge angles between previous state $S_{t-1}$ and current state $S_t$. Alternatively, gate rendering so canvas redraws and gauge updates only execute when `accumulator >= PHYSICS_DT` has advanced the physical state.
* **Secondary Liabilities:** Requires tracking previous state snapshots (`previousTelemetry`) for interpolation, adding minor arithmetic overhead per frame.

---

### 4. Premature Optimization: Pre-Allocated Particle Pool Buffers - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 67, 403, 486 (`canvasStream.js`)
* **Discrepancy Description:** The specification repeatedly emphasizes "pre-allocated particle structures" and "particle pools with zero garbage collection allocations" to prevent GC pauses. For an espresso simulator rendering a single central quadratic Bezier cone stream and 8–12 droplet beads, modern V8/JavaScript engines easily sustain 60 FPS without GC stutter. Building a custom particle recycling pool is premature optimization that adds unnecessary memory management complexity.
* **Rationale & Recommendation:** Simplify fluid stream implementation. Standard immediate-mode Canvas path drawing with lightweight coordinate arrays will maintain 60 FPS effortlessly without custom object pool recycling abstractions.

---

### 5. Redundant FSM State `RESET` Violates State Machine Simplicity - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 295–309 (FSM Lifecycle)
* **Discrepancy Description:** The Finite State Machine includes an explicit state `RESET` that transitions immediately to `IDLE` upon clearing state (`RESET --> IDLE : State cleared`). In standard statechart semantics, a reset is an event/transition action, not an ongoing condition. Having an ephemeral transitional state adds unnecessary FSM bookkeeping.
* **Rationale & Recommendation:** Remove `RESET` as a discrete FSM state. Let the `reset()` event execute cleanup logic and transition the state directly to `IDLE`.

---

### 6. Altitude Drop: Low-Level JS Implementation Inlined in Architecture Section - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 215–238 (Technical Plan: Decoupled Fixed-Step Integration Loop)
* **Discrepancy Description:** Section 2 ("Technical Plan") embeds 24 lines of verbatim JavaScript code (`let accumulator = 0; function animationFrame(...)`) detailing loop variables and frame delta clamping. This constitutes an altitude drop into implementation weeds, and the exact same mechanics are re-described in Section 444–522.
* **Rationale & Recommendation:** Raise altitude to the conceptual/architectural level. Describe the decoupled integration timing model with mathematical contracts and sequence diagrams, deferring concrete loop implementation variables to the Detailed Implementation Plan or code repository.

---

### 7. Meta-Circular Self-Reference in File Inventory - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 439 (File Inventory Table)
* **Discrepancy Description:** Line 439 lists `docs/designs/espresso_simulator.md` with action `Create` as a deliverable of the implementation plan inside `docs/designs/espresso_simulator.md` itself. This is a redundant copy-paste artifact from the preliminary design draft.
* **Rationale & Recommendation:** Remove `docs/designs/espresso_simulator.md` from the post-design software implementation file table. The PRD is the specification describing the implementation, not a source code artifact to be built during implementation.

---

### 8. Flavor Radar Real-Time Animation Contradiction (Resolution for Open Question 2) - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 65–66 (Open Question 2) & Lines 267–288 (`flavorRadar.js`)
* **Discrepancy Description:** Open Question 2 leaves unresolved whether the flavor radar should animate during extraction or display only at the end. Evaluating the sensory equations ($S, B, D, W, C$) continuously during early shot extraction ($t < 15\text{s}$) produces jarring, distorted polygons because $EY\%$ is under $10\%$, projecting severe sourness and zero sweetness which confuses users before the beverage has even finished brewing.
* **Proposed Resolution (TRIZ Pattern: Preliminary Action & Inversion):** Resolve Open Question 2 deterministically:
  * During extraction ($t < t_{\text{end}}$), display a live 1D extraction gauge / progress bar indicating current brew ratio and EY% trajectory toward the target zone.
  * Keep the 5-axis Flavor Radar in a dimmed "Predictive / Ghost" state during the pull, animating into the final crisp sensory polygon only upon shot termination (`EVALUATING` state).
* **Secondary Liabilities:** Requires managing a two-phase display state in `flavorRadar.js` (predictive/dormant during pull vs active evaluation post-shot).

---

## Actionable Recommendations for Resolution Phase

1. **Clarify Telemetry Graph:** In Section 1 and Section 4, explicitly add `js/ui/extractionGraph.js` or fold graph rendering into `svgGauges.js` to back the 780px HUD layout.
2. **Enable Dynamic Pressure Profiling:** Segment control locking to permit real-time pump pressure modulation during extraction.
3. **Refine Render Timing:** Apply interpolation $\alpha$ or tick-gated redraws to ensure smooth visual frame pacing across 60Hz, 120Hz, and 144Hz displays.
4. **Clean Implementation Artifacts:** Prune inlined code weeds in Section 2, drop the ephemeral `RESET` FSM state, and remove the self-referential file inventory row.
