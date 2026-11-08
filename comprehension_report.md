# Comprehension Audit Report: EspressoLab Dial-In Simulator (`docs/designs/espresso_simulator.md`)

* **Target File:** `docs/designs/espresso_simulator.md`
* **Audited Scope:** Lines 1–421 (Feature Range) & Lines 422–555 (Detailed Range)
* **Auditor:** Comprehension Goldfish (`egm-comprehension`)
* **Mode:** REVIEW

---

## 1. Paraphrase of Specification

### What this proposes
EspressoLab is a proposed client-side, zero-dependency educational web application built with vanilla JavaScript (ES6+), HTML5 Canvas, SVG, and CSS to simulate espresso extraction fluid dynamics and flavor profiles. It models the physical brewing process using Darcy's law for porous media within a decoupled, 60Hz fixed-step numerical integration loop that calculates flow rate, cumulative mass yield, and extraction yield from user-selected grind size, dose, water temperature, and pump pressure. The interface features a 60 FPS Canvas fluid stream and crema animation, dual SVG dial gauges, an SVG 5-axis flavor radar polygon, and a post-shot diagnostic coach that enforces a 3-tier calibration hierarchy, all contained within a fixed 1280x850 desktop viewport.

### How the existing system works, per this document
The document describes no existing software simulator or digital implementation currently in place. Instead, home baristas presently dial in espresso through an expensive physical trial-and-error process where adjusting coupled, non-linear variables (grind, dose, temperature, pressure) leads to confusing sensory outcomes and wasted specialty coffee beans ($1.50–$3.00 per attempt). Furthermore, real espresso machines operate as black boxes that display only basic time or pressure while concealing fluid velocity, dynamic bed compaction resistance, and soluble dissolution, leaving novices without an intuitive physical mental model.

---

## 2. Findings & Discrepancy Analysis

### 🔴 Blocker 1: Missing Formulas for Extraction Yield ($EY\%$), Total Dissolved Solids ($TDS\%$), Soluble Concentration ($C_{\text{sol}}(t)$), and `blondingFraction`
* **Severity:** Blocker
* **Affected Scope:** Lines 180–244 (Section 2: Extraction Physics & Mathematical Model), Line 255, Lines 467–468, Line 491.
* **Discrepancy Description & Rationale:**
  The document repeatedly references $EY\%$ (Extraction Yield), $TDS\%$ (Total Dissolved Solids), $C_{\text{sol}}(t)$ (instantaneous soluble concentration), and `blondingFraction` as essential metrics driving the entire application:
  1. Instantaneous stream color gradation depends explicitly on $C_{\text{sol}}(t)$ (Line 255: umber when $>10\%$, tiger when $5–10\%$, blonding when $<5\%$, and Line 491: `color gradient interpolation based on blondingFraction`).
  2. The 5-axis Flavor Radar equations directly take $EY$ as their primary input argument (Lines 278, 280, 284).
  3. The Barista Coach evaluates $EY\%$ in Step 3 (Line 341).
  4. The Physics Engine contract explicitly promises: `Computes instantaneous Extraction Yield EY%(t) and Total Dissolved Solids TDS%(t)` (Line 467) and returns `{ ey, tds, blondingFraction }` in `getTelemetry()` (Line 468).

  However, Section 2 (**Extraction Physics & Mathematical Model**) contains **no mathematical equations** defining how $EY\%(t)$, $TDS\%(t)$, $C_{\text{sol}}(t)$, or `blondingFraction` are computed from flow rate, contact time, water temperature, or dissolved mass. In physical chemistry, $EY\% = (\text{Yield} \times TDS\%) / \text{Dose}$, and $TDS\% = \text{Dissolved Mass} / \text{Yield}$. While the document defines puck erosion $R_{\text{bed}}(t)$ as a function of $Y(t)/\text{Dose}$ (Line 209), it omits the differential dissolution kinetics of coffee solids. Without these formulas, an engineer cannot implement `physics.js`, cannot feed `flavorRadar.js`, and cannot render the dynamic color shift in `canvasStream.js`.

---

