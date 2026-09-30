/**
 * Hand-rolled Lightweight 2D Canvas Chart Renderer for Argo CTD Ocean Profiles
 * Plots Depth (Y axis, inverted: 0m at top -> 2000m at bottom) vs Temperature (°C) & Salinity (PSU)
 */

export function renderArgoProfileChart(canvas, profileData) {
  if (!canvas || !profileData || profileData.length === 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set high-DPI canvas resolution
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Margins for axes
  const margin = { top: 28, right: 35, bottom: 30, left: 48 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Clear background
  ctx.fillStyle = '#070921';
  ctx.fillRect(0, 0, width, height);

  // Depth range: 0 to 2000 m (Top to Bottom)
  const maxDepth = 2000;
  const depthToY = (d) => margin.top + (d / maxDepth) * plotH;

  // Temperature range: ~0 to 32 °C
  const minTemp = 0;
  const maxTemp = 32;
  const tempToX = (t) => margin.left + ((t - minTemp) / (maxTemp - minTemp)) * plotW;

  // Salinity range: 32 to 38 PSU
  const minSal = 32.5;
  const maxSal = 37.5;
  const salToX = (s) => margin.left + ((s - minSal) / (maxSal - minSal)) * plotW;

  // 1. Draw Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#8e9bb0';
  ctx.font = '9px "JetBrains Mono", monospace';

  // Depth grid lines (horizontal)
  const depthTicks = [0, 200, 500, 1000, 1500, 2000];
  depthTicks.forEach(d => {
    const y = depthToY(d);
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotW, y);
    ctx.stroke();

    // Depth label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText(`${d}m`, margin.left - 6, y);
  });

  // Vertical grid lines
  for (let i = 0; i <= 4; i++) {
    const x = margin.left + (i / 4) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + plotH);
    ctx.stroke();
  }

  // 2. Draw Top Axis (Temperature °C)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#ff5252';
  [0, 10, 20, 30].forEach(t => {
    const x = tempToX(t);
    ctx.fillText(`${t}°C`, x, margin.top - 6);
  });

  // 3. Draw Bottom Axis (Salinity PSU)
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#00b4d8';
  [33, 34.5, 36, 37.5].forEach(s => {
    const x = salToX(s);
    ctx.fillText(`${s}`, x, margin.top + plotH + 8);
  });
  ctx.fillText('PSU', margin.left + plotW + 15, margin.top + plotH + 8);

  // 4. Draw Salinity Profile Curve (Cyan)
  ctx.save();
  ctx.strokeStyle = '#00b4d8';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = 'rgba(0, 180, 216, 0.6)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  profileData.forEach((pt, idx) => {
    const x = salToX(pt.salinity);
    const y = depthToY(pt.depth);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // 5. Draw Temperature Profile Curve (Coral/Red)
  ctx.save();
  ctx.strokeStyle = '#ff5252';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(255, 82, 82, 0.7)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  profileData.forEach((pt, idx) => {
    const x = tempToX(pt.temp);
    const y = depthToY(pt.depth);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // 6. Draw Data Points on Curves
  profileData.forEach(pt => {
    const y = depthToY(pt.depth);

    // Temp Point
    const tx = tempToX(pt.temp);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tx, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Salinity Point
    const sx = salToX(pt.salinity);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00b4d8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
