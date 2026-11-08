export class CanvasStreamRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = 460;
    this.height = 440;
    this.liquidHeight = 0;
    this.cremaHeight = 0;

    // Droplets state
    this.beadOffsets = [-45, -35, -25, -15, -5, 5, 15, 25, 35, 45];
    this.fallingDrops = [];

    this.setupResolution();
  }

  setupResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  getColorForBlonding(blondingFraction) {
    // Interpolate between dark umber (0.0) -> rich caramel (0.4) -> blonding straw amber (1.0)
    const bf = Math.min(1.0, Math.max(0.0, blondingFraction));
    if (bf < 0.4) {
      const t = bf / 0.4;
      const r = Math.round(43 + (160 - 43) * t);
      const g = Math.round(24 + (82 - 24) * t);
      const b = Math.round(16 + (45 - 16) * t);
      const a = 0.95 - 0.05 * t;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      const t = (bf - 0.4) / 0.6;
      const r = Math.round(160 + (222 - 160) * t);
      const g = Math.round(82 + (184 - 82) * t);
      const b = Math.round(45 + (135 - 45) * t);
      const a = 0.90 - 0.25 * t;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  render(telemetry = {}) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const phase = telemetry.phase || 'IDLE';
    const flowRate = telemetry.flowRate || 0.0;
    const yieldGrams = telemetry.yield || 0.0;
    const targetYield = telemetry.targetYield || 36.0;
    const blonding = telemetry.blondingFraction || 0.0;
    const pressure = telemetry.pressure || 0.0;

    // 1. Draw 58mm Bottomless Portafilter & Basket
    this.drawPortafilter(ctx);

    // 2. Pre-infusion beads on basket screen
    if (phase === 'PRE_INFUSION') {
      this.drawPreInfusionBeads(ctx, pressure);
    }

    // 3. Extraction stream & droplets
    if (phase === 'EXTRACTING' && flowRate > 0) {
      this.drawStreamCone(ctx, flowRate, blonding);
    }

    // Update and draw detached droplets
    this.updateAndDrawDroplets(ctx, flowRate, blonding, phase);

    // 4. Glass collection cup & accumulated espresso / crema
    this.drawCupAndLiquids(ctx, yieldGrams, targetYield, blonding, flowRate, phase);
  }

  drawPortafilter(ctx) {
    const cx = 230;
    const cy = 30;

    ctx.save();

    // Metallic Portafilter ears and rim
    const rimGrad = ctx.createLinearGradient(cx - 90, cy, cx + 90, cy);
    rimGrad.addColorStop(0, '#55555d');
    rimGrad.addColorStop(0.2, '#9999a4');
    rimGrad.addColorStop(0.5, '#e0e0ea');
    rimGrad.addColorStop(0.8, '#888894');
    rimGrad.addColorStop(1, '#44444c');

    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 85, cy - 14, 170, 18, 4);
    ctx.fill();

    // Basket body
    const basketGrad = ctx.createLinearGradient(cx - 70, cy, cx + 70, cy);
    basketGrad.addColorStop(0, '#2e2e34');
    basketGrad.addColorStop(0.5, '#5a5a66');
    basketGrad.addColorStop(1, '#2e2e34');

    ctx.fillStyle = basketGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy + 4);
    ctx.lineTo(cx + 70, cy + 4);
    ctx.lineTo(cx + 60, cy + 32);
    ctx.lineTo(cx - 60, cy + 32);
    ctx.closePath();
    ctx.fill();

    // Bottomless basket opening and screen plate
    ctx.fillStyle = '#18181c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 32, 58, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mesh holes pattern
    ctx.fillStyle = '#3a3a42';
    for (let x = cx - 45; x <= cx + 45; x += 10) {
      for (let y = cy + 26; y <= cy + 38; y += 4) {
        if (Math.hypot((x - cx) / 52, (y - (cy + 32)) / 9) < 0.9) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  drawPreInfusionBeads(ctx, pressure) {
    const cx = 230;
    const cy = 62;
    const progress = Math.min(1.0, pressure / 9.0);

    ctx.save();
    ctx.fillStyle = 'rgba(38, 20, 14, 0.95)';

    this.beadOffsets.forEach((dx, i) => {
      const radius = (1.5 + Math.sin(i * 1.5) * 0.8) * progress;
      if (radius > 0.5) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + Math.sin(i) * 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  drawStreamCone(ctx, flowRate, blondingFraction) {
    const cx = 230;
    const topY = 64;
    const cupEntryY = 305;
    const color = this.getColorForBlonding(blondingFraction);

    ctx.save();

    // Fluid stream width based on flow rate: ~3px at trickle, up to 9px at high flow
    const streamWidth = Math.min(10.0, Math.max(2.5, 2.5 + Math.sqrt(flowRate) * 2.8));

    // Outer stream cone converging from basket
    ctx.beginPath();
    ctx.moveTo(cx - 38, topY);
    ctx.quadraticCurveTo(cx - streamWidth, topY + 40, cx - streamWidth / 2, cupEntryY);
    ctx.lineTo(cx + streamWidth / 2, cupEntryY);
    ctx.quadraticCurveTo(cx + streamWidth, topY + 40, cx + 38, topY);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // Internal highlight / tiger stripe core
    if (blondingFraction < 0.75) {
      ctx.beginPath();
      ctx.moveTo(cx - 15, topY);
      ctx.quadraticCurveTo(cx - streamWidth * 0.3, topY + 30, cx - streamWidth * 0.2, cupEntryY);
      ctx.lineTo(cx + streamWidth * 0.2, cupEntryY);
      ctx.quadraticCurveTo(cx + streamWidth * 0.3, topY + 30, cx + 15, topY);
      ctx.closePath();

      ctx.fillStyle = blondingFraction < 0.3 ? 'rgba(212, 142, 56, 0.75)' : 'rgba(235, 190, 120, 0.5)';
      ctx.fill();
    }

    ctx.restore();
  }

  updateAndDrawDroplets(ctx, flowRate, blondingFraction, phase) {
    const cx = 230;
    const cupEntryY = 305;
    const color = this.getColorForBlonding(blondingFraction);

    // Spawn falling droplets during extraction or pre-infusion breakthrough
    if (phase === 'EXTRACTING' && flowRate > 0) {
      if (Math.random() < 0.35) {
        this.fallingDrops.push({
          x: cx + (Math.random() - 0.5) * 12,
          y: 70,
          vy: 3 + Math.random() * 4,
          radius: 1.5 + Math.random() * 1.5,
          color: color
        });
      }
    }

    // Update and draw active droplets
    for (let i = this.fallingDrops.length - 1; i >= 0; i--) {
      const drop = this.fallingDrops[i];
      drop.y += drop.vy;
      drop.vy += 0.4; // gravity

      if (drop.y >= cupEntryY) {
        this.fallingDrops.splice(i, 1);
        continue;
      }

      ctx.fillStyle = drop.color;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCupAndLiquids(ctx, yieldGrams, targetYield, blondingFraction, flowRate, phase) {
    const cupX = 160;
    const cupY = 280;
    const cupW = 140;
    const cupH = 130;
    const cupBottomY = cupY + cupH - 12;

    ctx.save();

    // 1. Cup background / inner shadow
    ctx.fillStyle = 'rgba(20, 20, 24, 0.55)';
    ctx.beginPath();
    ctx.roundRect(cupX + 10, cupY + 15, cupW - 20, cupH - 22, [0, 0, 16, 16]);
    ctx.fill();

    // 2. Liquid level accumulation
    const maxFillH = 75; // max liquid height in pixels
    const targetHeight = Math.min(maxFillH, (yieldGrams / 50.0) * maxFillH);
    this.liquidHeight += (targetHeight - this.liquidHeight) * 0.15;

    if (this.liquidHeight > 1.5) {
      const currentLiquidTop = cupBottomY - this.liquidHeight;

      // Draw liquid body
      const liquidGrad = ctx.createLinearGradient(cupX, currentLiquidTop, cupX, cupBottomY);
      liquidGrad.addColorStop(0, this.getColorForBlonding(blondingFraction));
      liquidGrad.addColorStop(1, '#23120b');

      ctx.fillStyle = liquidGrad;
      ctx.beginPath();
      ctx.rect(cupX + 12, currentLiquidTop, cupW - 24, this.liquidHeight);
      ctx.fill();

      // 3. Crema foam layer
      const cremaTargetH = phase === 'EXTRACTING' ? Math.min(14, 4 + flowRate * 2.5) : 8.0;
      this.cremaHeight += (cremaTargetH - this.cremaHeight) * 0.1;

      const cremaTop = currentLiquidTop - this.cremaHeight;
      const cremaGrad = ctx.createLinearGradient(cupX, cremaTop, cupX, currentLiquidTop);
      cremaGrad.addColorStop(0, '#d89b53');
      cremaGrad.addColorStop(0.5, '#b97a38');
      cremaGrad.addColorStop(1, '#663914');

      ctx.fillStyle = cremaGrad;
      ctx.beginPath();
      ctx.ellipse(cupX + cupW / 2, currentLiquidTop - this.cremaHeight / 2, (cupW - 24) / 2, this.cremaHeight / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tiger streak speckles on crema
      ctx.fillStyle = 'rgba(75, 36, 15, 0.4)';
      for (let i = 0; i < 6; i++) {
        const sx = cupX + 24 + i * 16;
        const sy = currentLiquidTop - this.cremaHeight / 2 + Math.sin(i * 2.3) * 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4, 1.5, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Glass cup outlines, specular reflections, and rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cupX + 10, cupY + 15, cupW - 20, cupH - 22, [0, 0, 16, 16]);
    ctx.stroke();

    // Cup rim ellipse
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cupX + cupW / 2, cupY + 15, (cupW - 20) / 2, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Glass reflection highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cupX + 18, cupY + 30);
    ctx.lineTo(cupX + 18, cupBottomY - 10);
    ctx.stroke();

    // Digital scale platform beneath the glass
    ctx.fillStyle = '#222228';
    ctx.beginPath();
    ctx.roundRect(cupX - 10, cupBottomY + 4, cupW + 20, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#444450';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale display readout
    ctx.fillStyle = '#0bf';
    ctx.font = 'bold 12px "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${yieldGrams.toFixed(1)} g`, cupX + cupW / 2, cupBottomY + 16);

    ctx.restore();
  }

  reset() {
    this.liquidHeight = 0;
    this.cremaHeight = 0;
    this.fallingDrops = [];
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawPortafilter(ctx);
  }
}
