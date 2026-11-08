# EspressoLab: Client-Side Espresso Dial-In Simulator

* **Author:** Vinay Vyas
* **Date:** 2026-11-06

## Overview

EspressoLab is a client-side educational single-page application (SPA) that models the physical and sensory dynamics of espresso extraction. Built entirely in vanilla JavaScript, HTML5 Canvas, SVG, and CSS3 with zero runtime dependencies and zero backend, it operates inside a fixed 1280x850 desktop-first viewport without page scrolling.

The application allows home baristas to explore how four key inputs—Grind Size (200–500 µm), Dose (14–22 g), Water Temperature (88–96 °C), and Pump Pressure (6–12 bar)—interact to govern extraction flow rate, cumulative yield, extraction yield percentage (EY%), and resulting cup flavor balance. 

By uniting a discrete frame-integrated Darcy extraction model, dual-layer Canvas/SVG real-time telemetry, a 5-axis flavor radar (Sour, Bitter, Body, Sweetness, Clarity), and a prioritized barista coach diagnostic engine, EspressoLab turns complex fluid extraction mechanics into intuitive, reproducible cause-and-effect learning.

---

## Analysis

### 1. Extraction Physics & Dynamic Porous Bed Mechanics
Espresso extraction through an unpressurized 58mm basket is governed by porous media fluid dynamics described by Darcy's law:

$$Q(t) = \frac{\Delta P(t) \cdot A}{\mu(T) \cdot R_{\text{bed}}(t)}$$

Where:
* $Q(t)$ is the volumetric flow rate exiting the basket ($m^3/s$ or $g/s$ assuming $\rho \approx 1.0\text{ g/cm}^3$).
* $\Delta P(t)$ is the net hydraulic pressure difference across the compressed coffee puck ($6 - 12\text{ bar} = 6 \times 10^5 - 1.2 \times 10^6\text{ Pa}$).
* $A$ is the cross-sectional filtration area ($\approx 2.64 \times 10^{-3}\text{ m}^2$ for a 58mm commercial portafilter).
* $\mu(T)$ is the dynamic viscosity of water as a function of temperature:
  $$\mu(T) \approx 2.414 \times 10^{-5} \times 10^{\frac{247.8}{T + 133.15}}\text{ Pa}\cdot\text{s}$$
* $R_{\text{bed}}(t)$ is the dynamic hydraulic bed resistance.

#### Dynamic Three-Phase Shot Evolution
Static application of Darcy's law fails because an espresso puck is not a rigid filter; it compacts under pressure, saturates, and erodes as soluble compounds wash out:
1. **Phase 1: Pre-Infusion & Saturation Dwell ($0 \le t \le t_{\text{dwell}}$):**
   * Duration: $4.0 - 6.0\text{s}$ determined by dose compaction and grind fineness.
   * Pump pressure ramps linearly from 0 to target $\Delta P$.
   * Output flow is strictly zero ($Q(t) = 0\text{ g/s}$) while the puck absorbs approximately $1.2\times\text{Dose}$ in liquid water.
2. **Phase 2: Peak Extraction ($t_{\text{dwell}} < t \le t_{\text{peak}} \sim 15\text{s}$):**
   * First drops detach and coalesce into a unified extraction cone.
   * Bed resistance peaks at initial resistance $R_0$:
     $$R_0 = k_g \cdot \frac{\text{Dose}^{1.2}}{(\text{GrindMicrons})^{2.5}}$$
   * Flow rate stabilizes in the steady extraction window ($1.2 - 1.8\text{ g/s}$). Soluble concentration ($TDS\%$) is at its peak.
3. **Phase 3: Late Blonding & Puck Erosion ($t > 15\text{s}$):**
   * As soluble solids dissolve and wash out of the cellular matrix, puck resistance decays quadratically with accumulated yield:
     $$R_{\text{bed}}(t) = R_0 \cdot \left[1 - \beta \cdot \left(\frac{Y(t)}{\text{Dose}}\right)\right]^2$$
     (where $\beta \approx 0.28$ is the soluble erosion coefficient).
   * Flow rate accelerates ($2.5 - 3.5\text{ g/s}$), stream transparency increases ("blonding"), and extraction shifts from rich lipids/acids to astringent polyphenols.

---

### 2. Numerical Integration & Mass Conservation Invariant
To prevent timing glitches and numerical drift across displays with differing refresh rates (60Hz, 120Hz ProMotion, 144Hz):
* **Decoupled Fixed-Step Integration:** The physics simulation steps at a fixed $\Delta t = 1/60\text{s}$ ($16.667\text{ms}$) inside an accumulator loop decoupled from `requestAnimationFrame`.
* **Mass Invariant:** Cumulative cup yield $Y(t)$ is updated strictly as the discrete integral of instantaneous flow:
  $$Y(t + \Delta t) = Y(t) + Q(t) \cdot \Delta t$$
  Ensuring the flow meter gauge ($g/s$) and the digital scale ($g$) remain mathematically synchronized down to $\pm 0.01\text{g}$.
