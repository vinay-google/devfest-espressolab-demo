# Consolidated Goldfish Review Report: EspressoLab

**Target Document:** `docs/designs/espresso_simulator.md` (`Lines 1-555`)  
**Date:** 2026-11-06  
**Author:** Vinay Vyas  
**Review Execution Mode:** Consolidated Uninterrupted Multi-Lens Review  
**Audited Stages:** Stages 5, 6, 7, 8, and 9  

---

## Executive Summary & Stage Status

All five review stages have completed audits against their respective document standards:

| Stage | Review Scope | Reviewers & Standards | Status | Deliverable Artifact |
| :--- | :--- | :--- | :---: | :--- |
| **Stage 5: Initial Zoom Out** | Full Document (L1–555) | `egm-zoom-out`, `egm-inventive-catalyst` (`zoom-out-standard.md`) | **Completed** | `zoom_out_report.md` |
| **Stage 6: Comprehension Test** | Feature (L1–421) & Detailed (L422–555) | `egm-comprehension` (Zero assumed knowledge) | **Completed** | `comprehension_report.md` |
| **Stage 7: Critic Review** | Feature Range (L1–421) | `egm-design`, `egm-structural`, `egm-style` (`feature-spec-standard.md`) | **Completed** | `critic_report.md` |
| **Stage 8: Intermediate Zoom Out** | Full Document (L1–555) | `egm-zoom-out` (Trade-off & anti-weeds synthesis) | **Completed** | `intermediate_zoom_out_report.md` |
| **Stage 9: Implementation Readiness** | Detailed Range (L422–555) | `egm-implementation-readiness`, `egm-codebase-details`, `egm-style` (`implementation-readiness-standard.md`) | **Completed** | `implementation_readiness_report.md` |

### Consolidated Severity Breakdown
* 🔴 **Blockers:** 6
* 🟡 **Majors:** 12
* 🟢 **Nits:** 8

---

## Prioritized Consolidated Action Items

### 🔴 Blockers (Must Resolve Before Implementation)

#### 1. [BLOCKER-1] Missing Extraction Yield ($EY\%$), Total Dissolved Solids ($TDS\%$), Soluble Concentration ($C_{\text{sol}}(t)$), and `blondingFraction` Formulations
* **Source Lenses:** `egm-comprehension` (B1), `egm-design` (B2), `egm-codebase-details` (B3)
* **Affected Scope:** Lines 180–244, Lines 255, 467–468, 491
* **Finding:** While $EY\%$, $TDS\%$, $C_{\text{sol}}(t)$, and `blondingFraction` are referenced throughout the document to drive Canvas stream color grading, the 5-axis Flavor Radar, and the Barista Coach, Section 2 provides zero mathematical equations defining their calculation over time.
* **Consolidated Resolution:** Formally define the empirical exponential solubles washout proxy:
  $$C_{\text{sol}}(t) = C_0 \cdot \exp\left(-\gamma \cdot \frac{Y(t)}{\text{Dose}}\right)$$
  $$M_{\text{sol}}(t + \Delta t) = M_{\text{sol}}(t) + Q(t) \cdot \frac{C_{\text{sol}}(t)}{100} \cdot \Delta t$$
  $$EY\%(t) = \left(\frac{M_{\text{sol}}(t)}{\text{Dose}}\right) \times 100\% \quad \text{and} \quad TDS\%(t) = \left(\frac{M_{\text{sol}}(t)}{Y(t)}\right) \times 100\%$$
  $$\text{blondingFraction} = \text{clamp}\left(1.0 - \frac{C_{\text{sol}}(t)}{C_0}, 0.0, 1.0\right)$$
  Where $C_0 = 14.0\%$ and $\gamma = 0.65$.

#### 2. [BLOCKER-2] Missing Component Specification and Module Contract for 780px Extraction Graph HUD
* **Source Lenses:** `egm-zoom-out` (M1), `egm-comprehension` (B3), `egm-design` (B4), `egm-implementation-readiness` (B2)
* **Affected Scope:** Lines 112–132, Lines 378–383, Lines 426–440, Lines 527–548
* **Finding:** The Viewport layout allocates a massive $780\text{px} \times 260\text{px}$ lower panel to an `EXTRACTION GRAPH HUD` rendering real-time Yield and Flow Rate curves alongside a ghost target envelope, but no corresponding JavaScript module exists in the file inventory, module contracts, or execution sequence.
* **Consolidated Resolution:** Add `js/ui/shotGraph.js` with an explicit class contract (`ShotGraphRenderer`) that renders SVG `<path>` curves for $Y(t)$ and $Q(t)$ mapped onto the $780 \times 260\text{px}$ container with a static golden target silhouette `<polygon>`. Add to File Inventory and Phase 4.