### 🔴 Blocker 2: Severe Mathematical Divergence Between 5-Axis Sensory Equations and Target Baseline Polygon Values
* **Severity:** Blocker
* **Affected Scope:** Lines 275–288 (Section 3: SVG 5-Axis Flavor Radar)
* **Discrepancy Description & Rationale:**
  Line 288 defines the reference static "Target Ghost Band" for an optimal God Shot ($EY = 20.0\%$, Brew Ratio $= 1:2.0$, $T = 93.0^\circ\text{C}$, $\text{Dose} = 18.0\text{g}$) as:
  $$\{ S=0.35, W=0.90, D=0.65, B=0.30, C=0.70 \}$$
  
  However, substituting the exact baseline dial-in values into the documented formulas (Lines 277–286) produces severe contradictions:
  * **Sourness ($S$):**
    $$S = \text{clamp}\left(1.0 - \frac{20.0 - 12}{8}, 0.05, 1.0\right) \times \left(1.0 + 0.5 \cdot \max\left(0, \frac{91 - 93}{10}\right)\right) = \text{clamp}(0.0, 0.05, 1.0) \times 1.0 = \mathbf{0.05}$$
    *Discrepancy:* The formula clamps to the absolute floor of $\mathbf{0.05}$, whereas the documented target band is $\mathbf{0.35}$ (a 7x error).
  * **Sweetness ($W$):**
    $$W = \exp\left(-\frac{(20.0 - 20.0)^2}{2 \times (1.8)^2}\right) \times \exp\left(-\frac{(93.0 - 93.0)^2}{2 \times (2.0)^2}\right) = \exp(0) \times \exp(0) = \mathbf{1.00}$$
    *Discrepancy:* The formula yields $\mathbf{1.00}$, whereas the documented target band is $\mathbf{0.90}$.
  * **Body ($D$):**
    $$D = \text{clamp}\left(\frac{18.0}{20} \times \frac{1.9}{2.0}, 0.1, 1.0\right) = 0.90 \times 0.95 = \mathbf{0.855}$$
    *Discrepancy:* The formula yields $\mathbf{0.855}$, whereas the documented target band is $\mathbf{0.65}$.
  * **Clarity ($C$):**
    $$C = \text{clamp}\left(\frac{2.0 - 1.6}{0.8} \times (1.0 - 0.4 \times 0.855), 0.1, 1.0\right) = 0.50 \times 0.658 = \mathbf{0.329}$$
    *Discrepancy:* The formula yields $\mathbf{0.329}$, whereas the documented target band is $\mathbf{0.70}$ (over a 2x error).

  A developer implementing these equations will find that a perfectly dialed-in "God Shot" produces a radar shape that grossly misaligns with the static golden target polygon displayed on screen. The equations and the target band constants are mutually incompatible.

---

### 🔴 Blocker 3: Complete Architecture and Specification Void for the 780px Extraction Graph HUD
* **Severity:** Blocker
* **Affected Scope:** Lines 378–383 (Section 6: Viewport Budgeting), Lines 110–132 (High-Level Architecture), Lines 426–440 (File Inventory), Lines 444–522 (Module Interface Specifications).
* **Discrepancy Description & Rationale:**
  In the Viewport Budgeting diagram (Lines 378–383), a massive container ($780\text{px} \times 260\text{px}$) is allocated at the bottom right for:
  ```text
  |  EXTRACTION GRAPH HUD (780px)         |
  |  Yield (g) & Flow Rate (g/s) vs Time  | (260px)
  |  [--- Actual Yield Curve            ] |
  |  [... Ghost Target Zone             ] |
  ```
  Furthermore, `state.js` implements `recordTelemetryPoint(point): Appends data point to time-series history buffer for the extraction chart` (Line 476), and the FSM mentions clearing "graph buffers" upon reset (Line 309).

  However, across the High-Level Architecture (Lines 110–132), File Inventory (Lines 426–440), and Module Interface Specifications (Lines 444–522), **there is no component, class, or script dedicated to rendering this graph**:
  * `canvasStream.js` only renders the portafilter head, fluid cone, droplets, and cup crema (Lines 484–494).
  * `svgGauges.js` only manages two radial needle dials (Pressure and Flow) and digital text strings (Lines 495–502).
  * `flavorRadar.js` only renders the 5-axis pentagonal radar (Lines 503–508).

  An entire major quadrant of the user interface (the dual-curve time-series extraction graph) has been visually diagrammed and backed by state history buffers, but has zero architectural presence, no assigned module, and no rendering contract.