* **Lock-on-Pull State:** Parameter sliders lock with a frosted glass mask during the pull. Users can execute an emergency "Stop Shot / Cut Flow" trigger at any time.

---

### 3. Dual-Layer Rendering Architecture
To guarantee 60 FPS animation without DOM layout thrashing or font blurriness:
* **HTML5 Canvas (Center Stage 460px):** Dedicated solely to high-frequency fluid rendering:
  * Portafilter basket bottom, droplet formation, cone stream coalescence.
  * Fluid color grading over time: dark viscous umber $\rightarrow$ golden tiger striping $\rightarrow$ translucent straw-yellow blonding.
  * Stratified liquid cup accumulation with a persistent, settling crema foam layer.
  * Pre-allocated particle structures to eliminate garbage collection pauses.
* **SVG / DOM HUD (Flanks & Lower Panels):**
  * Left rail: Tactile sliders and steppers.
  * Right upper rail: Dual needle telemetry gauges for Pump Pressure (bar) and Real-Time Flow Rate ($Q(t)$ in g/s).
  * Right mid rail: Interactive 5-axis Flavor Radar SVG polygon.
  * Lower deck: Telemetry time-series shot graph and Barista Coach diagnostic card.

---

### 4. Flavor Radar Kinetics & Sensory Derivation
The 5 flavor axes (normalized $0.0 - 1.0$) are calculated deterministically at the conclusion of the shot based on Extraction Yield ($EY\%$), Brew Ratio ($Y/\text{Dose}$), Water Temperature ($T$), and Shot Time ($t_{\text{shot}}$):
* **Target Sweet Spot:** $18.0\% - 22.0\% \text{ EY}$ at a $1:2.0$ ratio in $25 - 30\text{s}$ at $93^\circ\text{C}$.
* **Sourness Axis:** Spikes when $EY < 18\%$. Exacerbated by low temperature ($T < 91^\circ\text{C}$) and tight short yields ($< 1:1.8$). Driven by rapidly extracting organic acids (citric, malic) remaining unbuffered by later sugars.
* **Bitterness Axis:** Spikes when $EY > 22\%$. Exacerbated by excessive temperature ($T > 95^\circ\text{C}$) and over-yield ($> 1:2.4$). Driven by slow-dissolving heavy polyphenols, chlorogenic acid breakdown products, and caffeine.
* **Body Axis:** Maximized at high dose ($20 - 22\text{g}$) and concentrated brew ratios ($1:1.5 - 1:1.8$). Reflects suspended micro-fines and lipid emulsion concentration.
* **Sweetness Axis:** Peaks sharply in the balanced window ($19.5 - 21.0\% \text{ EY}$, $T = 92 - 94^\circ\text{C}$, $26 - 29\text{s}$). Requires adequate dissolution of sucrose and complex carbohydrates without over-extracting bitter tannins.
* **Clarity Axis:** Maximized at extended ratios ($1:2.2 - 1:2.5$), lighter roasts, and uniform laminar flow. Measures distinct flavor note separation and crisp acidity definition.

---

### 5. Barista Coach Diagnostic Rule Engine
The post-shot Barista Coach strictly enforces a single-variable diagnostic hierarchy, matching professional barista calibration protocol:

```text
Priority 1: Flow Rate & Shot Time (Choke vs. Gusher)
   │
   ├── Shot Time < 22s OR Q_avg > 2.5 g/s ──> GUSHER: Grind 2-3 clicks finer.
   │
   ├── Shot Time > 35s OR Q_avg < 1.0 g/s ──> CHOKED: Grind 2 clicks coarser.
   │
   └── Flow in Range (25-30s) ──> Priority 2: Brew Ratio Check
                                      │
                                      ├── Ratio < 1:1.8 ──> RISTRETTO: Sour/Heavy; extend yield to 1:2.
                                      │
                                      ├── Ratio > 1:2.4 ──> LUNGO: Bitter/Hollow; cut shot earlier.
                                      │
                                      └── Ratio in Range (1:1.9 - 1:2.2) ──> Priority 3: Thermal Fine-Tuning
                                                                                 │
                                                                                 ├── Temp < 91°C & EY < 19% ──> Increase Temp to 93-94°C.
                                                                                 │
                                                                                 ├── Temp > 95°C & Bitter ──> Lower Temp to 92-93°C.
                                                                                 │
                                                                                 └── Optimal ──> "PERFECT EXTRACTION (God Shot)"
```

---