#### 3. [BLOCKER-3] Total Absence of Test Plan and Automated Verification Steps
* **Source Lenses:** `egm-implementation-readiness` (B1)
* **Affected Scope:** Lines 422–555
* **Finding:** Section 422–555 contains zero test specifications, zero test files, and zero automated verification scripts. An implementer cannot verify mass conservation, dwell timing, or coach decision priority.
* **Consolidated Resolution:** Add a dedicated **Test Plan & Verification Matrix** subsection to Section 4 detailing a zero-dependency test suite executed via native Node.js (`node --test tests/*.test.js` using `node:test` and `node:assert`) covering `tests/physics.test.js`, `tests/coach.test.js`, and `tests/state.test.js`.

#### 4. [BLOCKER-4] Puck Resistance Decay Singularity & Division by Zero
* **Source Lenses:** `egm-design` (B3)
* **Affected Scope:** Lines 207–211
* **Finding:** In $R_{\text{bed}}(t) = R_0 \cdot [1 - \beta \cdot (Y(t)/\text{Dose})]^2$, when $Y(t)/\text{Dose} = 1/\beta \approx 3.57$, the term reaches zero, creating a division-by-zero singularity in Darcy's law ($Q \to \infty$ and yield `NaN`).
* **Consolidated Resolution:** Add a physical lower resistance clamp:
  $$R_{\text{bed}}(t) = R_0 \cdot \max\left(0.5, \left[1 - \beta \cdot \left(\frac{Y(t)}{\text{Dose}}\right)\right]\right)^2$$
  guaranteeing bed resistance never decays below $25\%$ of $R_0$.

#### 5. [BLOCKER-5] Mathematical Divergence Between 5-Axis Sensory Equations and Target Baseline Polygon Values
* **Source Lenses:** `egm-comprehension` (B2), `egm-design` (M6), `egm-zoom-out` (Trade-off 7)
* **Affected Scope:** Lines 275–288
* **Finding:** Substituting baseline God Shot values ($EY = 20.0\%$, Ratio $= 1:2.0$, $T = 93.0^\circ\text{C}$, Dose $= 18.0\text{g}$) into the documented sensory formulas yields Sourness $= 0.05$ (target is $0.35$), Sweetness $= 1.0$ (target is $0.90$), Body $= 0.855$ (target is $0.65$), and Clarity $= 0.329$ (target is $0.70$). Furthermore, temperature modifiers cause axes to exceed $1.0$, clipping the SVG viewport.
* **Consolidated Resolution:** Re-calibrate the sensory equations so that baseline values evaluate exactly to $\{ S: 0.35, W: 0.90, D: 0.65, B: 0.30, C: 0.70 \}$, and wrap each axis in an outer `clamp(..., 0.05, 1.0)`.

#### 6. [BLOCKER-6] Missing Mandatory "Risks & Mitigations" Section
* **Source Lenses:** `egm-structural` (B1)
* **Affected Scope:** Lines 1–421
* **Finding:** `feature-spec-standard.md` mandates an explicit "Risks & Mitigations" section identifying failure modes and mitigations prior to the implementation plan.
* **Consolidated Resolution:** Insert `## Risks & Mitigations` before line 422 addressing: (1) Accumulator spiral of death / background tab throttling, (2) High-DPI canvas fill rate, (3) Float precision accumulation limits, and (4) Viewport scaling containment.

---

### 🟡 Major Findings (Actionable Architecture & Engineering Refinements)

#### 1. [MAJOR-1] Undefined Empirical Physical Calibration Constants ($k_{\text{grain}}$, $k_{\text{dwell}}$)
* **Source Lenses:** `egm-design` (M5), `egm-comprehension` (M4), `egm-codebase-details` (B3)
* **Resolution:** Define exact calibrated constants: $k_{\text{grain}} = 1.83 \times 10^7\text{ Pa}\cdot\text{s}\cdot\mu\text{m}^{2.6}\cdot\text{g}^{-1.25}\cdot\text{m}^{-1}$ (yielding $R_0 = 5.28 \times 10^9\text{ m}^{-1}$ and $Q_0 \approx 1.40\text{ g/s}$ at 18g/340µm/9 bar) and $k_{\text{dwell}} = 85.0\text{ s}\cdot\mu\text{m}\cdot\text{g}^{-1}$.

