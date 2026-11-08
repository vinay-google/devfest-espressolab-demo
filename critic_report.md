# Stage 7 Critic Review: Consolidated Audit Report

**Target:** `docs/designs/espresso_simulator.md` (`Lines 1-421`)  
**Document Standards:** `resources/document_standards/feature-spec-standard.md`  
**Goldfish Context:** `concepts_brief.md`  
**Deliverable:** `critic_report.md`  

## Reviewer Status

| Reviewer | Status | Lens Scope |
| :--- | :--- | :--- |
| `egm-design` | **completed** | System architecture, fluid mechanics, mathematical feasibility, UI/UX consistency, edge cases |
| `egm-structural` | **completed** | Document organization, completeness against `feature-spec-standard.md`, CUJ consistency, traceability |
| `egm-style` | **completed** | Notation precision, terminology consistency, unit accuracy, alternative rationales, readability |

---

## Executive Summary

| Severity | Count | Key Drivers |
| :--- | :---: | :--- |
| 🔴 **Blocker** | 4 | Missing mandatory Risks & Mitigations section; missing EY% and soluble kinetics equations; division-by-zero resistance decay singularity; orphaned Extraction Graph HUD component. |
| 🟡 **Major** | 7 | Undefined empirical constants ($k_{\text{grain}}$, $k_{\text{dwell}}$); sensory radar axis normalization overflow ($>1.0$); FSM state contradiction (`RESET`); shot timeout discrepancy (40s vs 50s); missing Target Yield control in wireframe; keyboard focus leak during shot lock; horizontal viewport grid width mismatch. |
| 🟢 **Nit** | 3 | Subjective "Rejected by author:" phrasing in Alternatives; stale Open Questions already answered in text; pump pressure ramp coupled to dwell time. |

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Missing Mandatory "Risks & Mitigations" Section - Severity: Blocker
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** `Lines 1-421` (Global Document Structure)
* **Discrepancy Description:** `feature-spec-standard.md` mandates that all specifications include an explicit "Risks & Limits" / "Risks & Mitigations" section identifying failure modes, performance limits, security boundaries, and mitigation strategies. Lines 1–421 jump from *Alternatives Considered* (Line 388) directly to *Detailed Implementation Plan* (Line 422) with zero risk analysis.
* **Rationale & Recommendation:** Add a dedicated `## Risks & Mitigations` section before line 421 addressing:
  1. *Accumulator Spiral of Death / Tab Backgrounding*: Clamp `frameDelta` (e.g. `Math.min(delta, 0.1)`) and handle rAF throttling when tab is inactive.
  2. *High-DPI Fill Rate & Memory*: Backing store canvas scaling vs. garbage collection overhead.
  3. *Float Precision & Numerical Drift*: Clamping and epsilon tolerances for yield accumulation.
  4. *Viewport Overflow on Non-Standard Displays*: Aspect scaling fallback and letterboxing.

---

### 2. Missing Extraction Yield ($EY\%$) and Soluble Dissolution ($C_{\text{sol}}$) Formulations - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 180-244` (Section 2: Extraction Physics & Mathematical Model)
* **Discrepancy Description:** The specification repeatedly references Extraction Yield ($EY\%$), Total Dissolved Solids ($TDS\%$), and instantaneous soluble concentration $C_{\text{sol}}(t)$ across CUJs (Lines 80, 91), Canvas stream color grading (Line 255), and the Flavor Radar (Lines 276–288). However, Section 2 provides zero equations for how $EY\%$, $TDS\%$, or $C_{\text{sol}}(t)$ are calculated, dissolved, or integrated over time.
* **Rationale & Recommendation:** Formally define the solubles dissolution model in Section 2:
  $$TDS\%(t) = TDS_0 \cdot \exp\left(-\gamma \cdot \frac{Y(t)}{\text{Dose}}\right)$$
  $$M_{\text{sol}}(t + \Delta t) = M_{\text{sol}}(t) + Q(t) \cdot \frac{TDS\%(t)}{100} \cdot \Delta t$$
  $$EY\%(t) = \left(\frac{M_{\text{sol}}(t)}{\text{Dose}}\right) \times 100\%$$
  Explicitly connect $C_{\text{sol}}(t) \equiv TDS\%(t)$ to the Canvas color grading thresholds ($>10\%$, $5–10\%$, $<5\%$).