---

### 🟠 Major 4: Missing Numerical Constants, Units, and SI Conversion in Darcy Hydraulic Formulation
* **Severity:** Major
* **Affected Scope:** Lines 180–211 (Section 2: Extraction Physics & Mathematical Model)
* **Discrepancy Description & Rationale:**
  1. **Dimensional Scaling Discrepancy:** Darcy's law is stated as $Q(t) = \frac{\Delta P(t) \cdot A}{\mu(T) \cdot R_{\text{bed}}(t)}$ with $Q(t)$ in $\text{g/s}$, $\Delta P$ in $\text{Pa}$, $A$ in $\text{m}^2$, and $\mu$ in $\text{Pa}\cdot\text{s}$. Standard SI dimensional analysis yields volumetric flow in cubic meters per second ($\text{m}^3/\text{s}$). For aqueous fluid ($\rho = 1.0\text{ g/cm}^3 = 10^6\text{ g/m}^3$), $Q(\text{g/s}) = Q(\text{m}^3/\text{s}) \times 10^6$. Omitting this $10^6$ density conversion or failing to specify the non-standard physical dimensions of $R_{\text{bed}}$ guarantees a $1,000,000\times$ unit error during implementation.
  2. **Undefined Empirical Constants:**
     * $R_0 = k_{\text{grain}} \cdot \frac{\text{Dose}^{1.25}}{(\text{GrindMicrons})^{2.6}}$: The document states $k_{\text{grain}}$ is "calibrated to yield 1.4 g/s at 340 µm, 18g dose, and 9 bar", but never provides the numerical scalar or its dimensions.
     * $t_{\text{dwell}} = k_{\text{dwell}} \cdot \frac{\text{Dose}}{\text{GrindMicrons}} \cdot \left(\frac{9.0}{P_{\text{pump}}}\right)^{0.5}$: The constant $k_{\text{dwell}}$ is never defined with a numerical value or units.
  A developer reading this document cannot write functional, deterministic physics code without inventing arbitrary scaling constants.

---

### 🟠 Major 5: Absence of UI Control and Workflow Specification for Target Yield / Brew Ratio
* **Severity:** Major
* **Affected Scope:** Lines 358–377 (Section 6: Viewport Budgeting), Line 79 (CUJ 1), Lines 329–337 (Barista Coach Step 2), Line 454 (`presets.js`), Line 475 (`state.js`).
* **Discrepancy Description & Rationale:**
  The system behavior relies heavily on a `targetYield` variable:
  * Shots terminate automatically when target yield is reached (Line 79, Line 300).
  * `presets.js` defines `targetYield: number (grams, 28.0–55.0)` (Line 454).
  * In Step 2 of the Barista Coach (Priority 2: Brew Ratio), the coach explicitly tells the user: *"Increase target yield to 1:2.0 to extract balancing sugars"* or *"Cut shot earlier at 1:2.0 to avoid late-stage blonding bitterness"* (Lines 332, 336).

  However, in the Viewport Budgeting layout (Lines 358–377), the **Input Controls column (320px) only provides four sliders**: Dose, Grind, Water Temp, and Pump Pressure. There is no slider, stepper, or input field for Target Yield or Brew Ratio.
  * If Target Yield is locked to bean presets, how does the user adjust it in response to the Coach's diagnosis?
  * If Target Yield dynamically scales as a $1:2$ multiplier of Dose, how can a user ever pull a Ristretto ($1:1.5$) or Lungo ($1:2.5$)?
  The mechanism for controlling Target Yield is completely unstated in the UI specification.

---

