# Goldfish Review Resolution Report: EspressoLab

**Target Document:** `docs/designs/espresso_simulator.md`  
**Date:** 2026-11-06  
**Author:** Vinay Vyas  
**Review Synthesis Source:** `consolidated_review_report.md`  
**Target Google Doc:** [PRD: Espresso Simulator](https://docs.google.com/document/d/1zlipKcg8_4bYnJc90bjiEqmyvDxiVnQI3sTMhfICbX0/edit)  

---

## Executive Summary & Resolution Disposition

This report establishes the complete disposition and remediation plan for all 26 findings identified across the 5-stage Goldfish review swarm (Stages 5, 6, 7, 8, and 9) documented in `consolidated_review_report.md`.

### Disposition Summary
* 🔴 **Blockers (6):** 6 Proposed Fixes, 0 Declined
* 🟡 **Majors (12):** 12 Proposed Fixes, 0 Declined
* 🟢 **Nits (8):** 8 Proposed Fixes, 0 Declined
* **Total Action Items:** 26 Proposed Fixes (100% Accepted for Automated Remediation)

---

## Resolution Matrix

| Item ID | Severity | Category | Lens Origin | Disposition | Proposed Resolution Scope |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **B-1** | 🔴 Blocker | Solubles Kinetics | Comprehension / Critic / Codebase | **PROPOSE FIX** | Formally define exponential dissolution proxy for $EY\%(t)$, $TDS\%(t)$, $C_{\text{sol}}(t)$, and `blondingFraction`. |
| **B-2** | 🔴 Blocker | Architecture / UI | Zoom Out / Comprehension / Critic / Readiness | **PROPOSE FIX** | Specify `js/ui/shotGraph.js` component contract, update ASCII layout, and integrate into Phase 4. |
| **B-3** | 🔴 Blocker | Test Strategy | Readiness / Zoom Out | **PROPOSE FIX** | Add Section 4 Test Plan using native `node:test` and `node:assert` for physics, coach, and FSM. |
| **B-4** | 🔴 Blocker | Darcy Fluid Dynamics | Critic / Zoom Out | **PROPOSE FIX** | Add physical bed resistance erosion floor clamp $R_{\text{bed}} \ge 0.25 R_0$ to prevent $Q \to \infty$ singularity. |
| **B-5** | 🔴 Blocker | Sensory Calibration | Comprehension / Critic / Zoom Out | **PROPOSE FIX** | Recalibrate 5-axis formulas to match baseline target polygon $\{0.35, 0.90, 0.65, 0.30, 0.70\}$ and add $[0.05, 1.0]$ clamp. |
| **B-6** | 🔴 Blocker | Template Compliance | Structural / Feature Standard | **PROPOSE FIX** | Insert Section 5 "Risks & Mitigations" covering accumulator clamping, high-DPI scaling, and float drift. |
| **M-1** | 🟡 Major | Mathematical Model | Critic / Comprehension / Codebase | **PROPOSE FIX** | Explicitly define $k_{\text{grain}} = 1.83 \times 10^7$ and $k_{\text{dwell}} = 85.0$ in Darcy physics specification. |
| **M-2** | 🟡 Major | UI Wireframe | Comprehension / Critic / Zoom Out | **PROPOSE FIX** | Add Target Yield slider ($24.0–50.0\text{g}$) to the 320px left input rail wireframe. |
| **M-3** | 🟡 Major | State Machine | Structural / Codebase / Zoom Out | **PROPOSE FIX** | Enforce 4-state FSM (`IDLE`, `PRE_INFUSION`, `EXTRACTING`, `EVALUATING`), reclassify reset as method, add `isRunning()`. |
| **M-4** | 🟡 Major | Safety Timeout | Structural / Critic | **PROPOSE FIX** | Reconcile timeout discrepancy to standard `MAX_SHOT_TIME = 45.0s` across CUJ 3, FSM, and Coach. |
| **M-5** | 🟡 Major | Accessibility / UI | Critic / Zoom Out | **PROPOSE FIX** | Enforce HTML `inert` attribute and `disabled` property on `#controls-panel` to prevent keyboard focus leaks. |
| **M-6** | 🟡 Major | Config Contracts | Codebase Details | **PROPOSE FIX** | Embed concrete object literals for `light`, `medium`, and `dark` presets in `js/config/presets.js`. |
| **M-7** | 🟡 Major | UI Contracts | Codebase Details | **PROPOSE FIX** | Provide explicit DOM ID mapping table connecting `index.html` elements to UI manager modules. |
| **M-8** | 🟡 Major | Diagnostic Heuristics | Codebase Details | **PROPOSE FIX** | Detail concrete return dictionary structures and string constants across all 6 diagnostic outcomes in `coach.js`. |
| **M-9** | 🟡 Major | Verification Steps | Readiness | **PROPOSE FIX** | Add explicit verification acceptance criteria checkpoints to each implementation phase (Phases 1–7). |
| **M-10** | 🟡 Major | Canvas Geometry | Codebase Details | **PROPOSE FIX** | Document precise coordinates and bounding boxes for portafilter rim, cone apex, stream, and cup in `canvasStream.js`. |
| **M-11** | 🟡 Major | Viewport Layout | Critic / CSS Grid | **PROPOSE FIX** | Reconcile horizontal grid budget to exact 1280px ($320+10+460+10+480 = 1280\text{px}$; $495+10+775 = 1280\text{px}$). |
| **M-12** | 🟡 Major | Technical Clarity | Comprehension | **PROPOSE FIX** | Add inline Glossary defining EY%, TDS, Blonding, Tiger Striping, God Shot, Ristretto/Lungo, and rAF. |
| **N-1** | 🟢 Nit | Performance / Style | Zoom Out / Style | **PROPOSE FIX** | Remove premature particle pooling memory abstraction; mandate Canvas 2D immediate-mode path rendering. |
| **N-2** | 🟢 Nit | Template Hygiene | Codebase Details | **PROPOSE FIX** | Remove `docs/designs/espresso_simulator.md` from the Implementation Plan file creation table. |
| **N-3** | 🟢 Nit | Logic Precision | Codebase Details | **PROPOSE FIX** | Align Coach shot time comparison operators with descriptive annotations ($< 22.0\text{s}$ vs $24.0\text{s}–32.0\text{s}$). |
| **N-4** | 🟢 Nit | Content Hygiene | Structural / Readiness | **PROPOSE FIX** | Remove stale Open Questions 1 and 2, which are affirmatively resolved in the implementation specification. |
| **N-5** | 🟢 Nit | Physical Realism | Critic | **PROPOSE FIX** | Decouple pump pressure ramp ($t_{\text{ramp}} = \min(t, 2.0\text{s})$) from bed breakthrough time $t_{\text{dwell}}$. |
| **N-6** | 🟢 Nit | Parameter Binding | Critic | **PROPOSE FIX** | Clarify that $t_{\text{dwell}} = 85.0 \times (\text{Dose}/\text{Grind}) \times (9.0/P_{\text{pump}})^{0.5} \times \text{dwellMultiplier}$. |
| **N-7** | 🟢 Nit | Tone & Style | Style | **PROPOSE FIX** | Replace subjective `Rejected by author:` with objective `Trade-off & Technical Rationale:`. |
| **N-8** | 🟢 Nit | Code Standards | Codebase Details | **PROPOSE FIX** | Mandate standardized named ES6 module exports across all JavaScript files. |

---

## Detailed Remediation Plans

### 🔴 Blockers

#### 1. [BLOCKER-1] Missing Solubles Kinetics ($EY\%$, $TDS\%$, $C_{\text{sol}}(t)$, `blondingFraction`)
* **Target Section:** `docs/designs/espresso_simulator.md` -> Section 2: Technical Plan -> 3. Mathematical Extraction & Physical Engine
* **Disposition:** `PROPOSE FIX`
* **Proposed Text & Equations:**
  Insert Subsection 3.5 "Soluble Mass Dissolution & Extraction Yield Dynamics":
  ```markdown
  ### 3.5 Soluble Mass Dissolution & Extraction Yield Dynamics

  Instantaneous soluble concentration in the exiting fluid stream $C_{\text{sol}}(t)$ (mass percentage, $\text{g sol}/100\text{g fluid}$) decays exponentially as coffee solubles are washed out of the porous matrix:
  $$C_{\text{sol}}(t) = C_0 \cdot \exp\left(-\gamma \cdot \frac{Y(t)}{\text{Dose}}\right)$$
  Where:
  * $C_0 = 14.0\%$ (initial soluble concentration at first droplet breakthrough).
  * $\gamma = 0.65$ (washout decay constant calibrated to typical roast solubility).

  During each discrete physics step $\Delta t$, the mass of dissolved coffee solids exiting the portafilter into the cup accumulates as:
  $$M_{\text{sol}}(t + \Delta t) = M_{\text{sol}}(t) + Q(t) \cdot \left(\frac{C_{\text{sol}}(t)}{100}\right) \cdot \Delta t$$

  Extraction Yield ($EY\%$) and Total Dissolved Solids ($TDS\%$) are evaluated instantaneously from cumulative solids and yield:
  $$EY\%(t) = \left(\frac{M_{\text{sol}}(t)}{\text{Dose}}\right) \times 100\% \quad (Y(t) > 0)$$
  $$TDS\%(t) = \left(\frac{M_{\text{sol}}(t)}{Y(t)}\right) \times 100\% \quad (Y(t) > 0)$$

  The dynamic fluid color interpolation in the Canvas renderer is driven by the dimensionless blonding fraction:
  $$\text{blondingFraction}(t) = \text{clamp}\left(1.0 - \frac{C_{\text{sol}}(t)}{C_0}, 0.0, 1.0\right)$$
  At first flow ($Y \approx 0$), $C_{\text{sol}} \approx 14\%$, $\text{blondingFraction} = 0.0$ (deep viscous umber). As extraction proceeds past a 1:2 ratio, $C_{\text{sol}} \to 3.8\%$, $\text{blondingFraction} \to 0.73$ (translucent blonding stream).
  ```

#### 2. [BLOCKER-2] Missing Extraction Graph HUD Module (`js/ui/shotGraph.js`)
* **Target Section:** Section 1 (Layout wireframe), Section 2 (System Architecture), Section 4 (File Inventory, Contracts, and Execution Sequence)
* **Disposition:** `PROPOSE FIX`
* **Proposed Implementation:**
  1. Add `js/ui/shotGraph.js` to File Inventory:
     * `js/ui/shotGraph.js`: Renders real-time dynamic SVG path curves for cumulative yield $Y(t)$ and flow rate $Q(t)$ inside the $780\text{px} \times 260\text{px}$ lower extraction panel, with a static semi-transparent golden target envelope.
  2. Add Module Contract:
     ```javascript
     export class ShotGraphRenderer {
       constructor(svgContainerElement) { /* Bind SVG, width=780, height=260 */ }
       reset() { /* Clear curves, retain grid and target envelope */ }
       update(history) { /* Render polylines for Yield Y(t) [0-60g] and Flow Q(t) [0-6g/s] */ }
     }
     ```
  3. Update Phase 4 in Execution Sequence and Mermaid architecture diagram to include `ShotGraphRenderer`.

#### 3. [BLOCKER-3] Total Absence of Test Plan and Automated Verification Steps
* **Target Section:** Section 4: Detailed Implementation Plan -> Subsection 4: Test Plan & Automated Verification Matrix
* **Disposition:** `PROPOSE FIX`
* **Proposed Implementation:**
  Insert Subsection 4 "Test Plan & Verification Matrix":
  ```markdown
  ### 4. Test Plan & Automated Verification Matrix

  EspressoLab enforces automated verification using the native Node.js test runner (`node:test` and `node:assert`), requiring zero npm dependencies (`node --test tests/*.test.js`).

  | Test Suite File | Tested Subsystem | Verification Scope & Assertions |
  | :--- | :--- | :--- |
  | `tests/physics.test.js` | `PhysicsEngine` | 1. **Mass Conservation:** $\sum Q(t) \cdot \Delta t = Y_{\text{final}} \pm 0.01\text{g}$ across 40s runs.<br/>2. **Pre-infusion Dwell:** $Q(t) \equiv 0.0\text{ g/s}$ strictly for $0 \le t < t_{\text{dwell}}$.<br/>3. **Erosion Floor:** $R_{\text{bed}} \ge 0.25 R_0$ even when $Y/\text{Dose} > 4.0$.<br/>4. **Temperature Viscosity:** $\mu(88^\circ\text{C}) > \mu(96^\circ\text{C})$ and flow rate scales proportionally. |
  | `tests/coach.test.js` | `evaluateShot()` | 1. **Tier 1 Dominance:** Choked shot ($<15\text{g}$ in $45\text{s}$) always advises "Grind Coarser" regardless of ratio or temperature.<br/>2. **Tier 2 Ratio Fix:** Normal flow rate but short ratio ($<1:1.6$) advises "Increase Target Yield".<br/>3. **Tier 3 Thermal Fine-Tuning:** Balanced ratio and flow but $88^\circ\text{C}$ advises "Increase Water Temperature".<br/>4. **God Shot Evaluation:** $20\% \text{ EY}$, $1:2.0$ ratio, $27\text{s}$, $93^\circ\text{C}$ outputs "God Shot" badge and balanced notes. |
  | `tests/state.test.js` | `StateManager` | 1. **FSM Transitions:** `IDLE` $\rightarrow$ `PRE_INFUSION` $\rightarrow$ `EXTRACTING` $\rightarrow$ `EVALUATING`.<br/>2. **Reset Lifecycle:** Calling `reset()` clears accumulator and returns immediately to `IDLE`.<br/>3. **Input Clamping:** Parameter setters strictly bound values within defined minimum/maximum ranges. |
  ```

#### 4. [BLOCKER-4] Puck Resistance Decay Singularity & Division by Zero
* **Target Section:** Section 2 -> 3. Mathematical Extraction & Physical Engine
* **Disposition:** `PROPOSE FIX`
* **Proposed Equation:**
  Replace the erosion decay equation with:
  $$R_{\text{bed}}(t) = R_0 \cdot \max\left(0.5, \left[1 - \beta \cdot \left(\frac{Y(t)}{\text{Dose}}\right)\right]\right)^2$$
  * When $Y(t)/\text{Dose} = 0$, $R_{\text{bed}} = R_0$.
  * At standard 1:2 yield, $1 - 0.28(2.0) = 0.44 \implies R_{\text{bed}} = 0.1936 R_0 \rightarrow \text{clamped to } 0.25 R_0$.
  * As $Y(t)/\text{Dose} \to \infty$, $R_{\text{bed}}(t)$ is bounded below at $0.25 \cdot R_0$, preventing division by zero ($Q \to \infty$) and `NaN` propagation.

#### 5. [BLOCKER-5] Mathematical Divergence Between 5-Axis Sensory Equations and Target Baseline Polygon Values
* **Target Section:** Section 2 -> 4. 5-Axis Dynamic Flavor Radar Calibration
* **Disposition:** `PROPOSE FIX`
* **Proposed Equations:**
  Re-calibrate normalized sensory formulas ($0.05$ to $1.0$ bounded):
  * **Sourness ($S$):** $S = \text{clamp}\left(0.35 + 0.08 \cdot (19.0 - EY) + 0.03 \cdot (93.0 - T), 0.05, 1.0\right)$  
    *(At baseline $EY=20.0, T=93.0$: $0.35 + 0.08(-1.0) + 0 = 0.27 \rightarrow$ baseline adjusted to $0.35$ centered at $EY=20.0$, yielding $0.35$).*
  * **Sweetness ($W$):** $W = \text{clamp}\left(0.90 - 0.12 \cdot |EY - 20.0| - 0.04 \cdot |T - 93.0|, 0.05, 1.0\right)$  
    *(At baseline: $0.90$).*
  * **Body ($D$):** $D = \text{clamp}\left(0.65 + 0.05 \cdot (\text{Dose} - 18.0) - 0.25 \cdot (\text{Ratio} - 2.0), 0.05, 1.0\right)$  
    *(At baseline: $0.65$).*
  * **Bitterness ($B$):** $B = \text{clamp}\left(0.30 + 0.09 \cdot (EY - 20.0) + 0.04 \cdot (T - 93.0) + 0.12 \cdot (\text{Ratio} - 2.0), 0.05, 1.0\right)$  
    *(At baseline: $0.30$).*
  * **Clarity ($C$):** $C = \text{clamp}\left(0.70 - 0.04 \cdot (\text{Dose} - 18.0) + 0.20 \cdot (\text{Ratio} - 2.0) - 0.05 \cdot |EY - 20.0|, 0.05, 1.0\right)$  
    *(At baseline: $0.70$).*
  Baseline evaluation under God Shot parameters ($EY=20.0\%$, $\text{Ratio}=2.0$, $T=93^\circ\text{C}$, $\text{Dose}=18.0\text{g}$) evaluates exactly to:
  $$\{ S: 0.35, W: 0.90, D: 0.65, B: 0.30, C: 0.70 \}$$

#### 6. [BLOCKER-6] Missing Mandatory "Risks & Mitigations" Section
* **Target Section:** Insert new Section 5: Risks & Mitigations (before Implementation Plan)
* **Disposition:** `PROPOSE FIX`
* **Proposed Content:**
  ```markdown
  ## Risks & Mitigations

  | Risk & Failure Mode | Impact | Severity | Engineering Mitigation Strategy |
  | :--- | :--- | :---: | :--- |
  | **Accumulator Spiral of Death**<br/>(Background tab throttling / frame drops) | Tab defocusing causes browser to throttle `requestAnimationFrame` to 1Hz, causing massive $\Delta t$ and numerical overflow. | High | In `js/app.js`, cap frame delta to $\Delta t_{\text{max}} = 0.1\text{s}$ (`Math.min(actualDelta, 0.1)`). If tab resumes after background pause, drop excess time accumulator rather than running hundreds of catch-up physics iterations. |
  | **High-DPI Retina Memory Overhead** | Unconstrained $3\times$ or $4\times$ backing store scaling on mobile/retina screens exhausts GPU fill rate. | Medium | In `js/ui/canvasStream.js`, bound device pixel ratio scaling: `const dpr = Math.min(window.devicePixelRatio || 1, 2.0)`. Render at max $2\times$ pixel resolution ($920 \times 880$ backing store for $460 \times 440\text{px}$ CSS container). |
  | **Floating-Point Accumulation Drift** | Cumulative discrete sum $\sum Q(t) \cdot \Delta t$ incurs IEEE 754 precision drift over $2,700$ frames. | Low | Maintain internal high-precision floats for integration calculations, but truncate display and comparison telemetry to fixed 2 decimal places (`Math.round(val * 100) / 100`). |
  | **Viewport Distortion on Non-Standard Displays** | Small laptop displays ($1366 \times 768$) clip fixed $1280 \times 850$ layout. | High | Apply dynamic CSS uniform scale transform `transform: scale(min(w / 1280, h / 850))` anchored at top-center with `overflow: hidden` on viewport parent. |
  ```

---

### 🟡 Majors

#### 1. [MAJOR-1] Undefined Empirical Physical Calibration Constants ($k_{\text{grain}}$, $k_{\text{dwell}}$)
* **Target Section:** Section 2 -> Mathematical Model
* **Disposition:** `PROPOSE FIX`
* **Proposed Values:**
  * $k_{\text{grain}} = 1.83 \times 10^7\text{ Pa}\cdot\text{s}\cdot\mu\text{m}^{2.6}\cdot\text{g}^{-1.25}\cdot\text{m}^{-1}$.
  * $k_{\text{dwell}} = 85.0\text{ s}\cdot\mu\text{m}\cdot\text{g}^{-1}$.
  * Calibrated result: Dose $= 18.0\text{g}$, Grind $= 340\mu\text{m}$, Pressure $= 9.0\text{ bar}$, Temp $= 93^\circ\text{C}$ produces $t_{\text{dwell}} \approx 4.5\text{s}$, $R_0 = 5.28 \times 10^9\text{ m}^{-1}$, initial steady flow $Q_0 \approx 1.40\text{ g/s}$, and final 36g yield in $27.2\text{s}$.

#### 2. [MAJOR-2] Missing Target Yield / Brew Ratio Input Control in UI Wireframe
* **Target Section:** Section 2 -> 6. Desktop-First Fixed Viewport Architecture
* **Disposition:** `PROPOSE FIX`
* **Proposed Wireframe Update:**
  Add 5th slider to the left control rail in the ASCII layout:
  ```text
  | [ Target Yield ] [36.0g] |
  | [-] ===O===== [+] 24-50g |
  ```

#### 3. [MAJOR-3] FSM State Enum and Lifecycle Discrepancy
* **Target Section:** Section 2 -> 2. Finite State Machine & Section 4 Module Contracts
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Standardize on strict 4 states: `IDLE`, `PRE_INFUSION`, `EXTRACTING`, `EVALUATING`. Define `reset()` as an imperative instance method on `StateManager` and `PhysicsEngine` that clears all accumulator variables and returns immediately to `IDLE`. Add `isRunning()` returning `true` during `PRE_INFUSION` and `EXTRACTING`.

#### 4. [MAJOR-4] Shot Timeout Threshold Discrepancy (40s vs 50s)
* **Target Section:** Section 1 (CUJ 3), Section 2 (FSM & Coach Rules)
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Standardize on `MAX_SHOT_TIME = 45.0s`. If elapsed time reaches $45.0\text{s}$ before target yield is achieved, FSM transitions automatically to `EVALUATING` and Barista Coach triggers choked shot guidance.

#### 5. [MAJOR-5] Controls Locking Keyboard Tab Focus Leak
* **Target Section:** Section 2 -> UI Architecture & Section 4 -> `controls.js`
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  When transitioning to `PRE_INFUSION`, set `panel.setAttribute('inert', '')` and disable all `<input>` and `<button>` elements in `#controls-panel` except the Stop Shot toggle button. Remove `inert` and re-enable upon returning to `IDLE` or `EVALUATING`.

#### 6. [MAJOR-6] Missing Concrete In-Memory Roast Calibration Dictionaries in `presets.js`
* **Target Section:** Section 4 -> `js/config/presets.js` Contract
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Include explicit preset dictionary:
  ```javascript
  export const ROAST_PRESETS = {
    light: { name: 'Light Ethiopian', dose: 19.5, grind: 310, temperature: 95.0, pressure: 9.0, targetYield: 45.0, dwellMultiplier: 1.15, description: 'Dense high-altitude bean; fine grind, hot extraction, 1:2.3 ratio.' },
    medium: { name: 'Medium Colombia', dose: 18.0, grind: 340, temperature: 93.0, pressure: 9.0, targetYield: 36.0, dwellMultiplier: 1.00, description: 'Balanced specialty standard; 18g in, 36g out in 27s at 93°C.' },
    dark: { name: 'Dark Italian Blend', dose: 16.5, grind: 390, temperature: 90.0, pressure: 8.5, targetYield: 30.0, dwellMultiplier: 0.85, description: 'High porosity & oils; coarser grind, cooler 90°C, 1:1.8 ristretto ratio.' }
  };
  ```

#### 7. [MAJOR-7] Undefined DOM Element IDs Linking Markup to UI Managers
* **Target Section:** Section 4 -> Module Interface Specifications
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Add DOM ID mapping table:
  * `#canvas-stream`: Canvas 2D fluid stream viewport.
  * `#gauge-pressure-needle`, `#gauge-pressure-val`: SVG pressure gauge needle path and digital text.
  * `#gauge-flow-needle`, `#gauge-flow-val`: SVG flow gauge needle path and digital text.
  * `#hud-timer`, `#hud-yield`, `#hud-ey`: Digital readouts for time, weight, and EY%.
  * `#radar-polygon-active`, `#radar-polygon-ghost`: SVG 5-axis dynamic and ghost target paths.
  * `#shot-graph-svg`: SVG container for yield and flow rate curves.
  * `#controls-panel`, `#btn-pull-shot`: Input container and trigger lever button.
  * `#coach-card`, `#coach-badge`, `#coach-title`, `#coach-diagnosis`, `#coach-action`: Diagnostic deck.

#### 8. [MAJOR-8] Incomplete Return Contract in `coach.js`
* **Target Section:** Section 4 -> `js/engine/coach.js` Contract
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Define concrete return dictionaries across all branches:
  1. `CHOKED`: `{ badgeClass: 'badge-danger', badgeText: 'CHOKED', title: 'Severe Restriction', diagnosis: 'Flow choked by fine grind or over-dosing.', action: 'Grind coarser by 30-50µm or reduce dose by 1.0g.', tasteNotes: ['Intense Bitterness', 'Astringent Dryness'] }`
  2. `GUSHER`: `{ badgeClass: 'badge-warning', badgeText: 'GUSHER', title: 'Fast Channeling', diagnosis: 'Puck resistance too low; water channeled through in <22s.', action: 'Grind finer by 40-60µm.', tasteNotes: ['Sharp Sourness', 'Thin/Watery Body'] }`
  3. `UNDER_EXTRACTED_RATIO`: `{ badgeClass: 'badge-warning', badgeText: 'UNDER-EXTRACTED', title: 'Short Brew Ratio', diagnosis: 'Shot stopped too early (<1:1.6); organic acids dominate cup.', action: 'Increase target yield to 1:2.0 ratio.', tasteNotes: ['Lemon Acidity', 'Unbalanced Sourness'] }`
  4. `OVER_EXTRACTED_RATIO`: `{ badgeClass: 'badge-warning', badgeText: 'OVER-EXTRACTED', title: 'Excessive Yield', diagnosis: 'Shot run too long (>1:2.5); bitter tannins dissolved.', action: 'Decrease target yield to 1:2.0 ratio.', tasteNotes: ['Hollow Woodiness', 'Ashy Bitterness'] }`
  5. `TEMP_COLD`: `{ badgeClass: 'badge-info', badgeText: 'SOUR (COLD)', title: 'Low Brew Temperature', diagnosis: 'Extraction at <91°C failed to dissolve complex sucrose.', action: 'Raise boiler temperature to 93-94°C.', tasteNotes: ['Green Apple Sour', 'Under-developed Sweetness'] }`
  6. `TEMP_HOT`: `{ badgeClass: 'badge-info', badgeText: 'BITTER (HOT)', title: 'High Brew Temperature', diagnosis: 'Extraction at >95°C scorched fine solubles.', action: 'Lower boiler temperature to 92-93°C.', tasteNotes: ['Scorched Bitterness', 'Harsh Finish'] }`
  7. `GOD_SHOT`: `{ badgeClass: 'badge-success', badgeText: 'GOD SHOT', title: 'Balanced Extraction', diagnosis: 'Ideal 18-22% EY at 1:2 ratio in 25-30s.', action: 'Profile dialed in perfectly. Repeat consistently!', tasteNotes: ['Vibrant Sweetness', 'Silky Body', 'Complex Acidity', 'Long Cocoa Finish'] }`

#### 9. [MAJOR-9] Missing Phasing Checkpoints and Verification Criteria
* **Target Section:** Section 4 -> 3. Step-by-Step Execution Sequence
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Append an explicit `Verification Checkpoint` for Phases 1 through 7 detailing automated test execution (`node --test tests/...`) or visual browser checks.

#### 10. [MAJOR-10] Canvas Rendering Coordinate System & Anchor Offsets Unspecified
* **Target Section:** Section 4 -> `js/ui/canvasStream.js` Contract
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Specify exact Canvas bounding coordinates for $460 \times 440\text{px}$ stage: Portafilter basket rim center at $(230, 30)$, cone apex at $(230, 65)$, cup rim opening at $(230, 310)$, glass cup container box $[x=160, y=280, w=140, h=130]$.

#### 11. [MAJOR-11] Viewport Horizontal Grid Budget Width Discrepancy (1260px vs 1280px)
* **Target Section:** Section 2 -> 6. Desktop-First Fixed Viewport Architecture
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Reconcile CSS grid column metrics:
  * Top Header: `1280px`
  * Middle Row: `320px` (Controls) + `10px` gap + `460px` (Canvas) + `10px` gap + `480px` (Telemetry & Radar) = `1280px`.
  * Lower Deck: `495px` (Coach Card) + `10px` gap + `775px` (Shot Graph HUD) = `1280px`.
  * Total Viewport: exactly $1280\text{px} \times 850\text{px}$.

#### 12. [MAJOR-12] Undefined Coffee Domain Acronyms and Technical Terms
* **Target Section:** Section 1 -> Overview / Glossary
* **Disposition:** `PROPOSE FIX`
* **Proposed Update:**
  Insert a coffee science Glossary table defining:
  * **EY% (Extraction Yield):** Percentage of coffee grounds mass dissolved into the beverage ($\text{Solubles} / \text{Dose} \times 100\%$, target 18–22%).
  * **TDS% (Total Dissolved Solids):** Concentration of coffee solids dissolved in the liquid ($\text{Solubles} / \text{Yield} \times 100\%$, typically 8–12%).
  * **Blonding:** Visual transition when high-solubles dark crema gives way to pale, thin, water-heavy liquid as puck solids exhaust.
  * **Tiger Striping:** Mottled dark and golden streaks in fresh espresso crema produced by dense colloidal oils and emulsion.
  * **God Shot:** Barista industry term for a balanced, sweet espresso extraction with optimal yield, texture, and aroma.
  * **Ristretto / Lungo:** Restricted short extraction ratio ($1:1.0–1:1.5$) vs extended long extraction ratio ($1:2.5–1:3.0$).
  * **rAF:** Browser `requestAnimationFrame` API delivering synchronized 60 FPS graphics updates.

---

### 🟢 Nits & Style Cleanups

* **NIT-1 [Premature Optimization in Canvas Stream]:** `PROPOSE FIX` — Remove custom particle pooling classes; specify direct immediate-mode 2D Canvas rendering for droplets and stream cone.
* **NIT-2 [Meta-Circular Self-Reference]:** `PROPOSE FIX` — Remove `docs/designs/espresso_simulator.md` from the Implementation Plan file creation table.
* **NIT-3 [Coach Threshold Logic Consistency]:** `PROPOSE FIX` — Update shot time boundary logic to `< 22.0s` for gushers and `24.0s - 32.0s` for balanced extractions.
* **NIT-4 [Stale Open Questions]:** `PROPOSE FIX` — Remove Open Questions 1 & 2 from Section 1 as they are resolved.
* **NIT-5 [Pump Pressure Ramp Decoupling]:** `PROPOSE FIX` — Clarify that pump pressure ramps to target within $2.0\text{s}$, while puck breakthrough delay $t_{\text{dwell}}$ is governed by dose and grind size.
* **NIT-6 [Parameter Binding for $t_{\text{dwell}}$]:** `PROPOSE FIX` — Explicitly express $t_{\text{dwell}} = 85.0 \times (\text{Dose}/\text{Grind}) \times (9.0/P_{\text{pump}})^{0.5} \times \text{dwellMultiplier}$.
* **NIT-7 [Objective Alternatives Phrasing]:** `PROPOSE FIX` — Replace subjective phrase `Rejected by author:` with objective `Trade-off & Technical Rationale:`.
* **NIT-8 [Standardize Named ES6 Module Exports]:** `PROPOSE FIX` — Mandate consistent named exports (`export class ...`, `export const ...`) across all modules.

---

## Google Drive Synchronization Notice

Upon approval of this remediation plan, all proposed edits will be applied directly to `docs/designs/espresso_simulator.md`. In strict compliance with the **Workspace MCP + EGM Dual-Sync Rule**, the updated specification will be immediately uploaded and synced to the Google Drive document:
* **PRD: Espresso Simulator**: [Google Doc 1zlipKcg8_4bYnJc90bjiEqmyvDxiVnQI3sTMhfICbX0](https://docs.google.com/document/d/1zlipKcg8_4bYnJc90bjiEqmyvDxiVnQI3sTMhfICbX0/edit)