---

### 3. Puck Resistance Decay Singularity & Division by Zero - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 207-211` (Late Blonding & Hydraulic Resistance Decay)
* **Discrepancy Description:** Puck resistance decay is modeled as:
  $$R_{\text{bed}}(t) = R_0 \cdot \left[1 - \beta \cdot \left(\frac{Y(t)}{\text{Dose}}\right)\right]^2$$
  With $\beta = 0.28$, when an extended lungo shot reaches $Y(t)/\text{Dose} = 1/\beta \approx 3.57$ (e.g. 50g yield on a 14g dose), the bracket reaches exactly $0.0$, causing $R_{\text{bed}} = 0$. When passed to Darcy's law $Q(t) = (\Delta P \cdot A) / (\mu \cdot R_{\text{bed}})$, the denominator evaluates to zero, causing an arithmetic division-by-zero singularity ($Q \to \infty$ and yield `NaN`). Furthermore, for ratios $> 3.57$, squaring the negative term causes resistance to incorrectly increase.
* **Rationale & Recommendation:** Add an explicit physical lower resistance clamp:
  $$R_{\text{bed}}(t) = R_0 \cdot \max\left(R_{\min\_ratio}, \left[1 - \beta \cdot \left(\frac{Y(t)}{\text{Dose}}\right)\right]\right)^2$$
  Where $R_{\min\_ratio} \approx 0.5$ (preventing puck resistance from decaying below $25\%$ of $R_0$).

---

### 4. Orphaned Extraction Graph HUD Subsystem - Severity: Blocker
* **Reviewer Lens:** `egm-design` & `egm-structural`
* **Affected Scope:** `Lines 114-132`, `156-176`, `378-383`
* **Discrepancy Description:** The Viewport ASCII wireframe (Line 378) designates a massive $780 \times 260\text{px}$ lower panel to an `EXTRACTION GRAPH HUD` rendering real-time curves for Yield ($g$) and Flow Rate ($g/s$) alongside a ghost target envelope. Telemetry point logging is referenced in `state.js` (Line 476) and graph resets in `RESET` (Line 309). However, there is no corresponding module in the file directory (`js/ui/`), no representation in the High-Level Architecture data flow diagram, and no module interface specification in Section 2.
* **Rationale & Recommendation:** Either add a dedicated module specification (`js/ui/shotGraph.js`) defining canvas/SVG polyline path rendering, viewport coordinate scaling ($t \in [0, 50\text{s}]$, $Q \in [0, 5\text{ g/s}]$, $Y \in [0, 60\text{g}]$), or explicitly incorporate its rendering contract into `js/ui/svgGauges.js`.

---

### 5. Undefined Empirical Scaling Constants ($k_{\text{grain}}$ and $k_{\text{dwell}}$) - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 198-206`
* **Discrepancy Description:** Initial bed resistance $R_0 = k_{\text{grain}} \cdot \frac{\text{Dose}^{1.25}}{\text{GrindMicrons}^{2.6}}$ and saturation dwell $t_{\text{dwell}} = k_{\text{dwell}} \cdot \frac{\text{Dose}}{\text{GrindMicrons}} \cdot (9.0 / P_{\text{pump}})^{0.5}$ rely on empirical constants $k_{\text{grain}}$ and $k_{\text{dwell}}$. While line 200 notes $k_{\text{grain}}$ is calibrated to yield $1.4\text{ g/s}$ at baseline, neither formula provides explicit numerical values. Implementing engineers cannot run the simulation without reverse-engineering these values.
* **Rationale & Recommendation:** Document the calibrated baseline constants directly in the specification:
  - $k_{\text{grain}} \approx 5.935 \times 10^{11}\text{ Pa}\cdot\text{s}\cdot\mu\text{m}^{2.6}\cdot\text{g}^{-1.25}\cdot\text{m}^{-1}$
  - $k_{\text{dwell}} \approx 85.0\text{ s}\cdot\mu\text{m}\cdot\text{g}^{-1}$

---