### 🟠 Major 6: Undefined Coffee Domain Acronyms and Technical Terms
* **Severity:** Major
* **Affected Scope:** Lines 35–43, 82, 128, 150, 207, 257, 331, 350, 467.
* **Discrepancy Description & Rationale:**
  The document assumes substantial pre-existing domain knowledge of coffee brewing and web engineering jargon that is not defined inline or hyperlinked:
  * **TDS** (Line 467): Total Dissolved Solids; used without explaining what it measures or how it is calculated.
  * **EY / EY%** (Lines 39, 40, 80, 265, 435, 467): Extraction Yield; used as a primary metric without its standard industry definition ($EY\% = \frac{\text{Yield} \times TDS\%}{\text{Dose}}$).
  * **Blonding** (Lines 35, 78, 207, 258, 336): Used as both a physical process and visual state without defining that it represents the depletion of soluble solids when stream color turns light amber/tan.
  * **Tiger Striping** (Lines 38, 78, 157, 257): Used to describe stream visual appearance without defining what causes the striations (swirling emulsion of crema and dark liquid).
  * **God Shot** (Lines 82, 350): Barista vernacular for an ideal, balanced espresso extraction; ambiguous to an uninitiated software engineer.
  * **Ristretto / Lungo** (Lines 43, 331, 335): Traditional Italian extraction ratio classifications ($<1:1.8$ and $>1:2.3$) used without explanation.
  * **HUD** (Lines 128, 158, 378, 435): Heads-Up Display; acronym never expanded.
  * **rAF / rAFClock** (Lines 131, 150, 213, 519): Industry abbreviation for `requestAnimationFrame`; should be defined at first mention in architecture diagrams.

---

### 🟡 Nit 7: Inconsistency Between Barista Coach Threshold Logic and Annotated Decision Comments
* **Severity:** Nit
* **Affected Scope:** Lines 318–348 (Section 5: Barista Coach Diagnostic Decision Tree)
* **Discrepancy Description & Rationale:**
  1. In Step 1 (Flow/Grind), the conditional logic is:
     `IF Total Shot Time < 22.0s ... ELSE IF Total Shot Time > 35.0s ... ELSE`
     The accompanying comment reads: `ELSE (Flow in Normal Window: 24.0s - 32.0s)`.
     A shot time of $23.0\text{s}$ or $33.5\text{s}$ falls into the `ELSE` branch (proceeding to Step 2) even though it sits outside the documented "24.0s - 32.0s" window.
  2. In Step 2 (Brew Ratio), the logic is:
     `IF Brew Ratio < 1:1.85 ... ELSE IF Brew Ratio > 1:2.35 ... ELSE`
     The accompanying comment reads: `ELSE (Ratio in Target Window: 1:1.9 - 1:2.2)`.
     A ratio of $1:1.88$ falls into the balanced window despite being below the annotated $1:1.9$ target.
  The conditional comparison operators and the annotated human-readable target windows should be made consistent.

---

### 🟡 Nit 8: Open Questions Section Retains Questions Already Answered in Implementation Plan
* **Severity:** Nit
* **Affected Scope:** Lines 62–66 (Open Questions) vs. Lines 486, 507.
* **Discrepancy Description & Rationale:**
  * Open Question 1 asks: *"Should the Canvas buffer explicitly query `window.devicePixelRatio` and scale its backing store (2x width/height)...?"* Line 486 in the Detailed Implementation Plan explicitly settles this: `sets backing resolution based on devicePixelRatio`.
  * Open Question 2 asks: *"Should the flavor radar polygon animate continuously in real time... or update only upon shot termination...?"* Line 308, Line 436, and Line 507 settle this by stating the radar evaluates metrics post-shot in the `EVALUATING` state.
  The Open Questions section should reflect that both architectural decisions have been resolved.

---

### 🟡 Nit 9: Ambiguous Relationship Between $k_{\text{dwell}}$ (Physics Model) and `dwellMultiplier` (Roast Presets)
* **Severity:** Nit
* **Affected Scope:** Line 203 vs. Line 455.
* **Discrepancy Description & Rationale:**
  The physics equation for puck saturation dwell time in Section 2 (Line 203) uses scalar constant $k_{\text{dwell}}$:
  $$t_{\text{dwell}} = k_{\text{dwell}} \cdot \frac{\text{Dose}}{\text{GrindMicrons}} \cdot \left(\frac{9.0}{P_{\text{pump}}}\right)^{0.5}$$
  Meanwhile, the `presets.js` contract (Line 455) defines `dwellMultiplier: number (cellular density adjustment factor)`.
  The document does not explicitly specify how `dwellMultiplier` modifies $k_{\text{dwell}}$ (e.g., $t_{\text{dwell}} = k_{\text{dwell}} \cdot \text{dwellMultiplier} \dots$), leaving the parameter binding ambiguous.
