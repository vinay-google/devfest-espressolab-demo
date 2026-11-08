export function evaluateShot(metrics = {}) {
  const dose = metrics.dose || 18.0;
  const yieldGrams = metrics.yield || 36.0;
  const shotTime = metrics.shotTime || 27.0;
  const temperature = metrics.temperature || 93.0;
  const ey = metrics.ey !== undefined ? metrics.ey : (metrics.yield / dose) * 10;
  const ratio = metrics.ratio !== undefined ? metrics.ratio : (yieldGrams / dose);
  const targetYield = metrics.targetYield || 36.0;

  // Tier 1: Check Hydraulic Flow & Shot Time (Priority 1: Grind Size)
  if (shotTime < 22.0 || (yieldGrams / Math.max(shotTime, 1.0) > 2.6 && shotTime < 24.0)) {
    return {
      type: 'GUSHER',
      badgeClass: 'badge-warning',
      badgeText: 'GUSHER',
      title: 'Fast Channeling',
      diagnosis: `Puck resistance too low; water channeled through in ${shotTime.toFixed(1)}s.`,
      action: 'Grind finer by 40-60µm.',
      tasteNotes: ['Sharp Sourness', 'Thin/Watery Body']
    };
  }

  if (shotTime >= 45.0 || (yieldGrams < targetYield * 0.75 && shotTime >= 35.0)) {
    return {
      type: 'CHOKED',
      badgeClass: 'badge-danger',
      badgeText: 'CHOKED',
      title: 'Severe Restriction',
      diagnosis: 'Flow choked by fine grind or over-dosing.',
      action: 'Grind coarser by 30-50µm or reduce dose by 1.0g.',
      tasteNotes: ['Intense Bitterness', 'Astringent Dryness']
    };
  }

  // Tier 2: Check Brew Ratio Balance (Priority 2: Target Yield)
  if (ratio < 1.85) {
    return {
      type: 'UNDER_EXTRACTED_RATIO',
      badgeClass: 'badge-warning',
      badgeText: 'UNDER-EXTRACTED',
      title: 'Short Brew Ratio',
      diagnosis: `Shot stopped too early (1:${ratio.toFixed(2)}); organic acids dominate cup.`,
      action: 'Increase target yield to 1:2.0 ratio.',
      tasteNotes: ['Lemon Acidity', 'Unbalanced Sourness']
    };
  }

  if (ratio > 2.35) {
    return {
      type: 'OVER_EXTRACTED_RATIO',
      badgeClass: 'badge-warning',
      badgeText: 'OVER-EXTRACTED',
      title: 'Excessive Yield',
      diagnosis: `Shot run too long (1:${ratio.toFixed(2)}); bitter tannins dissolved.`,
      action: 'Decrease target yield to 1:2.0 ratio.',
      tasteNotes: ['Hollow Woodiness', 'Ashy Bitterness']
    };
  }

  // Tier 3: Check Thermal Optimization (Priority 3: Water Temp)
  if (temperature < 91.5 && ey < 19.0) {
    return {
      type: 'TEMP_COLD',
      badgeClass: 'badge-info',
      badgeText: 'SOUR (COLD)',
      title: 'Low Brew Temperature',
      diagnosis: `Extraction at ${temperature.toFixed(1)}°C failed to dissolve complex sucrose.`,
      action: 'Raise boiler temperature to 93-94°C.',
      tasteNotes: ['Green Apple Sour', 'Under-developed Sweetness']
    };
  }

  if (temperature > 95.0) {
    return {
      type: 'TEMP_HOT',
      badgeClass: 'badge-info',
      badgeText: 'BITTER (HOT)',
      title: 'High Brew Temperature',
      diagnosis: `Extraction at ${temperature.toFixed(1)}°C scorched fine solubles.`,
      action: 'Lower boiler temperature to 92-93°C.',
      tasteNotes: ['Scorched Bitterness', 'Harsh Finish']
    };
  }

  // Tier 4: God Shot (Balanced)
  return {
    type: 'GOD_SHOT',
    badgeClass: 'badge-success',
    badgeText: 'GOD SHOT',
    title: 'Balanced Extraction',
    diagnosis: `Ideal ${ey.toFixed(1)}% EY at 1:${ratio.toFixed(1)} ratio in ${shotTime.toFixed(1)}s.`,
    action: 'Profile dialed in perfectly. Repeat consistently!',
    tasteNotes: ['Vibrant Sweetness', 'Silky Body', 'Complex Acidity', 'Long Cocoa Finish']
  };
}