### 6. Flavor Radar Sensory Axis Normalization Overflow - Severity: Major
* **Reviewer Lens:** `egm-design` & `egm-style`
* **Affected Scope:** `Lines 276-288`
* **Discrepancy Description:** Line 276 states that all sensory axes are normalized between $0.0$ and $1.0$. However, the Sourness ($S$) and Bitterness ($B$) formulas multiply a clamped value by an un-clamped temperature modifier:
  $$S = \text{clamp}\left(1.0 - \frac{EY - 12}{8}, 0.05, 1.0\right) \times \left(1.0 + 0.5 \cdot \max\left(0, \frac{91 - T}{10}\right)\right)$$
  When $T = 88^\circ\text{C}$, the multiplier is $1.0 + 0.5(0.3) = 1.15$, yielding $S = 1.15$. For Bitterness at $T = 96^\circ\text{C}$, the multiplier is $1.08$, yielding $B = 1.08$. Values exceeding $1.0$ cause radar polygon vertices to project outside the $R = 100\text{px}$ perimeter and clip surrounding layout elements.
* **Rationale & Recommendation:** Wrap the entire expression in an outer `clamp(..., 0.05, 1.0)`:
  $$S = \text{clamp}\left(\left[1.0 - \frac{EY - 12}{8}\right] \times \left[1.0 + 0.5 \cdot \max\left(0, \frac{91 - T}{10}\right)\right], 0.05, 1.0\right)$$
  Apply identical outer clamping to Bitterness ($B$).

---

### 7. Inconsistent FSM State Lifecycle and Code Contract Contradiction - Severity: Major
* **Reviewer Lens:** `egm-structural` & `egm-design`
* **Affected Scope:** `Lines 294-310` vs `Line 472`
* **Discrepancy Description:** The FSM state diagram (Line 295) and narrative lifecycle describe 5 states (`IDLE`, `PRE_INFUSION`, `EXTRACTING`, `EVALUATING`, `RESET`), showing explicit transitions `EVALUATING --> RESET` and `RESET --> IDLE`. However, the module contract for `StateManager` in line 472 specifies:
  `STATES = { IDLE: 'IDLE', PRE_INFUSION: 'PRE_INFUSION', EXTRACTING: 'EXTRACTING', EVALUATING: 'EVALUATING' }`
  `RESET` is omitted from `STATES`.
* **Rationale & Recommendation:** Clarify whether `RESET` is a persistent state or a transition method. Since resetting instantly restores idle values, update the FSM diagram to show `EVALUATING --> IDLE : Click "Reset" or change preset` via a `reset()` method, aligning the diagram with the 4-state enum in `state.js`.

---

### 8. Shot Timeout Threshold Contradiction (40s vs 50s) - Severity: Major
* **Reviewer Lens:** `egm-structural` & `egm-design`
* **Affected Scope:** `Lines 101-102`, `Line 300`, `Line 323`
* **Discrepancy Description:** Line 300 specifies an automatic shot timeout of 50s: `EXTRACTING --> EVALUATING : Target yield reached OR click "Stop Shot" OR timeout (50s)`. Conversely, CUJ 3 (Line 101) and the Barista Coach diagnostic decision tree (Line 323) specify 40s: `IF Total Shot Time > 35.0s OR Choked (Yield < Target at 40s)`.
* **Rationale & Recommendation:** Reconcile the timeout constant across all sections. Standardize on `MAX_SHOT_TIME = 45.0s` or update Line 300 and CUJ 3 to consistently specify `45.0s` as the forced failsafe cutoff.

---

### 9. Missing Target Yield Input Control in Layout Wireframe - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 358-377`
* **Discrepancy Description:** Target Yield is an essential simulation parameter ($28.0–55.0\text{g}$) specified in presets (Line 454) and `setParameters()` (Line 475), and serves as the primary auto-stop trigger in Line 300. Furthermore, Coach diagnostics (Lines 332, 336) specifically instruct users to increase or decrease target yield. However, the Input Controls rail in the ASCII layout diagram (Lines 362–376) contains sliders only for Dose, Grind, Water Temp, and Pump Pressure; Target Yield is completely absent.
* **Rationale & Recommendation:** Add a 5th slider control to the input rail wireframe: `Target Yield: [ 36.0 g ] [-][+]`, allocating 40px vertical space within the 540px input column.

