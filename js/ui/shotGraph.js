export class ShotGraphRenderer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.width = 775;
    this.height = 240;
    this.padding = { left: 45, right: 30, top: 25, bottom: 30 };

    this.chartW = this.width - this.padding.left - this.padding.right;
    this.chartH = this.height - this.padding.top - this.padding.bottom;

    this.maxTime = 45.0; // seconds
    this.maxYield = 60.0; // grams
    this.maxFlow = 6.0;   // g/s

    this.yieldPath = null;
    this.flowPath = null;

    this.initChart();
  }

  mapX(t) {
    return this.padding.left + (Math.min(this.maxTime, Math.max(0, t)) / this.maxTime) * this.chartW;
  }

  mapYieldY(y) {
    return this.padding.top + this.chartH - (Math.min(this.maxYield, Math.max(0, y)) / this.maxYield) * this.chartH;
  }

  mapFlowY(f) {
    return this.padding.top + this.chartH - (Math.min(this.maxFlow, Math.max(0, f)) / this.maxFlow) * this.chartH;
  }

  initChart() {
    this.svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';

    // 1. Background grid & axes
    const gridGroup = document.createElementNS(ns, 'g');
    gridGroup.setAttribute('class', 'graph-grid');

    // Horizontal grid lines (0, 15g, 30g, 45g, 60g)
    for (let yVal = 0; yVal <= 60; yVal += 15) {
      const y = this.mapYieldY(yVal);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', this.padding.left);
      line.setAttribute('y1', y);
      line.setAttribute('x2', this.padding.left + this.chartW);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#2a2a34');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', yVal > 0 ? '3 3' : 'none');
      gridGroup.appendChild(line);

      // Y-axis label (Yield in grams)
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', this.padding.left - 6);
      label.setAttribute('y', y + 3);
      label.setAttribute('fill', '#f59e0b');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('text-anchor', 'end');
      label.textContent = `${yVal}g`;
      gridGroup.appendChild(label);

      // Secondary Y-axis label (Flow rate in g/s on right)
      const flowVal = (yVal / 10).toFixed(1);
      const flowLabel = document.createElementNS(ns, 'text');
      flowLabel.setAttribute('x', this.padding.left + this.chartW + 6);
      flowLabel.setAttribute('y', y + 3);
      flowLabel.setAttribute('fill', '#14b8a6');
      flowLabel.setAttribute('font-size', '9');
      flowLabel.setAttribute('font-family', 'monospace');
      flowLabel.setAttribute('text-anchor', 'start');
      flowLabel.textContent = `${flowVal}`;
      gridGroup.appendChild(flowLabel);
    }

    // Vertical time grid lines (0, 10, 20, 30, 40, 45s)
    for (let t = 0; t <= 45; t += 5) {
      const x = this.mapX(t);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', this.padding.top);
      line.setAttribute('x2', x);
      line.setAttribute('y2', this.padding.top + this.chartH);
      line.setAttribute('stroke', '#2a2a34');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3 3');
      gridGroup.appendChild(line);

      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', this.padding.top + this.chartH + 16);
      label.setAttribute('fill', '#71717a');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('text-anchor', 'center');
      label.textContent = `${t}s`;
      gridGroup.appendChild(label);
    }

    this.svg.appendChild(gridGroup);

    // 2. Static Ghost Target Envelope (Ideal 25-30s shot reaching 36g)
    const targetPolygon = document.createElementNS(ns, 'polygon');
    const p1 = `${this.mapX(4)},${this.mapYieldY(0)}`;
    const p2 = `${this.mapX(6)},${this.mapYieldY(0)}`;
    const p3 = `${this.mapX(25)},${this.mapYieldY(36)}`;
    const p4 = `${this.mapX(30)},${this.mapYieldY(38)}`;
    const p5 = `${this.mapX(30)},${this.mapYieldY(34)}`;
    const p6 = `${this.mapX(24)},${this.mapYieldY(32)}`;
    targetPolygon.setAttribute('points', `${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`);
    targetPolygon.setAttribute('fill', 'rgba(217, 119, 6, 0.12)');
    targetPolygon.setAttribute('stroke', 'rgba(217, 119, 6, 0.35)');
    targetPolygon.setAttribute('stroke-width', '1');
    targetPolygon.setAttribute('stroke-dasharray', '4 4');
    this.svg.appendChild(targetPolygon);

    // 3. Dynamic Curves
    this.yieldPath = document.createElementNS(ns, 'path');
    this.yieldPath.setAttribute('fill', 'none');
    this.yieldPath.setAttribute('stroke', '#f59e0b');
    this.yieldPath.setAttribute('stroke-width', '2.5');
    this.yieldPath.setAttribute('stroke-linejoin', 'round');
    this.yieldPath.setAttribute('stroke-linecap', 'round');
    this.svg.appendChild(this.yieldPath);

    this.flowPath = document.createElementNS(ns, 'path');
    this.flowPath.setAttribute('fill', 'none');
    this.flowPath.setAttribute('stroke', '#14b8a6');
    this.flowPath.setAttribute('stroke-width', '2');
    this.flowPath.setAttribute('stroke-linejoin', 'round');
    this.flowPath.setAttribute('stroke-linecap', 'round');
    this.svg.appendChild(this.flowPath);
  }

  update(history = []) {
    if (!history || history.length === 0) {
      this.reset();
      return;
    }

    // Downsample points if buffer is large for performance
    const step = history.length > 500 ? Math.ceil(history.length / 500) : 1;

    let dYield = '';
    let dFlow = '';

    for (let i = 0; i < history.length; i += step) {
      const pt = history[i];
      const x = this.mapX(pt.time);
      const yYield = this.mapYieldY(pt.yield);
      const yFlow = this.mapFlowY(pt.flowRate);

      if (i === 0) {
        dYield += `M ${x.toFixed(1)} ${yYield.toFixed(1)}`;
        dFlow += `M ${x.toFixed(1)} ${yFlow.toFixed(1)}`;
      } else {
        dYield += ` L ${x.toFixed(1)} ${yYield.toFixed(1)}`;
        dFlow += ` L ${x.toFixed(1)} ${yFlow.toFixed(1)}`;
      }
    }

    if (this.yieldPath) this.yieldPath.setAttribute('d', dYield);
    if (this.flowPath) this.flowPath.setAttribute('d', dFlow);
  }

  reset() {
    if (this.yieldPath) this.yieldPath.setAttribute('d', '');
    if (this.flowPath) this.flowPath.setAttribute('d', '');
  }
}