#### 2. [MAJOR-2] Missing Target Yield / Brew Ratio Input Control in UI Wireframe
* **Source Lenses:** `egm-comprehension` (M5), `egm-design` (M9), `egm-zoom-out` (Trade-off 6)
* **Resolution:** Add a 5th slider control to the 320px input rail: `Target Yield: [ 36.0 g ] [-][+]` ($24.0–50.0\text{g}$), enabling users to follow Barista Coach ratio adjustments.

#### 3. [MAJOR-3] FSM State Enum and Lifecycle Discrepancy (`RESET` State vs Method)
* **Source Lenses:** `egm-structural` (M7), `egm-codebase-details` (M7), `egm-zoom-out` (N5, Trade-off 8)
* **Resolution:** Enforce a strict 4-state FSM (`IDLE`, `PRE_INFUSION`, `EXTRACTING`, `EVALUATING`). Re-define reset as an imperative method `reset()` that clears state and transitions immediately back to `IDLE`. Add `isRunning()` query method to `StateManager`.

#### 4. [MAJOR-4] Shot Timeout Threshold Discrepancy (40s vs 50s)
* **Source Lenses:** `egm-structural` (M8), `egm-design` (M8)
* **Resolution:** Standardize on `MAX_SHOT_TIME = 45.0s` across CUJ 3, the FSM auto-stop trigger, and the Barista Coach choked shot rule.

#### 5. [MAJOR-5] Controls Locking Vulnerable to Keyboard Tab Focus Leak
* **Source Lenses:** `egm-design` (M10), `egm-zoom-out`
* **Resolution:** Update `controls.js` and CSS to apply the HTML `inert` attribute and `disabled` property to `#controls-panel` during extraction, preventing keyboard focus leaks.

#### 6. [MAJOR-6] Missing Concrete In-Memory Roast Calibration Dictionaries in `presets.js`
* **Source Lenses:** `egm-codebase-details` (M4)
* **Resolution:** Embed the complete concrete JavaScript object literals for `light`, `medium`, and `dark` roast presets directly in the contract specification.

#### 7. [MAJOR-7] Undefined DOM Element IDs and Selectors Linking Markup to UI Managers
* **Source Lenses:** `egm-codebase-details` (M6)
* **Resolution:** Provide an explicit DOM ID mapping table linking `index.html` elements to `ControlsManager`, `SVGGaugeManager`, and `ShotGraphRenderer`.

#### 8. [MAJOR-8] Incomplete Return Contract and Missing Dictionaries in `coach.js`
* **Source Lenses:** `egm-codebase-details` (M8)
* **Resolution:** Define the exact return dictionary objects (including `badgeClass`, `badgeText`, `title`, and `tasteNotes`) for all diagnostic branches in `coach.js`.

#### 9. [MAJOR-9] Missing Phasing Checkpoints and Concrete Verification Acceptance Criteria
* **Source Lenses:** `egm-implementation-readiness` (M9)
* **Resolution:** Add an explicit `Verification Checkpoint` section to each implementation phase (Phases 1–7) with exact browser inspection steps or Node.js test commands.

#### 10. [MAJOR-10] Canvas Rendering Coordinate System & Anchor Offsets Unspecified
* **Source Lenses:** `egm-codebase-details` (M5)
* **Resolution:** Specify exact Canvas bounding boxes and anchor points (portafilter head at $(230, 30)$, stream cone apex at $(230, 65)$, cup arrival at $(230, 310)$, glass cup box $[160, 280, 140, 130]$).

#### 11. [MAJOR-11] Viewport Horizontal Grid Budget Width Discrepancy (1260px vs 1280px)
* **Source Lenses:** `egm-design` (M11)
* **Resolution:** Reconcile column dimensions with a strict `10px` grid gap: Middle row `320px + 10px + 460px + 10px + 480px = 1280px`; Lower row `495px + 10px + 775px = 1280px`.

#### 12. [MAJOR-12] Undefined Coffee Domain Acronyms and Technical Terms
* **Source Lenses:** `egm-comprehension` (M6)
* **Resolution:** Provide a concise inline Glossary defining EY%, TDS, Blonding, Tiger Striping, God Shot, Ristretto/Lungo, and rAF.

---

### 🟢 Nits & Style Cleanups