### 6. Viewport Budgeting & Responsive Transform
To guarantee zero-scroll operation on a 1280x850 canvas while supporting varied displays:
* Outer container enforces fixed dimensions: `width: 1280px; height: 850px; overflow: hidden;`.
* High-level grid breakdown:
  * Header Bar: `50px` height.
  * Operating Stage: `540px` height (Left Inputs 320px, Center Canvas 460px, Right Telemetry & Radar 480px).
  * Lower Diagnostic Deck: `260px` height (Barista Coach card 500px, Shot Curve Graph 780px).
* CSS viewport scale wrapper: Uses `transform: scale(min(w/1280, h/850))` anchored at `transform-origin: center center` to fit smaller or larger laptop screens without reflowing or breaking elements.

---

## Goals vs. Non-Goals

### In-Scope Goals
* **Pure Client-Side Vanilla Architecture:** 100% static HTML5, CSS3, SVG, and ES6+ JavaScript with zero build steps, zero package dependencies, and zero backend.
* **Deterministic Porous Bed Fluid Simulation:** Darcy equation coupled with pre-infusion saturation delay and late-shot resistance erosion.
* **Discrete Numerical Integrator:** Decoupled fixed-step ($1/60\text{s}$) accumulator guaranteeing mass conservation ($Y = \int Q dt$) and telemetry synchronization.
* **Dual-Layer Visual Pipeline:** Canvas for 60 FPS portafilter stream coalescence, blonding color gradient, and crema settling; SVG for crisp telemetry gauges and 5-axis flavor polygon.
* **Educational Barista Coach:** Prioritized diagnostic feedback hierarchy targeting $18-22\% \text{ EY}$ at $1:2$ in $25-30\text{s}$.
* **In-Memory Roast Presets:** Three preset configurations (Light Ethiopian, Medium Colombia, Dark Italian Blend) illustrating distinct dial-in profiles.
* **Fixed Viewport Compliance:** 1280x850 single-screen layout with zero scrollbars.

### Out-of-Scope Non-Goals
* **No Backend Server or Remote APIs:** No user accounts, database queries, or server-side telemetry logging.
* **No External Frontend Libraries:** Explicitly excludes React, Vue, D3.js, Chart.js, Tailwind, or Lodash.
* **No Non-Deterministic Micro-Channeling Spritzers:** Excludes stochastic water jetting, basket defect modeling, and uneven tamping physics, which introduce noisy pedagogical feedback.
* **No Persistent Database or LocalStorage:** Runs purely in volatile memory; refreshing resets to baseline state.
* **No Mobile Responsive Redesign:** Specifically engineered as a desktop-first simulator (1280x850 layout).

---

## Alternatives Weighed

* **WebWorker Threaded Physics Engine:**
  * *Rejected by author:* Darcy equations and discrete frame stepping execute in under $0.05\text{ms}$ per tick on standard hardware. Thread serialization overhead (`postMessage`) exceeds computation time and adds unnecessary architectural complexity.
* **Full Canvas Rendering (Single Surface):**
  * *Rejected by author:* Drawing all text, sliders, needles, and radar charts onto a single Canvas compromises crispness on Retina displays, eliminates native DOM slider accessibility, and complicates event hit-testing.
* **Full SVG/DOM Rendering for Fluid Stream:**
  * *Rejected by author:* Creating and updating hundreds of individual SVG path elements and circle nodes at 60 FPS causes browser DOM layout thrashing and frame drops.
* **Pure Closed-Form Algebraic Flow Formula:**
  * *Rejected by author:* Static time-based curves ($Q = f(t)$) without numerical integration create mass discrepancy errors where scale yield and flow meter telemetry fall out of sync.
* **Simultaneous Multi-Variable Coach Warnings:**
  * *Rejected by author:* Presenting simultaneous advice for grind, ratio, and temperature overwhelms users. Barista training demands strict single-variable iteration (Flow/Grind $\rightarrow$ Ratio $\rightarrow$ Temperature).

---

## Key Decisions & Staging for Next Steps

1. **Fixed Timestep Invariant ($1/60\text{s}$):** Physics engine will compute state transitions independently of screen refresh rate, with yield accumulated via exact discrete stepping.
2. **Component File Structure:** Modular ES6 files (`index.html`, `css/styles.css`, `js/engine/physics.js`, `js/engine/coach.js`, `js/ui/canvasStream.js`, `js/ui/svgGauges.js`, `js/ui/flavorRadar.js`, `js/app.js`).
3. **Workspace MCP Verification:** Checked for Google Workspace MCP tools; confirmed absent in current environment. Local Markdown artifact `concepts_brief.md` generated and maintained as canonical source.
4. **Transition to `/egm:egm-draft`:** Staged to initialize the formal Technical Specification and PRD under `docs/designs/espresso_simulator.md`.