---

### 10. Controls Locking Vulnerable to Keyboard Tab Focus Leak - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 306`, `Lines 511-514`
* **Discrepancy Description:** Line 306 specifies that during `PRE_INFUSION` and `EXTRACTING`, controls are locked using a CSS frosted glass shroud (`pointer-events: none; opacity: 0.6;`). While `pointer-events: none` prevents mouse clicks and drags, it does not prevent keyboard users from tabbing into `<input type="range">` elements and changing slider parameters using the arrow keys while a shot is actively pulling, which can corrupt the ongoing physics simulation.
* **Rationale & Recommendation:** Update `controls.js` contract and CSS specification to require applying the `disabled` property or HTML `inert` attribute to `#controls-panel` whenever the FSM transitions out of `IDLE`.

---

### 11. Viewport Horizontal Grid Budget Width Discrepancy - Severity: Major
* **Reviewer Lens:** `egm-design` & `egm-style`
* **Affected Scope:** `Lines 358-384`
* **Discrepancy Description:** In Section 6 (Viewport Budgeting), the middle operating stage columns are defined as: Input Controls (320px) + Extraction Stage (460px) + Telemetry & Radar (480px) = **1260px**, leaving 20px unaccounted for. In contrast, the lower deck columns are defined as: Coach Card (500px) + Graph HUD (780px) = **1280px** (0px remaining). Applying a standard CSS Grid `gap: 10px` would cause the bottom row to expand to $1290\text{px}$, violating the strict 1280px fixed viewport boundary.
* **Rationale & Recommendation:** Explicitly specify the grid gap and padding arithmetic: define `gap: 10px` with column widths adjusted to fit exactly 1280px (e.g., middle row: `320px + 10px + 460px + 10px + 480px = 1280px`; lower row: `495px + 10px + 775px = 1280px`).

---

### 12. Repetitive Subjective "Rejected by author:" Attribution - Severity: Nit
* **Reviewer Lens:** `egm-structural` & `egm-style`
* **Affected Scope:** `Lines 388-419` (Alternatives Considered)
* **Discrepancy Description:** All 6 alternatives use the exact prefix `* **Reason for Rejection**: Rejected by author: ...`. `feature-spec-standard.md` explicitly warns: *"Rejection rationales must state concrete technical or scope trade-offs and must not attribute a rejection to a maintainer without linking their issue, discussion, or PR."*
* **Rationale & Recommendation:** Replace `Rejected by author:` with objective trade-off headings such as `* **Trade-off & Technical Rationale**:` focusing strictly on architectural constraints, DOM thrashing, and compute latency.

---

### 13. Stale Open Questions Already Resolved in Narrative - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** `Lines 62-66`
* **Discrepancy Description:** Both questions in Section 4 (*Open Questions*) are already affirmatively resolved in the implementation specification: Question 1 (Retina DPI scaling) is resolved in Line 486 (`sets backing resolution based on devicePixelRatio`), and Question 2 (Radar dynamic animation) is resolved in Line 308 (`Render post-shot badge, numeric score, and flavor radar polygon` during `EVALUATING`).
* **Rationale & Recommendation:** Remove Questions 1 and 2 from Open Questions or formally state their resolved status and chosen implementation path.

---

### 14. Pump Pressure Ramp Duration Conflated with Puck Saturation Dwell - Severity: Nit
* **Reviewer Lens:** `egm-design` & `egm-style`
* **Affected Scope:** `Lines 188`, `203-206`
* **Discrepancy Description:** Line 188 states that during pre-infusion ($0 \le t \le t_{\text{dwell}}$), $\Delta P(t)$ ramps linearly from $0$ to target pump pressure. In physical reality and espresso machine mechanics, pump pressure ramps up to full bar in $1.5–2.0\text{s}$, while puck saturation dwell $t_{\text{dwell}}$ takes $4–8\text{s}$. Tying pump ramp duration directly to $t_{\text{dwell}}$ means a choked shot unnaturally takes 8 seconds to reach 9 bar.
* **Rationale & Recommendation:** Decouple pump ramp-up time ($t_{\text{ramp}} = \min(t, 2.0\text{s})$) from bed saturation breakthrough time $t_{\text{dwell}}$.