1. **[NIT-1] Premature Optimization**: Remove all references to custom particle pooling memory abstractions in `canvasStream.js`. Rely on immediate-mode 2D Canvas path rendering.
2. **[NIT-2] Meta-Circular Self-Reference**: Remove `docs/designs/espresso_simulator.md` from the Implementation Plan file creation table.
3. **[NIT-3] Coach Threshold Logic Consistency**: Align comparison operators with annotated text (`< 22.0s` vs `24.0s - 32.0s`).
4. **[NIT-4] Stale Open Questions**: Remove Open Questions 1 and 2, which are already affirmatively resolved in the implementation specification.
5. **[NIT-5] Pump Pressure Ramp Decoupling**: Decouple pump ramp-up time ($t_{\text{ramp}} = \min(t, 2.0\text{s})$) from bed saturation breakthrough time $t_{\text{dwell}}$.
6. **[NIT-6] Parameter Binding**: Clarify that $t_{\text{dwell}} = 85.0 \times (\text{Dose}/\text{Grind}) \times (9.0/P_{\text{pump}})^{0.5} \times \text{dwellMultiplier}$.
7. **[NIT-7] Objective Alternatives Phrasing**: Replace subjective `Rejected by author:` with `Trade-off & Technical Rationale:`.
8. **[NIT-8] Standardize Named Exports**: Mandate standard named ES6 module exports across all JavaScript files.

---

## Traceability Matrix

| Consolidated Item | Severity | Stage 5 (Zoom Out) | Stage 6 (Comprehension) | Stage 7 (Critic) | Stage 8 (Inter. Zoom Out) | Stage 9 (Readiness) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Solubles Dissolution ($EY\%$, $TDS\%$, $C_{\text{sol}}$) | 🔴 Blocker | — | Blocker 1 | Blocker 2 | Trade-off 2 | Blocker 3 |
| 780px Extraction Graph HUD Component | 🔴 Blocker | Major 1 | Blocker 3 | Blocker 4 | Trade-off 1 | Blocker 2 |
| Automated Test Plan Specification | 🔴 Blocker | — | — | — | Trade-off 4 | Blocker 1 |
| Puck Resistance Decay Singularity Clamp | 🔴 Blocker | — | — | Blocker 3 | Action Item | — |
| 5-Axis Flavor Radar Formula Reconciliation | 🔴 Blocker | Nit 8 | Blocker 2 | Major 6 | Trade-off 7 | — |
| Mandatory Risks & Mitigations Section | 🔴 Blocker | — | — | Blocker 1 | Action Item | — |
| Empirical Constants ($k_{\text{grain}}$, $k_{\text{dwell}}$) | 🟡 Major | — | Major 4 | Major 5 | Action Item | Blocker 3 |
| Target Yield Input Control & UI Wireframe | 🟡 Major | — | Major 5 | Major 9 | Trade-off 6 | — |
| FSM State Machine Lifecycle Simplification | 🟡 Major | Nit 5 | — | Major 7 | Trade-off 8 | Major 7 |
| Shot Failsafe Timeout Alignment (45s) | 🟡 Major | — | — | Major 8 | Action Item | — |
| Controls Locking Keyboard Tab Leak Guard | 🟡 Major | — | — | Major 10 | Action Item | — |
| Roast Presets Concrete Dictionaries | 🟡 Major | — | — | — | Action Item | Major 4 |
| DOM Element ID Mapping Contract | 🟡 Major | — | — | — | Action Item | Major 6 |
| Barista Coach Return Dictionaries | 🟡 Major | — | — | — | Action Item | Major 8 |
| Phase Checkpoint Verification Commands | 🟡 Major | — | — | — | Action Item | Major 9 |
| Canvas Stage Coordinate Geometry | 🟡 Major | — | — | — | Action Item | Major 5 |
| Horizontal Grid Width Reconciliation | 🟡 Major | — | — | Major 11 | Action Item | — |
| Inline Glossary of Technical & Coffee Terms | 🟡 Major | — | Major 6 | — | Action Item | — |

---

## Remediation Roadmap for `/egm:egm-resolve`

The specification is ready for surgical automated remediation via `/egm:egm-resolve`:
1. **Apply Mathematical Fixes**: Insert $EY\%$, $TDS\%$, $C_{\text{sol}}$, and `blondingFraction` equations; add resistance erosion clamp; calibrate 5-axis radar formulas.
2. **Add Missing Architecture Components**: Add `js/ui/shotGraph.js` specification and update layout, topology, and execution phases.
3. **Add Test Plan**: Add Section 4 Test Specification using native `node:test` and `node:assert`.
4. **Insert Risks & Mitigations**: Add Section 5 covering numerical drift, event loop throttling, and DPI scaling.
5. **Reconcile UI & FSM Contracts**: Add Target Yield slider, standardize on 4 FSM states, and define DOM ID contracts.
6. **Publish & Dual-Sync**: Re-sync finalized document to Google Drive "PRD: Espresso Simulator".
